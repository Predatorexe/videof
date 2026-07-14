/**
 * S3 adapter — presigned PUT for direct browser uploads.
 * Uses SigV4 with the AWS SDK-free approach.
 */
import { createHmac, createHash } from "node:crypto";
import { ExternalServiceError } from "@/lib/errors";
import { serverEnv } from "@/lib/env";
import type { StorageAdapter, StoredAsset, UploadInput, UploadTicket } from "./adapter";

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data).digest();
}

export class S3Adapter implements StorageAdapter {
  readonly name = "s3";
  async createUploadTicket(input: UploadInput): Promise<UploadTicket> {
    const env = serverEnv();
    if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_BUCKET || !env.S3_REGION) {
      throw new ExternalServiceError("s3", "Missing credentials");
    }
    const key = `videofy/${input.shopId}/${crypto.randomUUID()}-${input.filename}`;
    const host = env.S3_ENDPOINT
      ? new URL(env.S3_ENDPOINT).host
      : `${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`;
    const url = `https://${host}/${encodeURI(key)}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${env.S3_REGION}/s3/aws4_request`;
    const canonicalRequest = [
      "PUT",
      "/" + key,
      "X-Amz-Expires=900&X-Amz-SignedHeaders=host",
      `host:${host}\n`,
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");
    const kDate = hmac("AWS4" + env.S3_SECRET_ACCESS_KEY, dateStamp);
    const kRegion = hmac(kDate, env.S3_REGION);
    const kService = hmac(kRegion, "s3");
    const kSigning = hmac(kService, "aws4_request");
    const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
    const presigned =
      `${url}?X-Amz-Algorithm=AWS4-HMAC-SHA256` +
      `&X-Amz-Credential=${encodeURIComponent(env.S3_ACCESS_KEY_ID + "/" + credentialScope)}` +
      `&X-Amz-Date=${amzDate}` +
      `&X-Amz-Expires=900` +
      `&X-Amz-SignedHeaders=host` +
      `&X-Amz-Signature=${signature}`;
    return {
      uploadUrl: presigned,
      method: "PUT",
      headers: { "Content-Type": input.contentType },
      assetId: key,
      provider: this.name,
    };
  }
  async getAsset(assetId: string): Promise<StoredAsset> {
    const env = serverEnv();
    const host = env.S3_ENDPOINT
      ? new URL(env.S3_ENDPOINT).host
      : `${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`;
    const url = `https://${host}/${encodeURI(assetId)}`;
    return { provider: this.name, assetId, url, mp4Url: url };
  }
  async deleteAsset(): Promise<void> {
    // Signed DELETE follows the same SigV4 shape; omitted here to keep
    // the file focused on presign — implement when needed.
  }
}
