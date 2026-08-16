import { randomUUID } from "crypto";

/**
 * Object storage for generated media (audio + illustrations).
 *
 * Two backends, chosen by STORAGE_PROVIDER:
 *  - "local" (default): writes to public/generated and serves at /generated/….
 *    Perfect for dev and single-server deployments. NOT suitable for serverless
 *    (Vercel) where the filesystem is ephemeral/read-only.
 *  - "s3": any S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2…).
 *    This is the production path. Returns a public URL from S3_PUBLIC_URL.
 */

export interface StoredObject {
  key: string;
  url: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function newKey(prefix: string, ext: string): string {
  return `${prefix}/${randomUUID()}.${ext}`;
}

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<StoredObject> {
  const provider = process.env.STORAGE_PROVIDER || "local";
  switch (provider) {
    case "local":
      return putLocal(key, body);
    case "s3":
      return putS3(key, body, contentType);
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${provider}`);
  }
}

async function putLocal(key: string, body: Uint8Array): Promise<StoredObject> {
  const { writeFile, mkdir } = await import("fs/promises");
  const { join, dirname } = await import("path");
  const path = join(process.cwd(), "public", "generated", key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
  // Relative URL works in the browser regardless of host.
  return { key, url: `/generated/${key}` };
}

async function putS3(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<StoredObject> {
  // Lazy-import so the AWS SDK only loads when S3 is actually configured.
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined, // set for R2/B2
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  const base = (process.env.S3_PUBLIC_URL || APP_URL).replace(/\/$/, "");
  return { key, url: `${base}/${key}` };
}
