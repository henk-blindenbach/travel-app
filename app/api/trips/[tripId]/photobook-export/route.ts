import { NextResponse } from "next/server";
import { contentDispositionAttachment } from "../../../../../lib/share-export";
import { validUuid } from "../../../../../lib/journal";
import {
  collectPhotobookSource,
  softValidatePackage,
  streamPhotobookZip,
  validateOriginalsAccessible,
} from "../../../../../lib/photobook-source";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    if (!validUuid(tripId)) {
      return NextResponse.json({ error: "Ongeldige reis." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const collected = await collectPhotobookSource(supabase, tripId);
    if (!collected) return NextResponse.json({ error: "Reis niet gevonden." }, { status: 404 });

    const soft = softValidatePackage(collected.package, collected.warnings);
    const preview = new URL(request.url).searchParams.get("preview") === "1";

    if (preview) {
      const photoCount = collected.package.days.reduce((sum, day) => sum + day.photos.length, 0);
      return NextResponse.json({
        zipFilename: `${collected.package.zipBasename}.zip`,
        dayCount: collected.package.days.length,
        photoCount,
        warnings: soft.warnings,
        errors: soft.errors,
        ok: soft.errors.length === 0,
      });
    }

    if (soft.errors.length) {
      return NextResponse.json(
        {
          error: soft.errors[0]?.message || "Export niet mogelijk.",
          errors: soft.errors,
          warnings: soft.warnings,
        },
        { status: 422 },
      );
    }

    const originalErrors = await validateOriginalsAccessible(collected.package);
    if (originalErrors.length) {
      return NextResponse.json(
        {
          error: originalErrors[0]?.message
            || "Een of meer originalen zijn niet bereikbaar. Export gestopt.",
          errors: originalErrors,
          warnings: soft.warnings,
        },
        { status: 422 },
      );
    }

    const zipFilename = `${collected.package.zipBasename}.zip`;
    const stream = streamPhotobookZip(collected.package);
    const warningHeader = soft.warnings.length
      ? encodeURIComponent(soft.warnings.map((item) => item.message).join(" · "))
      : "";

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDispositionAttachment(zipFilename),
        "Cache-Control": "private, no-store",
        ...(warningHeader ? { "X-Photobook-Warnings": warningHeader } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fotoboek-export mislukt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
