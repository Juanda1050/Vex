import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { AUTH_REDIRECTS } from "./constants";
import type { TenantContext } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function getSupabaseUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

async function getTenantMember(userId: string) {
  return prisma.tenantUser.findFirst({
    where: { userId },
    include: {
      tenant: {
        include: {
          branches: {
            where: { isDefault: true },
            take: 1,
          },
        },
      },
      branch: {
        include: {
          warehouses: {
            where: { isDefault: true },
            take: 1,
          },
        },
      },
    },
  });
}

function resolveBranchId(
  member: NonNullable<Awaited<ReturnType<typeof getTenantMember>>>,
): string | null {
  return member.branchId ?? member.tenant.branches[0]?.id ?? null;
}

function resolveWarehouseId(
  member: NonNullable<Awaited<ReturnType<typeof getTenantMember>>>,
): string | null {
  return member.branch?.warehouses[0]?.id ?? null;
}

export async function getCurrentTenant(): Promise<TenantContext> {
  const locale = await getLocale();

  const { user, error } = await getSupabaseUser();
  if (error || !user) redirect(AUTH_REDIRECTS.login(locale));

  const member = await getTenantMember(user.id);
  if (!member) redirect(AUTH_REDIRECTS.onboarding(locale));

  const branchId = resolveBranchId(member);
  if (!branchId) redirect(AUTH_REDIRECTS.onboarding(locale));

  const warehouseId = resolveWarehouseId(member);
  if (!warehouseId) redirect(AUTH_REDIRECTS.onboarding(locale));

  return {
    userId: user.id,
    email: user.email!,
    tenantId: member.tenantId,
    branchId,
    warehouseId,
    role: member.role,
    tenantName: member.tenant.name,
  };
}
