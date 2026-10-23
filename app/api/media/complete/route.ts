import { NextResponse } from "next/server";
import { validUuid } from "../../../../lib/journal";
import { processMediaWebVersion } from "../../../../lib/media-web-process";
import { createServiceClient, hasServiceRoleEnv } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
/** Allow Sharp + Scaleway round-trip on large phone photos / HEIC. */
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    if (!validUuid(payload.assetId)) return NextResponse.json({ error: "Ongeldige foto." }, { status: 400 });

    const { data: asset } = await supabase.from("media_assets")
      .select("id,original_object_key,web_object_path,upload_status")
      .eq("id", payload.assetId)
      .single();
    if (!asset) return NextResponse.json({ error: "Geen toegang tot deze foto." }, { status: 404 });

    // Service role bypasses storage RLS edge-cases on upsert of missing web objects.
    const storage = hasServiceRoleEnv() ? createServiceClient() : supabase;
    const result = await processMediaWebVersion(supabase, storage, asset);
    if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    return NextResponse.json({ asset: result.asset });
  } catch {
    return NextResponse.json(
      { error: "De webversie kon niet worden gemaakt. Probeer opnieuw te verwerken of upload de foto opnieuw." },
      { status: 500 },
    );
  }
}
