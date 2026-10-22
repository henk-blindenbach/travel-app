import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

const allowed = new Set(["draft", "ready"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const { entryId } = await params;
    if (!validUuid(entryId)) return NextResponse.json({ error: "Ongeldig verslag." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const payload = await request.json().catch(() => ({}));
    const status = typeof payload.status === "string" ? payload.status : "";
    if (!allowed.has(status)) {
      return NextResponse.json({ error: "Ongeldige status." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("day_entries")
      .select("id,body,publication_status")
      .eq("id", entryId)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: "Verslag niet gevonden." }, { status: 404 });
    if (existing.publication_status === "published") {
      return NextResponse.json({ error: "Gepubliceerde dagen blijven gepubliceerd tot je ze opnieuw bewerkt." }, { status: 400 });
    }
    if (status === "ready" && !String(existing.body || "").trim()) {
      return NextResponse.json({ error: "Schrijf eerst tekst voordat je de dag als klaar markeert." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("day_entries")
      .update({ publication_status: status })
      .eq("id", entryId)
      .select("id,publication_status")
      .single();

    if (error) return NextResponse.json({ error: "Status kon niet worden opgeslagen." }, { status: 400 });
    return NextResponse.json({ entry: data });
  } catch {
    return NextResponse.json({ error: "Status kon niet worden opgeslagen." }, { status: 500 });
  }
}
