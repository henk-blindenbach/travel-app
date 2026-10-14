import { NextResponse } from "next/server";
import { configureOriginalUploadCors } from "../../../../lib/scaleway";

export const runtime = "nodejs";

// Temporary deployment hook. It has no request-controlled input and is removed
// immediately after the single, fixed CORS policy has been applied.
export async function POST() {
  try {
    await configureOriginalUploadCors();
    return NextResponse.json({ configured: true });
  } catch {
    return NextResponse.json({ error: "CORS-configuratie mislukt." }, { status: 500 });
  }
}
