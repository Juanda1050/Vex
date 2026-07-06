import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { AuthUser } from "../types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });
}

export const sessionManager = {
  async getUser(): Promise<{ user: AuthUser | null; error: string | null }> {
    const supabase = await getSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user)
      return { user: null, error: error?.message ?? "No session" };

    return {
      user: { id: user.id, email: user.email! },
      error: null,
    };
  },

  async signOut(): Promise<void> {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
  },

  async signInWithPassword(email: string, password: string) {
    const supabase = await getSupabaseClient();
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string, emailRedirectTo?: string) {
    const supabase = await getSupabaseClient();
    return supabase.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });
  },

  async resetPasswordForEmail(email: string, redirectTo: string) {
    const supabase = await getSupabaseClient();
    return supabase.auth.resetPasswordForEmail(email, { redirectTo });
  },

  async updatePassword(password: string) {
    const supabase = await getSupabaseClient();
    return supabase.auth.updateUser({ password });
  },

  async updateEmail(email: string) {
    const supabase = await getSupabaseClient();
    return supabase.auth.updateUser({ email });
  },

  async verifyOtp(tokenHash: string, type: EmailOtpType) {
    const supabase = await getSupabaseClient();
    return supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  },

  async exchangeCodeForSession(code: string) {
    const supabase = await getSupabaseClient();
    return supabase.auth.exchangeCodeForSession(code);
  },
};
