import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_KEYS } from "@/server/auth/constants/cookies.constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = async (request: NextRequest) => {
  const persistSession =
    request.cookies.get(COOKIE_KEYS.rememberSession)?.value !== "0";

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          if (!options) {
            supabaseResponse.cookies.set(name, value);
            return;
          }

          const isSupabaseAuthCookie = /-auth-token(?:\.|$)/.test(name);

          if (!persistSession && isSupabaseAuthCookie) {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: undefined,
              expires: undefined,
            });
            return;
          }

          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
};
