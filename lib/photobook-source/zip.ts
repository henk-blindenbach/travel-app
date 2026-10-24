import { ZipArchive } from "archiver";
import { PassThrough, Readable } from "node:stream";
import { fetchOriginal } from "../scaleway";
import { buildPhotobookManifest } from "./manifest";
import { buildBookMarkdown, buildStoryTxt } from "./texts";
import type { PhotobookSourcePackage } from "./types";

/**
 * Stream a Photobook Source Package ZIP.
 * Fetches one Scaleway original at a time (store mode — no re-compress of image bytes).
 */
export function streamPhotobookZip(pkg: PhotobookSourcePackage): ReadableStream<Uint8Array> {
  const passThrough = new PassThrough();
  const archive = new ZipArchive({ store: true });

  archive.on("error", (error) => {
    passThrough.destroy(error);
  });
  archive.pipe(passThrough);

  void (async () => {
    try {
      const manifest = buildPhotobookManifest(pkg);
      archive.append(buildBookMarkdown(pkg), { name: "00_BOOK/book.md" });
      archive.append(`${JSON.stringify(manifest, null, 2)}\n`, { name: "00_BOOK/manifest.json" });

      for (const day of pkg.days) {
        archive.append(buildStoryTxt(day), { name: `${day.folderName}/story.txt` });
        for (const photo of day.photos) {
          const bytes = await fetchOriginal(photo.originalObjectKey);
          archive.append(bytes, { name: `${day.folderName}/${photo.filename}` });
        }
      }

      await archive.finalize();
    } catch (error) {
      passThrough.destroy(error instanceof Error ? error : new Error("ZIP-export mislukt."));
    }
  })();

  return Readable.toWeb(passThrough) as ReadableStream<Uint8Array>;
}
