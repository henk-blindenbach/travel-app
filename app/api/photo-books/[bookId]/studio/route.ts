import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { loadPhotoBookAssets, loadRouteSummary, PHOTO_BOOK_SELECT } from "../../../../../lib/photo-book-assets";
import {
  buildBookStructure,
  buildStudioCreateRequest,
} from "../../../../../lib/photo-book";
import { hasProdigiConfig, prodigiConfigStatus } from "../../../../../lib/prodigi";
import {
  createStudioBook,
  getStudioTemplate,
  getStudioTemplateId,
  renderStudioBook,
  runStudioPreflight,
  studioHasBlockingIssues,
  studioPdfArtifactUrl,
  studioPreviewUrlFromResponse,
  studioProjectIdFromResponse,
  type StudioBookResponse,
} from "../../../../../lib/prodigi-studio";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

/**
 * Create/update a Prodigi Studio book from the current selection.
 * Requires PRODIGI_API_KEY + PRODIGI_STUDIO_TEMPLATE_ID (or book.studio_template_id).
 * Clears preview acknowledgement so the user must re-check before ordering.
 */
export async function POST(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;
    if (!validUuid(bookId)) return NextResponse.json({ error: "Ongeldig fotoboek." }, { status: 400 });

    if (!hasProdigiConfig()) {
      return NextResponse.json({
        error: "Prodigi is nog niet geconfigureerd.",
        setup: {
          required: ["PRODIGI_API_KEY", "PRODIGI_STUDIO_TEMPLATE_ID"],
          optional: ["PRODIGI_ENV=sandbox|live", "PRODIGI_DEFAULT_SKU", "PRODIGI_STUDIO_BASE_URL"],
          docs: "/docs/PHOTOBOOK_PRODIGI.md",
          status: prodigiConfigStatus(),
        },
      }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const skipRender = body.skipRender === true;

    const { data: book, error } = await supabase
      .from("photo_books")
      .select(PHOTO_BOOK_SELECT)
      .eq("id", bookId)
      .maybeSingle();
    if (error || !book) return NextResponse.json({ error: "Fotoboek niet gevonden." }, { status: 404 });
    if (book.status === "submitted" && book.prodigi_order_id) {
      return NextResponse.json({ error: "Dit boek is al besteld; Studio-sync is geblokkeerd." }, { status: 409 });
    }

    const templateId = (typeof body.templateId === "string" && body.templateId.trim())
      || book.studio_template_id?.trim()
      || getStudioTemplateId();
    if (!templateId) {
      return NextResponse.json({
        error: "Geen Studio-template. Publiceer een template in Prodigi Studio en zet PRODIGI_STUDIO_TEMPLATE_ID (of geef templateId mee).",
        setup: {
          required: ["PRODIGI_STUDIO_TEMPLATE_ID"],
          docs: "/docs/PHOTOBOOK_PRODIGI.md",
          status: prodigiConfigStatus(),
        },
      }, { status: 503 });
    }

    const assets = await loadPhotoBookAssets(supabase, bookId, true);
    if (!assets.length) {
      return NextResponse.json({ error: "Geen foto’s in het boek om naar Studio te sturen." }, { status: 400 });
    }
    const missingUrls = assets.filter((asset) => !asset.downloadUrl).length;
    if (missingUrls) {
      return NextResponse.json({
        error: `${missingUrls} foto(’s) hebben geen download-URL voor Studio.`,
      }, { status: 400 });
    }

    const routeSummary = await loadRouteSummary(supabase, book.trip_id);
    const structure = buildBookStructure({
      title: book.title,
      subtitle: book.subtitle,
      introText: book.intro_text,
      assets,
      routeSummary,
    });
    const createRequest = buildStudioCreateRequest({ templateId, bookId, structure });
    if (!createRequest) {
      return NextResponse.json({ error: "Studio-payload kon niet worden gebouwd." }, { status: 400 });
    }

    let templateMeta: unknown = null;
    try {
      templateMeta = await getStudioTemplate(templateId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Studio-template ophalen mislukt.";
      await supabase.from("photo_books").update({
        studio_template_id: templateId,
        studio_status: "template_error",
        last_error: message,
        updated_at: new Date().toISOString(),
      }).eq("id", bookId);
      return NextResponse.json({
        error: message,
        hint: "Controleer of PRODIGI_STUDIO_TEMPLATE_ID een gepubliceerde template is in hetzelfde Prodigi-account als de API-key.",
      }, { status: 502 });
    }

    let created: StudioBookResponse;
    try {
      created = await createStudioBook(createRequest);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Studio-boek aanmaken mislukt.";
      const errBody = err && typeof err === "object" && "body" in err ? (err as { body: unknown }).body : null;
      await supabase.from("photo_books").update({
        studio_template_id: templateId,
        studio_status: "create_failed",
        studio_payload: { createRequest: { ...createRequest, images: createRequest.images.map((img) => ({ clientId: img.clientId, sourceUrl: "[redacted]" })) }, error: errBody },
        last_error: message,
        preview_acknowledged_at: null,
        updated_at: new Date().toISOString(),
      }).eq("id", bookId);
      return NextResponse.json({ error: message, details: errBody }, { status: 502 });
    }

    const projectId = studioProjectIdFromResponse(created);
    if (!projectId) {
      await supabase.from("photo_books").update({
        studio_template_id: templateId,
        studio_status: "create_failed",
        studio_payload: created,
        last_error: "Studio gaf geen book/project-id terug.",
        preview_acknowledged_at: null,
        updated_at: new Date().toISOString(),
      }).eq("id", bookId);
      return NextResponse.json({ error: "Studio gaf geen book/project-id terug.", studio: created }, { status: 502 });
    }

    let preflight: unknown = null;
    let render: StudioBookResponse | null = null;
    let studioStatus = "created";
    let lastError: string | null = null;

    try {
      preflight = await runStudioPreflight(projectId);
      studioStatus = "preflight";
      if (studioHasBlockingIssues(preflight as Parameters<typeof studioHasBlockingIssues>[0])) {
        lastError = "Studio-preflight heeft blokkerende issues — bekijk studio_preflight en pas template/content aan.";
        studioStatus = "preflight_blocked";
      } else if (!skipRender) {
        render = await renderStudioBook(projectId);
        studioStatus = "rendered";
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Studio preflight/render mislukt.";
      studioStatus = "preflight_or_render_failed";
    }

    const previewUrl =
      studioPreviewUrlFromResponse(render)
      || studioPreviewUrlFromResponse(created)
      || studioPdfArtifactUrl(projectId);

    const skuFromTemplate =
      (templateMeta && typeof templateMeta === "object" && (
        typeof (templateMeta as { sku?: unknown }).sku === "string"
          ? (templateMeta as { sku: string }).sku
          : typeof (templateMeta as { productSku?: unknown }).productSku === "string"
            ? (templateMeta as { productSku: string }).productSku
            : null
      )) || null;

    const updates: Record<string, unknown> = {
      studio_template_id: templateId,
      studio_project_id: projectId,
      studio_preview_url: previewUrl,
      studio_status: studioStatus,
      studio_payload: { created, render, templateMeta, structure },
      studio_preflight: preflight,
      preview_acknowledged_at: null,
      last_error: lastError,
      status: assets.length ? "ready_for_prodigi" : "draft",
      updated_at: new Date().toISOString(),
    };
    if (skuFromTemplate) updates.sku = skuFromTemplate;

    const { data: updated, error: updateError } = await supabase
      .from("photo_books")
      .update(updates)
      .eq("id", bookId)
      .select(PHOTO_BOOK_SELECT)
      .single();
    if (updateError || !updated) {
      return NextResponse.json({ error: "Studio-resultaat kon niet worden opgeslagen." }, { status: 400 });
    }

    return NextResponse.json({
      book: updated,
      structure,
      studio: { projectId, previewUrl, status: studioStatus, preflight, render },
      message: lastError
        ? `Studio-project aangemaakt, maar: ${lastError}`
        : "Studio-project bijgewerkt. Bekijk de preview en bevestig vóór bestellen.",
    });
  } catch {
    return NextResponse.json({ error: "Studio-sync mislukt." }, { status: 500 });
  }
}
