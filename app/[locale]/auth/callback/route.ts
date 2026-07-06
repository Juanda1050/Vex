import { NextResponse, type NextRequest } from "next/server";
import { resolveVerifyEmailDestination } from "@/server/auth/actions/verify-email.action";

type RouteContext = {
  params: Promise<{ locale: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { locale } = await context.params;
  const { searchParams } = new URL(request.url);

  const destination = await resolveVerifyEmailDestination(
    {
      token_hash: searchParams.get("token_hash"),
      type: searchParams.get("type"),
      code: searchParams.get("code"),
      next: searchParams.get("next"),
    },
    locale,
  );

  return NextResponse.redirect(new URL(destination, request.url));
}
