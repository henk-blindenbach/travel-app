import { NextResponse } from "next/server";
import sharp from "sharp";
import { validUuid } from "../../../../../lib/journal";
import {
  contentDispositionAttachment,
  shareJpegFilename,
} from "../../../../../lib/share-export";
import { createServiceClient, hasServiceRoleEnv } from "../../../../../lib/supabase/admin";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Private JPEG export for Web Share / social handoff.
 * Uses the ready WebP (already decoded from HEIC at complete-time) so share works
 * even when the Scaleway original is HEIC/HEIF that browsers cannot canShare.
 */
export async function GET(_: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    if (!validUuid(assetId)) return NextResponse.json({ error: "Ongeldige foto." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: asset } = await supabase
      .from("media_assets")
      .select("original_filename,web_object_path,upload_status")
      .eq("id", assetId)
      .maybeSingle();

    if (!asset || asset.upload_status !== "ready" || !asset.web_object_path) {
      return NextResponse.json({ error: "Foto nog niet klaar om te delen." }, { status: 404 });
    }

    const storage = hasServiceRoleEnv() ? createServiceClient() : supabase;
    const { data: webBlob, error: downloadError } = await storage.storage
      .from("trip-web-images")
      .download(asset.web_object_path);
    if (downloadError || !webBlob) {
      return NextResponse.json({ error: "Webversie ontbreekt; verwerk de foto opnieuw." }, { status: 422 });
    }

    const webBuffer = Buffer.from(await webBlob.arrayBuffer());
    const jpeg = await sharp(webBuffer, { limitInputPixels: 80_000_000 })
      .rotate()
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    const filename = shareJpegFilename(asset.original_filename || "foto.jpg");
    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": contentDispositionAttachment(filename),
        "Cache-Control": "private, no-store",
        "X-Share-Filename": filename,
      },
    });
  } catch {
    return NextResponse.json({ error: "Deelformaat kon niet worden gemaakt." }, { status: 500 });
  }
}
