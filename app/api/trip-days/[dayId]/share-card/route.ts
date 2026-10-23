import { NextResponse } from "next/server";
import {
  dayShareCardFilename,
  parseDayShareCardSlot,
  renderDayShareCardJpeg,
} from "../../../../../lib/day-share-cards";
import { contentDispositionAttachment } from "../../../../../lib/share-export";
import { validUuid } from "../../../../../lib/journal";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Private JPEG day card for the share/download batch ("Dag N start" / "Dag N eind").
 * Day number comes from trip_days — not from the client.
 */
export async function GET(request: Request, { params }: { params: Promise<{ dayId: string }> }) {
  try {
    const { dayId } = await params;
    if (!validUuid(dayId)) {
      return NextResponse.json({ error: "Ongeldige reisdag." }, { status: 400 });
    }

    const slot = parseDayShareCardSlot(new URL(request.url).searchParams.get("slot"));
    if (!slot) {
      return NextResponse.json({ error: "Kies slot=start of slot=eind." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: day } = await supabase
      .from("trip_days")
      .select("day_number")
      .eq("id", dayId)
      .maybeSingle();

    if (!day || typeof day.day_number !== "number") {
      return NextResponse.json({ error: "Reisdag niet gevonden." }, { status: 404 });
    }

    const jpeg = await renderDayShareCardJpeg(day.day_number, slot);
    const filename = dayShareCardFilename(day.day_number, slot);

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": contentDispositionAttachment(filename),
        "Cache-Control": "private, no-store",
        "X-Share-Filename": filename,
      },
    });
  } catch {
    return NextResponse.json({ error: "Dagkaart kon niet worden gemaakt." }, { status: 500 });
  }
}
