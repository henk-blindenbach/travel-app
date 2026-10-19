import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { createClient } from "../../../../../lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const { visibility } = await request.json();
    if (!validUuid(tripId) || !["private", "unlisted", "public"].includes(visibility)) {
      return NextResponse.json({ error: "Ongeldige zichtbaarheid." }, { status: 400 });
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data, error } = await supabase.from("trips").update({ visibility }).eq("id", tripId).select("visibility,slug").single();
    if (error || !data) return NextResponse.json({ error: "Zichtbaarheid kon niet worden opgeslagen." }, { status: 400 });
    return NextResponse.json({ trip: data });
  } catch { return NextResponse.json({ error: "Zichtbaarheid kon niet worden opgeslagen." }, { status: 500 }); }
}
