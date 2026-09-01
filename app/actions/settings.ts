"use server";

import { createHash, randomBytes } from "crypto";

import { UserRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { HTTP_STATUS } from "@/server/http-status";
import { prisma } from "@/lib/prisma";
import { ACCENT_COLOR_KEYS } from "@/lib/theme/accent-palettes";
import { authRepository } from "@/server/auth/repository/auth.repository";
import { requireAuth } from "@/server/auth";
import { sessionManager } from "@/server/auth/session/session.manager";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { writeAuditLog } from "@/server/audit-log";
import { userService } from "@/server/users";
import {
  buildLocalizedAbsoluteUrl,
  getAppUrl,
} from "@/server/auth/actions/action-helpers";

export type ActionResult = {
  success: boolean;
  error: string | null;
  errorKey?: string | null;
  status?: number;
  inviteUrl?: string | null;
  mailtoUrl?: string | null;
  whatsappUrl?: string | null;
};

const profileSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().trim().min(2).max(120),
  avatarDataUrl: z.string().trim().optional(),
});

const themeColorSchema = z.object({
  themeColor: z.enum(ACCENT_COLOR_KEYS as [string, ...string[]]),
});

const passwordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const companySchema = z.object({
  name: z.string().trim().min(2).max(120),
  legalName: z.string().trim().max(180).optional(),
  industry: z.string().trim().max(120).optional(),
  countryCode: z.string().trim().max(8).optional(),
  address: z.string().trim().max(240).optional(),
  phone: z.string().trim().max(40).optional(),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
});

const roleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.nativeEnum(UserRole),
});

const invitationSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  channel: z.enum(["EMAIL", "WHATSAPP"]),
});

const inviteAcceptanceSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(12),
    fullName: z.string().trim().min(2).max(120),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    avatarDataUrl: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords_mismatch",
    path: ["confirmPassword"],
  });

function toErrorResult(error: unknown, fallbackKey = "generic"): ActionResult {
  return {
    success: false,
    error: error instanceof Error ? error.message : "",
    errorKey: fallbackKey,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getDataUrlByteLength(value: string) {
  const base64Index = value.indexOf(",");
  if (base64Index === -1) return 0;

  const base64Payload = value.slice(base64Index + 1);
  return Buffer.from(base64Payload, "base64").byteLength;
}

function isDataUrlTooLarge(value: string | null | undefined) {
  if (!value) return false;
  return getDataUrlByteLength(value) > MAX_AVATAR_BYTES;
}

function isAllowedAvatarDataUrl(value: string | null | undefined) {
  if (!value) return true;

  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match || !ALLOWED_AVATAR_MIME_TYPES.has(match[1])) return false;

  const bytes = Buffer.from(match[2], "base64");
  const isPng =
    match[1] === "image/png" &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg =
    match[1] === "image/jpeg" &&
    bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const isWebp =
    match[1] === "image/webp" &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";

  return isPng || isJpeg || isWebp;
}

function isElevatedRole(role: string) {
  return role === "OWNER" || role === "ADMIN";
}

async function getCurrentUser() {
  const ctx = await requireAuth();
  return ctx;
}

export async function updateProfileAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await getCurrentUser();
    const t = await getTranslations("settings");
    const file = formData.get("avatarFile");
    const parsed = profileSchema.safeParse({
      email: formData.get("email")?.toString(),
      fullName: formData.get("fullName")?.toString() ?? "",
      avatarDataUrl: formData.get("avatarDataUrl")?.toString(),
    });

    if (!parsed.success) {
      return {
        success: false,
        error: t("messages.validationError"),
        errorKey: parsed.error.issues[0]?.message ?? "generic",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (ctx.authProvider === "google") {
      return {
        success: false,
        error: t("messages.oauthLocked"),
        errorKey: "oauthLocked",
        status: HTTP_STATUS.FORBIDDEN,
      };
    }

    let avatarDataUrl = parsed.data.avatarDataUrl ?? null;
    if (file instanceof File && file.size > 0) {
      if (
        file.size > MAX_AVATAR_BYTES ||
        !ALLOWED_AVATAR_MIME_TYPES.has(file.type)
      ) {
        return {
          success: false,
          error: t("messages.avatarTooLarge"),
          errorKey: "avatarTooLarge",
          status: HTTP_STATUS.BAD_REQUEST,
        };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      avatarDataUrl = `data:${file.type || "image/png"};base64,${buffer.toString("base64")}`;
    }

    if (
      isDataUrlTooLarge(avatarDataUrl) ||
      !isAllowedAvatarDataUrl(avatarDataUrl)
    ) {
      return {
        success: false,
        error: t("messages.avatarTooLarge"),
        errorKey: "avatarTooLarge",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (parsed.data.email && parsed.data.email !== ctx.email) {
      await sessionManager.updateEmail(parsed.data.email);
    }

    await sessionManager.updateUserMetadata({
      fullName: parsed.data.fullName,
      avatarUrl: avatarDataUrl,
    });

    await authRepository.upsertUserProfileFromSession({
      userId: ctx.userId,
      email: parsed.data.email ?? ctx.email,
      fullName: parsed.data.fullName,
      avatarUrl: avatarDataUrl,
      authProvider: ctx.authProvider ?? null,
    });

    return {
      success: true,
      error: null,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function updateThemeColorAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await getCurrentUser();
    const parsed = themeColorSchema.safeParse({
      themeColor: formData.get("themeColor")?.toString() ?? "",
    });

    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid theme color.",
        errorKey: "invalidPayload",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    await authRepository.updateThemeColor(ctx.userId, parsed.data.themeColor);

    return {
      success: true,
      error: null,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function updatePasswordAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await getCurrentUser();
    const t = await getTranslations("settings");
    const parsed = passwordSchema.safeParse({
      password: formData.get("password")?.toString() ?? "",
      confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
    });

    if (
      !parsed.success ||
      parsed.data.password !== parsed.data.confirmPassword
    ) {
      return {
        success: false,
        error: t("messages.validationError"),
        errorKey: "passwords_mismatch",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (ctx.authProvider === "google") {
      return {
        success: false,
        error: t("messages.oauthLocked"),
        errorKey: "oauthLocked",
        status: HTTP_STATUS.FORBIDDEN,
      };
    }

    const { error } = await sessionManager.updatePassword(parsed.data.password);
    if (error) {
      return {
        success: false,
        error: error.message,
        errorKey: "generic",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    return {
      success: true,
      error: null,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function updateCompanyAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await getCurrentUser();
    const t = await getTranslations("settings");

    if (!isElevatedRole(ctx.role)) {
      return {
        success: false,
        error: t("messages.rbacRestricted"),
        errorKey: "rbacRestricted",
        status: HTTP_STATUS.FORBIDDEN,
      };
    }

    const parsed = companySchema.safeParse({
      name: formData.get("name")?.toString() ?? "",
      legalName: formData.get("legalName")?.toString() || undefined,
      industry: formData.get("industry")?.toString() || undefined,
      countryCode: formData.get("countryCode")?.toString() || undefined,
      address: formData.get("address")?.toString() || undefined,
      phone: formData.get("phone")?.toString() || undefined,
      logoUrl: formData.get("logoUrl")?.toString() || undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: t("messages.validationError"),
        errorKey: parsed.error.issues[0]?.message ?? "generic",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        name: parsed.data.name,
        legalName: parsed.data.legalName ?? null,
        industry: parsed.data.industry ?? null,
        countryCode: parsed.data.countryCode ?? null,
        address: parsed.data.address ?? null,
        phone: parsed.data.phone ?? null,
        logoUrl: parsed.data.logoUrl || null,
      },
    });

    return {
      success: true,
      error: null,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function updateMemberRoleAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await getCurrentUser();
    const t = await getTranslations("settings");

    if (!isElevatedRole(ctx.role)) {
      return {
        success: false,
        error: t("messages.rbacRestricted"),
        errorKey: "rbacRestricted",
        status: HTTP_STATUS.FORBIDDEN,
      };
    }

    const parsed = roleSchema.safeParse({
      memberId: formData.get("memberId")?.toString() ?? "",
      role: formData.get("role")?.toString(),
    });

    if (!parsed.success) {
      return {
        success: false,
        error: t("messages.validationError"),
        errorKey: parsed.error.issues[0]?.message ?? "generic",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    await prisma.tenantMember.updateMany({
      where: {
        id: parsed.data.memberId,
        tenantId: ctx.tenantId,
      },
      data: {
        role: parsed.data.role,
      },
    });

    await writeAuditLog({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "ROLE_UPDATED",
      resourceType: "tenant_member",
      resourceId: parsed.data.memberId,
      metadata: { role: parsed.data.role },
    });

    return {
      success: true,
      error: null,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function createInvitationAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await getCurrentUser();
    const t = await getTranslations("settings");

    const rateLimit = await checkRateLimit(
      ctx.userId,
      "create-invitation",
      RATE_LIMIT_PRESETS.mutation,
    );
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: t("messages.genericError"),
        errorKey: "generic",
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
      };
    }

    if (!isElevatedRole(ctx.role)) {
      return {
        success: false,
        error: t("messages.rbacRestricted"),
        errorKey: "rbacRestricted",
        status: HTTP_STATUS.FORBIDDEN,
      };
    }

    const parsed = invitationSchema.safeParse({
      email: formData.get("email")?.toString() ?? "",
      role: formData.get("role")?.toString(),
      channel: formData.get("channel")?.toString(),
    });

    if (!parsed.success) {
      return {
        success: false,
        error: t("messages.validationError"),
        errorKey: parsed.error.issues[0]?.message ?? "generic",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    const appUrl = await getAppUrl();
    if (!appUrl) {
      return {
        success: false,
        error: t("messages.genericError"),
        errorKey: "generic",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      };
    }

    const token = randomBytes(24).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await prisma.invitation.create({
      data: {
        tenantId: ctx.tenantId,
        email: parsed.data.email,
        role: parsed.data.role,
        channel: parsed.data.channel,
        tokenHash,
        invitedByUserId: ctx.userId,
        expiresAt,
      },
    });

    const inviteUrl = `${appUrl}/invite?email=${encodeURIComponent(parsed.data.email)}&token=${encodeURIComponent(token)}`;
    const inviteMessage = t("invitation.shareMessage", {
      email: parsed.data.email,
      url: inviteUrl,
      company: ctx.tenantName,
    });

    return {
      success: true,
      error: null,
      status: HTTP_STATUS.OK,
      inviteUrl,
      mailtoUrl: `mailto:${parsed.data.email}?subject=${encodeURIComponent(t("invitation.emailSubject", { company: ctx.tenantName }))}&body=${encodeURIComponent(inviteMessage)}`,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`,
    };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function acceptInvitationAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const t = await getTranslations("auth");
    const parsed = inviteAcceptanceSchema.safeParse({
      email: formData.get("email")?.toString() ?? "",
      token: formData.get("token")?.toString() ?? "",
      fullName: formData.get("fullName")?.toString() ?? "",
      password: formData.get("password")?.toString() ?? "",
      confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
      avatarDataUrl: formData.get("avatarDataUrl")?.toString() || undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: t("errors.invalidCredentials"),
        errorKey: parsed.error.issues[0]?.message ?? "generic",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    const tokenHash = hashToken(parsed.data.token);
    const invitation = await prisma.invitation.findFirst({
      where: {
        email: parsed.data.email,
        tokenHash,
        status: "PENDING",
      },
    });

    if (!invitation) {
      return {
        success: false,
        error: t("errors.invalidVerificationLink"),
        errorKey: "invalidVerificationLink",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });

      return {
        success: false,
        error: t("errors.invalidVerificationLink"),
        errorKey: "invalidVerificationLink",
        status: HTTP_STATUS.NOT_FOUND,
      };
    }

    const appUrl = await getAppUrl();
    const callbackUrl = appUrl
      ? buildLocalizedAbsoluteUrl(
          appUrl,
          routing.defaultLocale,
          "/auth/callback",
        )
      : undefined;

    const { data, error } = await sessionManager.signUp(
      parsed.data.email,
      parsed.data.password,
      callbackUrl,
    );

    if (error) {
      return {
        success: false,
        error: t("errors.invalidCredentials"),
        errorKey: "generic",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: t("errors.userNotCreated"),
        errorKey: "userNotCreated",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      };
    }

    if (
      isDataUrlTooLarge(parsed.data.avatarDataUrl) ||
      !isAllowedAvatarDataUrl(parsed.data.avatarDataUrl)
    ) {
      return {
        success: false,
        error: t("invite.avatarTooLarge"),
        errorKey: "avatarTooLarge",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    await sessionManager
      .updateUserMetadata({
        fullName: parsed.data.fullName,
        avatarUrl: parsed.data.avatarDataUrl ?? null,
      })
      .catch(() => undefined);

    await authRepository.upsertUserProfileFromSession({
      userId: data.user.id,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      avatarUrl: parsed.data.avatarDataUrl ?? null,
      authProvider: "email",
    });

    await userService.createTenantUser({
      tenantId: invitation.tenantId,
      userId: data.user.id,
      role: invitation.role,
      branchId: null,
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedByUserId: data.user.id,
      },
    });

    return {
      success: true,
      error: null,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    return toErrorResult(error);
  }
}
