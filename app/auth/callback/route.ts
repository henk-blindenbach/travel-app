import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function safeDestination(next: string | null) {
  return next === "/auth/reset-password" || next?.startsWith("/app") ? next : "/app/today";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const response = NextResponse.redirect(new URL(safeDestination(url.searchParams.get("next")), url.origin));
  if (!code) return NextResponse.redirect(new URL("/login?error=auth-callback-failed", url.origin));
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=auth-callback-failed", url.origin));
  return response;
}
