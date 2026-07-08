"use client";

import * as React from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  Building2,
  Copy,
  Mail,
  MessageSquare,
  ShieldCheck,
  Users,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  createInvitationAction,
  updateCompanyAction,
  updateMemberRoleAction,
  updatePasswordAction,
  updateProfileAction,
  type ActionResult,
} from "@/app/actions/settings";
import { PreferencesPanel } from "@/components/settings/preferences-panel";
import { SettingsPlanComparison } from "@/components/subscriptions/settings-plan-comparison";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SubscriptionPlanSummary } from "@/server/subscriptions";

type TenantSnapshot = {
  id: string;
  name: string;
  legalName: string | null;
  industry: string | null;
  countryCode: string | null;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
};

type CurrentUserSnapshot = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  authProvider: string | null;
};

type MemberRow = {
  id: string;
  userId: string;
  role: string;
  isActive: boolean;
  userProfile: {
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    authProvider: string | null;
  } | null;
  branch: {
    name: string;
  } | null;
};

type SettingsDashboardProps = {
  locale: string;
  tenant: TenantSnapshot;
  currentUser: CurrentUserSnapshot;
  members: MemberRow[];
  plans: SubscriptionPlanSummary[];
  currentPlanCode: string | null;
  canManageBilling: boolean;
  canManageCompanySections: boolean;
  subscriptionUsage: {
    products: number;
    warehouses: number;
    users: number;
  };
};

const roleOptions = [
  "READ_ONLY",
  "SELLER",
  "WAREHOUSE",
  "PURCHASING",
  "ADMIN",
  "OWNER",
] as const;
const inviteChannels = ["EMAIL", "WHATSAPP"] as const;

const initialResult: ActionResult = {
  success: false,
  error: null,
  errorKey: null,
  status: undefined,
  inviteUrl: null,
  mailtoUrl: null,
  whatsappUrl: null,
};

function isGoogleOAuth(provider: string | null) {
  return provider === "google";
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function AvatarPreview({
  avatarUrl,
  alt,
}: {
  avatarUrl: string | null;
  alt: string;
}) {
  if (!avatarUrl) {
    return (
      <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/50 text-xs text-muted-foreground">
        <WandSparkles className="size-4" />
      </div>
    );
  }

  return (
    <Image
      src={avatarUrl}
      alt={alt}
      width={64}
      height={64}
      unoptimized
      className="size-16 rounded-2xl border border-border object-cover"
    />
  );
}

function ProfileSecurityCard({
  currentUser,
}: {
  currentUser: CurrentUserSnapshot;
}) {
  const t = useTranslations("settings");
  const isOAuthLocked = isGoogleOAuth(currentUser.authProvider);

  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialResult,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePasswordAction,
    initialResult,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentUser.avatarUrl,
  );
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profileState.success) {
      toast.success(t("messages.profileSaved"));
    }

    if (profileState.error) {
      toast.error(profileState.error);
    }
  }, [profileState, t]);

  useEffect(() => {
    if (passwordState.success) {
      toast.success(t("messages.passwordUpdated"));
    }

    if (passwordState.error) {
      toast.error(passwordState.error);
    }
  }, [passwordState, t]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("messages.avatarTooLarge"));
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setAvatarDataUrl(result);
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          {t("sections.profileSecurity")}
        </CardTitle>
        <CardDescription>
          {t("sections.profileSecurityDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={profileAction} className="space-y-4">
          <input
            type="hidden"
            name="avatarDataUrl"
            value={avatarDataUrl ?? ""}
          />
          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("fields.avatar")}
              </p>
              <AvatarPreview
                avatarUrl={avatarPreview}
                alt={currentUser.fullName ?? currentUser.email}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="avatarFile">{t("fields.avatarUpload")}</Label>
                <Input
                  id="avatarFile"
                  name="avatarFile"
                  type="file"
                  accept="image/*"
                  disabled={profilePending || isOAuthLocked}
                  onChange={handleAvatarChange}
                />
                <p className="text-xs text-muted-foreground">
                  {t("messages.avatarLimit")}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">{t("fields.fullName")}</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={currentUser.fullName ?? ""}
                  disabled={profilePending || isOAuthLocked}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("fields.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={currentUser.email}
                  disabled={profilePending || isOAuthLocked}
                  required
                />
              </div>
            </div>
          </div>

          {isOAuthLocked ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              {t("messages.oauthLocked")}
            </p>
          ) : null}

          <Button type="submit" disabled={profilePending} className="w-fit">
            {t("actions.saveProfile")}
          </Button>
        </form>

        {!isOAuthLocked ? (
          <form
            action={passwordAction}
            className="grid gap-4 rounded-2xl border border-border/70 bg-muted/25 p-4"
          >
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {t("security.changePassword")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t("security.changePasswordDescription")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="password">{t("fields.newPassword")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  disabled={passwordPending}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">
                  {t("fields.confirmPassword")}
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  disabled={passwordPending}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={passwordPending}
              className="w-fit"
            >
              {t("actions.updatePassword")}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CompanyCard({ tenant }: { tenant: TenantSnapshot }) {
  const t = useTranslations("settings");
  const [companyState, companyAction, companyPending] = useActionState(
    updateCompanyAction,
    initialResult,
  );

  useEffect(() => {
    if (companyState.success) toast.success(t("messages.companySaved"));
    if (companyState.error) toast.error(companyState.error);
  }, [companyState, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          {t("sections.companyData")}
        </CardTitle>
        <CardDescription>
          {t("sections.companyDataDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={companyAction} className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="company-name">{t("fields.companyName")}</Label>
            <Input
              id="company-name"
              name="name"
              defaultValue={tenant.name}
              disabled={companyPending}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="legalName">{t("fields.legalName")}</Label>
            <Input
              id="legalName"
              name="legalName"
              defaultValue={tenant.legalName ?? ""}
              disabled={companyPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="industry">{t("fields.industry")}</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={tenant.industry ?? ""}
              disabled={companyPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="countryCode">{t("fields.countryCode")}</Label>
            <Input
              id="countryCode"
              name="countryCode"
              defaultValue={tenant.countryCode ?? ""}
              disabled={companyPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">{t("fields.phone")}</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={tenant.phone ?? ""}
              disabled={companyPending}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="address">{t("fields.address")}</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={tenant.address ?? ""}
              disabled={companyPending}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="logoUrl">{t("fields.logoUrl")}</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              defaultValue={tenant.logoUrl ?? ""}
              disabled={companyPending}
            />
          </div>
          <Button type="submit" className="w-fit" disabled={companyPending}>
            {t("actions.saveCompany")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InviteForm() {
  const t = useTranslations("settings");
  const [inviteState, inviteAction, invitePending] = useActionState(
    createInvitationAction,
    initialResult,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (inviteState.success) {
      toast.success(t("messages.inviteReady"));
    }

    if (inviteState.error) {
      toast.error(inviteState.error);
    }
  }, [inviteState, t]);

  const copyInvite = async () => {
    if (!inviteState.inviteUrl) return;
    await navigator.clipboard.writeText(inviteState.inviteUrl);
    setCopied(true);
    toast.success(t("messages.inviteCopied"));
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <form
        action={inviteAction}
        className="grid gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
      >
        <div className="grid gap-2">
          <Label htmlFor="invite-email">{t("fields.inviteEmail")}</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="name@company.com"
            disabled={invitePending}
            required
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-role">{t("fields.role")}</Label>
            <Select name="role" defaultValue="SELLER" disabled={invitePending}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(`roles.${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-channel">{t("fields.channel")}</Label>
            <Select
              name="channel"
              defaultValue="EMAIL"
              disabled={invitePending}
            >
              <SelectTrigger id="invite-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {inviteChannels.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {t(`channels.${channel}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={invitePending}
            className="w-full lg:w-auto"
          >
            {t("actions.generateInvite")}
          </Button>
        </div>
      </form>

      {inviteState.inviteUrl ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                {t("invitation.generatedTitle")}
              </p>
              <p className="text-sm text-muted-foreground">
                {inviteState.inviteUrl}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyInvite}
              >
                <Copy className="size-4" />
                {copied ? t("actions.copied") : t("actions.copyLink")}
              </Button>
              {inviteState.mailtoUrl ? (
                <a
                  href={inviteState.mailtoUrl}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                  )}
                >
                  <Mail className="size-4" />
                  {t("actions.sendEmail")}
                </a>
              ) : null}
              {inviteState.whatsappUrl ? (
                <a
                  href={inviteState.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  <MessageSquare className="size-4" />
                  {t("actions.sendWhatsApp")}
                </a>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function MemberRowForm({ member }: { member: MemberRow }) {
  const t = useTranslations("settings");
  const [state, action, pending] = useActionState(
    updateMemberRoleAction,
    initialResult,
  );
  const [role, setRole] = useState(member.role);

  useEffect(() => {
    if (state.success) toast.success(t("messages.memberRoleSaved"));
    if (state.error) toast.error(state.error);
  }, [state, t]);

  return (
    <tr className="border-b border-border/40 last:border-none">
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {member.userProfile?.fullName?.slice(0, 2)?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {member.userProfile?.fullName ??
                member.userProfile?.email ??
                member.userId}
            </p>
            <p className="text-xs text-muted-foreground">
              {member.userProfile?.email ?? member.userId}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-muted-foreground">
        {member.branch?.name ?? t("table.noBranch")}
      </td>
      <td className="px-3 py-3">
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="memberId" value={member.id} />
          <input type="hidden" name="role" value={role} />
          <Select value={role} onValueChange={setRole} disabled={pending}>
            <SelectTrigger className="min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((nextRole) => (
                <SelectItem key={nextRole} value={nextRole}>
                  {t(`roles.${nextRole}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={pending || role === member.role}
          >
            {t("actions.saveRole")}
          </Button>
        </form>
      </td>
      <td className="px-3 py-3 text-right">
        <Badge variant={member.isActive ? "success" : "warning"}>
          {member.isActive ? t("table.active") : t("table.inactive")}
        </Badge>
      </td>
    </tr>
  );
}

function MembersCard({ members }: { members: MemberRow[] }) {
  const t = useTranslations("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          {t("sections.companyMembers")}
        </CardTitle>
        <CardDescription>
          {t("sections.companyMembersDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <InviteForm />
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">{t("table.member")}</th>
                  <th className="px-3 py-3 font-medium">{t("table.branch")}</th>
                  <th className="px-3 py-3 font-medium">{t("table.role")}</th>
                  <th className="px-3 py-3 font-medium text-right">
                    {t("table.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <MemberRowForm key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BillingCard({
  plans,
  currentPlanCode,
  canManageBilling,
  usage,
}: {
  plans: SubscriptionPlanSummary[];
  currentPlanCode: string | null;
  canManageBilling: boolean;
  usage: {
    products: number;
    warehouses: number;
    users: number;
  };
}) {
  const t = useTranslations("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeCheck className="size-4 text-primary" />
          {t("sections.billing")}
        </CardTitle>
        <CardDescription>{t("sections.billingDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsPlanComparison
          plans={plans}
          currentPlanCode={currentPlanCode}
          canManageBilling={canManageBilling}
          usage={usage}
        />
      </CardContent>
    </Card>
  );
}

export function SettingsDashboard({
  locale,
  tenant,
  currentUser,
  members,
  plans,
  currentPlanCode,
  canManageBilling,
  canManageCompanySections,
  subscriptionUsage,
}: SettingsDashboardProps) {
  const t = useTranslations("settings");

  const sidebarItems = useMemo(
    () => [
      {
        id: "profile-security",
        label: t("sections.profileSecurity"),
        visible: true,
      },
      {
        id: "company-members",
        label: t("sections.companyMembers"),
        visible: canManageCompanySections,
      },
      {
        id: "billing-section",
        label: t("sections.billing"),
        visible: canManageCompanySections,
      },
      {
        id: "company-data",
        label: t("sections.companyData"),
        visible: canManageCompanySections,
      },
      {
        id: "preferences-section",
        label: t("sections.preferences"),
        visible: true,
      },
    ],
    [canManageCompanySections, t],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card className="border-border/80 bg-card/90">
          <CardHeader className="space-y-3">
            <Badge variant="info" className="w-fit">
              {t("sidebar.badge")}
            </Badge>
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{tenant.name}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {sidebarItems
              .filter((item) => item.visible)
              .map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-start",
                  )}
                >
                  {item.label}
                </a>
              ))}
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-6">
        <Section
          id="profile-security"
          title={t("sections.profileSecurity")}
          description={t("sections.profileSecurityDescription")}
        >
          <ProfileSecurityCard currentUser={currentUser} />
        </Section>

        {canManageCompanySections ? (
          <>
            <Section
              id="company-members"
              title={t("sections.companyMembers")}
              description={t("sections.companyMembersDescription")}
            >
              <MembersCard members={members} />
            </Section>

            <Section
              id="billing-section"
              title={t("sections.billing")}
              description={t("sections.billingDescription")}
            >
              <BillingCard
                plans={plans}
                currentPlanCode={currentPlanCode}
                canManageBilling={canManageBilling}
                usage={subscriptionUsage}
              />
            </Section>

            <Section
              id="company-data"
              title={t("sections.companyData")}
              description={t("sections.companyDataDescription")}
            >
              <CompanyCard tenant={tenant} />
            </Section>
          </>
        ) : null}

        <Section
          id="preferences-section"
          title={t("sections.preferences")}
          description={t("sections.preferencesDescription")}
        >
          <PreferencesPanel locale={locale} />
        </Section>
      </div>
    </div>
  );
}
