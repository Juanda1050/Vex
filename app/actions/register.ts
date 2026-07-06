"use server";

import { createClient } from "@/lib/supabase";
import { TenantService } from "@/server/services/tenant.service";

const tenantService = new TenantService();

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const companyName = formData.get("companyName") as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) return { error: error?.message };

  try {
    await tenantService.registerNewCompany(companyName, data.user.id);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Hubo un problema creando tu cuenta de empresa." };
  }
}
