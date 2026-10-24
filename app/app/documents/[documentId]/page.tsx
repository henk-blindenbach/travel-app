import { notFound, redirect } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { DocumentViewer } from "../../../../components/documents/DocumentViewer";
import { safeAppBackPath } from "../../../../lib/document-open";
import { validUuid } from "../../../../lib/journal";
import { createClient, hasSupabaseEnv } from "../../../../lib/supabase/server";

export default async function DocumentViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { documentId } = await params;
  const query = await searchParams;
  if (!validUuid(documentId)) notFound();

  if (!hasSupabaseEnv()) {
    return (
      <AppShell active="trips">
        <div className="planner-page">
          <p className="form-message">Documenten zijn nu niet beschikbaar.</p>
        </div>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=" + encodeURIComponent("/app/documents/" + documentId));
  }

  const { data: document } = await supabase
    .from("trip_documents")
    .select("id,trip_id,title,mime_type,original_filename,upload_status")
    .eq("id", documentId)
    .eq("upload_status", "ready")
    .maybeSingle();
  if (!document) notFound();

  const defaultBack = "/app/trips/" + document.trip_id + "/documents";
  const backHref = safeAppBackPath(query.back) || defaultBack;

  return (
    <AppShell active="trips">
      <div className="planner-page document-viewer-page">
        <DocumentViewer
          documentId={document.id}
          title={document.title}
          mimeType={document.mime_type}
          filename={document.original_filename}
          backHref={backHref}
        />
      </div>
    </AppShell>
  );
}
