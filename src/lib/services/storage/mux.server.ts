/** Mux adapter — direct upload + HLS/MP4 delivery. */
import { ExternalServiceError } from "@/lib/errors";
import { serverEnv } from "@/lib/env";
import type { StorageAdapter, StoredAsset, UploadInput, UploadTicket } from "./adapter";

const MUX_API = "https://api.mux.com";

function authHeader() {
  const env = serverEnv();
  if (!env.MUX_TOKEN_ID || !env.MUX_TOKEN_SECRET) {
    throw new ExternalServiceError("mux", "Missing credentials");
  }
  return "Basic " + Buffer.from(`${env.MUX_TOKEN_ID}:${env.MUX_TOKEN_SECRET}`).toString("base64");
}

export class MuxAdapter implements StorageAdapter {
  readonly name = "mux";
  async createUploadTicket(input: UploadInput): Promise<UploadTicket> {
    const res = await fetch(`${MUX_API}/video/v1/uploads`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        new_asset_settings: { playback_policy: ["public"], mp4_support: "standard" },
        cors_origin: "*",
      }),
    });
    if (!res.ok) throw new ExternalServiceError("mux", `createUpload ${res.status}`);
    const { data } = (await res.json()) as { data: { id: string; url: string } };
    return {
      uploadUrl: data.url,
      method: "PUT",
      headers: { "Content-Type": input.contentType },
      assetId: data.id,
      provider: this.name,
    };
  }
  async getAsset(uploadId: string): Promise<StoredAsset> {
    const upload = await fetch(`${MUX_API}/video/v1/uploads/${uploadId}`, {
      headers: { Authorization: authHeader() },
    });
    if (!upload.ok) throw new ExternalServiceError("mux", `getUpload ${upload.status}`);
    const { data } = (await upload.json()) as { data: { asset_id?: string; status: string } };
    if (!data.asset_id) return { provider: this.name, assetId: uploadId, url: "" };
    const asset = await fetch(`${MUX_API}/video/v1/assets/${data.asset_id}`, {
      headers: { Authorization: authHeader() },
    });
    if (!asset.ok) throw new ExternalServiceError("mux", `getAsset ${asset.status}`);
    const { data: a } = (await asset.json()) as {
      data: {
        id: string;
        duration?: number;
        aspect_ratio?: string;
        playback_ids?: Array<{ id: string }>;
        static_renditions?: { files?: Array<{ name: string; ext: string }> };
      };
    };
    const playbackId = a.playback_ids?.[0]?.id;
    const [w, h] = (a.aspect_ratio ?? "0:0").split(":").map(Number);
    return {
      provider: this.name,
      assetId: a.id,
      url: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : "",
      hlsUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : undefined,
      mp4Url: playbackId ? `https://stream.mux.com/${playbackId}/high.mp4` : undefined,
      posterUrl: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : undefined,
      thumbnailUrl: playbackId ? `https://image.mux.com/${playbackId}/animated.gif` : undefined,
      durationSeconds: a.duration,
      width: w || undefined,
      height: h || undefined,
    };
  }
  async deleteAsset(assetId: string): Promise<void> {
    await fetch(`${MUX_API}/video/v1/assets/${assetId}`, {
      method: "DELETE",
      headers: { Authorization: authHeader() },
    });
  }
}
