"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  documentBackLabel,
  documentFilePath,
  isInlineDocumentMime,
} from "../../lib/document-open";
import { matchOfflineDocument } from "../../lib/offline-document";

type Props = {
  documentId: string;
  title: string;
  mimeType: string;
  filename: string;
  backHref: string;
};

export function DocumentViewer({ documentId, title, mimeType, filename, backHref }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [fromOffline, setFromOffline] = useState(false);
  const [loadError, setLoadError] = useState("");
  const fileUrl = documentFilePath(documentId);
  const inline = isInlineDocumentMime(mimeType);
  const isImage = (mimeType || "").toLowerCase().startsWith("image/");
  const src = objectUrl || fileUrl;

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    matchOfflineDocument(documentId).then(async (cached) => {
      if (!cached || cancelled) return;
      try {
        const url = URL.createObjectURL(await cached.blob());
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoked = url;
        setObjectUrl(url);
        setFromOffline(true);
      } catch {
        if (!cancelled) setLoadError("Offline kopie kon niet worden getoond.");
      }
    });

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [documentId]);

  return (
    <div className="document-viewer">
      <Link className="back-link" href={backHref}>
        {documentBackLabel(backHref)}
      </Link>
      <p className="eyebrow blue">Document</p>
      <h1>{title}</h1>
      <p className="journal-intro">
        {filename}
        {fromOffline ? " · offline kopie" : ""}
      </p>
      {loadError ? (
        <p className="form-message" role="status">
          {loadError}
        </p>
      ) : null}

      {inline ? (
        isImage ? (
          <img className="document-viewer-image" src={src} alt={title} />
        ) : (
          <iframe className="document-viewer-frame" title={title} src={src} />
        )
      ) : (
        <p className="document-viewer-download">
          Dit bestandstype opent niet in de browser.{" "}
          <a className="primary-button blue-button" href={fileUrl}>
            Download {filename}
          </a>
        </p>
      )}

      <p className="document-viewer-actions">
        <Link className="secondary-button" href={backHref}>
          {documentBackLabel(backHref).replace(/^←\s*/, "")}
        </Link>
      </p>
    </div>
  );
}
