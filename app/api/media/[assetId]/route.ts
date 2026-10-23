import { NextResponse } from "next/server";
import { validUuid } from "../../../../lib/journal";
import { deleteOriginal } from "../../../../lib/scaleway";
import { createServiceClient, hasServiceRoleEnv } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

/**
 * Delete one media asset (any upload_status, including failed).
 * Cleans Scaleway original + Supabase web object when present; DB row always removed on success.
 */
export async function DELETE(_: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    if (!validUuid(assetId)) return NextResponse.json({ error: "Ongeldige foto." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: asset } = await supabase
      .from("media_assets")
      .select("id,original_object_key,web_object_path")
      .eq("id", assetId)
      .maybeSingle();
    if (!asset) return NextResponse.json({ error: "Foto niet gevonden." }, { status: 404 });

    if (asset.web_object_path) {
      const storage = hasServiceRoleEnv() ? createServiceClient() : supabase;
      const { error: storageError } = await storage.storage
        .from("trip-web-images")
        .remove([asset.web_object_path]);
      if (storageError) console.error("Media web image delete failed", { assetId });
    }

    if (asset.original_object_key) {
      try {
        await deleteOriginal(asset.original_object_key);
      } catch {
        console.error("Media original delete failed", { assetId });
      }
    }

    const { error } = await supabase.from("media_assets").delete().eq("id", assetId);
    if (error) return NextResponse.json({ error: "De foto kon niet worden verwijderd." }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "De foto kon niet worden verwijderd." }, { status: 500 });
  }
}
