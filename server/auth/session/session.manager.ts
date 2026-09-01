import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType, Provider } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { AuthUser } from "../types";
import { COOKIE_KEYS } from "../constants/cookies.constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

async function getSupabaseClient() {
  const cookieStore = await cookies();
  const rememberPreference = cookieStore.get(
    COOKIE_KEYS.rememberSession,
  )?.value;
  const persistSession = rememberPreference !== "0";

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (!options) {
              cookieStore.set(name, value, {
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });
              return;
            }

            const isSupabaseAuthCookie = /-auth-token(?:\.|$)/.test(name);

            if (!persistSession && isSupabaseAuthCookie) {
              const sessionCookieOptions = {
                ...options,
                maxAge: undefined,
                expires: undefined,
                path: "/",
                sameSite: "lax" as const,
                secure: process.env.NODE_ENV === "production",
              };
              cookieStore.set(name, value, sessionCookieOptions);
              return;
            }

            cookieStore.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
          });
        } catch {
          // In Server Components Next.js forbids mutating cookies.
          // Session refresh should be handled by middleware/action contexts.
        }
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

    const metadata = user.user_metadata as
      Record<string, string | undefined> | undefined;
    const appMetadata = user.app_metadata as
      Record<string, string | undefined> | undefined;

    return {
      user: {
        id: user.id,
        email: user.email!,
        fullName:
          metadata?.full_name?.trim() ||
          metadata?.name?.trim() ||
          metadata?.user_name?.trim() ||
          null,
        avatarUrl:
          metadata?.avatar_url?.trim() || metadata?.picture?.trim() || null,
        authProvider: appMetadata?.provider?.trim() || null,
      },
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

  async signInWithOAuth(
    provider: Provider,
    options?: {
      redirectTo?: string;
      queryParams?: Record<string, string>;
    },
  ) {
    const supabase = await getSupabaseClient();
    return supabase.auth.signInWithOAuth({
      provider,
      options,
    });
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

  async updateUserMetadata(data: {
    fullName?: string | null;
    avatarUrl?: string | null;
  }) {
    const supabase = await getSupabaseClient();
    return supabase.auth.updateUser({
      data: {
        full_name: data.fullName ?? undefined,
        name: data.fullName ?? undefined,
        avatar_url: data.avatarUrl ?? undefined,
      },
    });
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
