import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data } = await supabase
      .from("reminder_preferences")
      .select("email_enabled,updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      emailEnabled: data?.email_enabled ?? true,
      updatedAt: data?.updated_at ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Kon voorkeuren niet laden." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const payload = await request.json();
    if (typeof payload.emailEnabled !== "boolean") {
      return NextResponse.json({ error: "Geef emailEnabled (boolean) mee." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("reminder_preferences")
      .upsert(
        {
          user_id: user.id,
          email_enabled: payload.emailEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("email_enabled,updated_at")
      .single();

    if (error || !data) throw error;
    return NextResponse.json({ emailEnabled: data.email_enabled, updatedAt: data.updated_at });
  } catch {
    return NextResponse.json({ error: "Kon voorkeur niet opslaan." }, { status: 400 });
  }
}
