import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createSupabaseClient(cookieStore);
}
