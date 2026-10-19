import { NextResponse } from "next/server";
import { authorizeCronRequest, runDailyReminders } from "../../../../lib/reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dry-run") === "1";
  const force = url.searchParams.get("force") === "1";

  try {
    const result = await runDailyReminders({ dryRun, force });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reminder-job mislukt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
