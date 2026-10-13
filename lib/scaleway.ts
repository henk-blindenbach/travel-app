import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    throw new Error("De private foto-opslag is nog niet ingesteld.");
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

export async function fetchOriginal(key: string) {
  const settings = config();
  const result = await client(settings).send(new GetObjectCommand({ Bucket: settings.bucket, Key: key }));
  if (!result.Body) throw new Error("Het geüploade origineel kon niet worden gelezen.");
  return Buffer.from(await result.Body.transformToByteArray());
}
