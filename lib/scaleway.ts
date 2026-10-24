import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { classifyOriginalFetchError, OriginalFetchError } from "./scaleway-errors";

export { OriginalFetchError } from "./scaleway-errors";
export type { OriginalFetchCode } from "./scaleway-errors";

type ScalewayConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function config(): ScalewayConfig {
  const endpoint = process.env.SCALEWAY_S3_ENDPOINT;
  const region = process.env.SCALEWAY_S3_REGION;
  const bucket = process.env.SCALEWAY_S3_BUCKET;
  const accessKeyId = process.env.SCALEWAY_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SCALEWAY_SECRET_ACCESS_KEY;

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new OriginalFetchError("not_configured", "De private foto-opslag is nog niet ingesteld.");
  }

  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}

function client(settings: ScalewayConfig) {
  return new S3Client({
    endpoint: settings.endpoint,
    region: settings.region,
    credentials: { accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey },
  });
}

export async function createOriginalUploadUrl(key: string, contentType: string) {
  const settings = config();
  return getSignedUrl(
    client(settings),
    new PutObjectCommand({ Bucket: settings.bucket, Key: key, ContentType: contentType }),
    { expiresIn: 10 * 60 },
  );
}

/** Temporary GET URL for external processors (e.g. Prodigi asset download). */
export async function createOriginalDownloadUrl(key: string, expiresInSeconds = 60 * 60) {
  const settings = config();
  return getSignedUrl(
    client(settings),
    new GetObjectCommand({ Bucket: settings.bucket, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

export async function fetchOriginal(key: string) {
  try {
    const settings = config();
    const result = await client(settings).send(new GetObjectCommand({ Bucket: settings.bucket, Key: key }));
    if (!result.Body) {
      throw new OriginalFetchError("read_failed", "Het geüploade origineel kon niet worden gelezen.");
    }
    return Buffer.from(await result.Body.transformToByteArray());
  } catch (error) {
    throw classifyOriginalFetchError(error);
  }
}

/** Cheap existence/access check before streaming a large ZIP of originals. */
export async function assertOriginalExists(key: string) {
  try {
    const settings = config();
    await client(settings).send(new HeadObjectCommand({ Bucket: settings.bucket, Key: key }));
  } catch (error) {
    throw classifyOriginalFetchError(error);
  }
}

export async function deleteOriginal(key: string) {
  const settings = config();
  await client(settings).send(new DeleteObjectCommand({ Bucket: settings.bucket, Key: key }));
}
