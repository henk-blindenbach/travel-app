import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { validUuid } from "../../../../../lib/journal";

export async function POST(_: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await params;
    if (!validUuid(entryId)) return NextResponse.json({ error: "Ongeldig verslag." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data, error } = await supabase.from("day_entries").update({ publication_status: "published", published_at: new Date().toISOString() }).eq("id", entryId).neq("body", "").select("id,publication_status,published_at").single();
    if (error || !data) return NextResponse.json({ error: "Vul eerst het verslag in voordat je publiceert." }, { status: 400 });
    return NextResponse.json({ entry: data });
  } catch { return NextResponse.json({ error: "Publiceren lukte niet." }, { status: 500 }); }
}
