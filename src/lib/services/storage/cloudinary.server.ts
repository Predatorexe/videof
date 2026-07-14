/** Cloudinary adapter — requires CLOUDINARY_* env. */
import { ExternalServiceError } from "@/lib/errors";
import { serverEnv } from "@/lib/env";
import type { StorageAdapter, StoredAsset, UploadInput, UploadTicket } from "./adapter";

export class CloudinaryAdapter implements StorageAdapter {
  readonly name = "cloudinary";
  createUploadTicket(input: UploadInput): Promise<UploadTicket> {
    const env = serverEnv();
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new ExternalServiceError("cloudinary", "Missing credentials");
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `videofy/${input.shopId}`;
    return Promise.resolve({
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/video/upload`,
      method: "POST",
      fields: {
        api_key: env.CLOUDINARY_API_KEY,
        timestamp: String(timestamp),
        folder,
        resource_type: "video",
      },
      assetId: `${folder}/${crypto.randomUUID()}`,
      provider: this.name,
    });
  }
  async getAsset(assetId: string): Promise<StoredAsset> {
    const env = serverEnv();
    const url = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/video/upload/${encodeURIComponent(assetId)}`;
    const auth = Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString("base64");
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) throw new ExternalServiceError("cloudinary", `getAsset ${res.status}`);
    const j = (await res.json()) as {
      secure_url: string; duration?: number; width?: number; height?: number; bytes?: number;
      eager?: Array<{ secure_url: string; format: string }>;
    };
    return {
      provider: this.name,
      assetId,
      url: j.secure_url,
      mp4Url: j.secure_url,
      hlsUrl: j.eager?.find((e) => e.format === "m3u8")?.secure_url,
      posterUrl: j.secure_url.replace(/\.[a-z0-9]+$/i, ".jpg"),
      durationSeconds: j.duration,
      width: j.width,
      height: j.height,
      sizeBytes: j.bytes,
    };
  }
  async deleteAsset(assetId: string): Promise<void> {
    const env = serverEnv();
    const auth = Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString("base64");
    await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/video/upload?public_ids[]=${encodeURIComponent(assetId)}`,
      { method: "DELETE", headers: { Authorization: `Basic ${auth}` } },
    );
  }
}
