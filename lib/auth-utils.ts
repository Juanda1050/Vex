import { createClient } from "./supabase";
import { prisma } from "./prisma";

export async function getCurrentTenant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const membership = await prisma.tenantMember.findFirst({
    where: {
      userId: user.id,
      isActive: true,
    },
    include: {
      tenant: {
        include: {
          settings: true,
        },
      },
    },
  });

  return membership ? membership.tenant : null;
}
