/**
 * Video pipeline — orchestrates upload -> processing -> ready.
 * Delegates storage to the configured adapter; DB writes go through the
 * repository so RLS applies.
 */
import type { DB } from "@/lib/db/repository.server";
import { getStorageAdapter } from "@/lib/services/storage/index.server";
import { ExternalServiceError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface CreateVideoInput {
  shopId: string;
  title: string;
  description?: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedBy?: string;
}

export class VideoPipelineService {
  constructor(private readonly db: DB) {}

  /** Step 1: create a DB row + presigned upload ticket for the browser. */
  async initiateUpload(input: CreateVideoInput) {
    const adapter = getStorageAdapter();
    const ticket = await adapter.createUploadTicket({
      shopId: input.shopId,
      filename: input.filename,
      contentType: input.contentType,
      size: input.size,
    });
    const { data, error } = await this.db.from("videos").insert({
      shop_id: input.shopId,
      title: input.title,
      description: input.description,
      status: "uploading",
      provider: adapter.name,
      provider_asset_id: ticket.assetId,
      size_bytes: input.size,
      uploaded_by: input.uploadedBy,
    }).select().single();
    if (error) throw new ExternalServiceError("database", error.message);
    return { video: data, upload: ticket };
  }

  /** Step 2: browser tells us the upload finished — flip to processing. */
  async markUploaded(videoId: string) {
    const { data, error } = await this.db.from("videos")
      .update({ status: "processing" })
      .eq("id", videoId).select().single();
    if (error) throw new ExternalServiceError("database", error.message);
    return data;
  }

  /** Step 3: fetch provider metadata + persist ready state. */
  async syncFromProvider(videoId: string) {
    const { data: video, error } = await this.db.from("videos")
      .select("*").eq("id", videoId).maybeSingle();
    if (error) throw new ExternalServiceError("database", error.message);
    if (!video) throw new NotFoundError("video");
    const adapter = getStorageAdapter();
    const asset = await adapter.getAsset(video.provider_asset_id as string);
    const status = asset.hlsUrl || asset.mp4Url ? "ready" : "processing";
    const { data: updated, error: updErr } = await this.db.from("videos").update({
      status,
      hls_url: asset.hlsUrl,
      mp4_url: asset.mp4Url,
      poster_url: asset.posterUrl,
      thumbnail_url: asset.thumbnailUrl,
      duration_seconds: asset.durationSeconds,
      width: asset.width,
      height: asset.height,
    }).eq("id", videoId).select().single();
    if (updErr) throw new ExternalServiceError("database", updErr.message);
    logger.info("video.synced", { shopId: video.shop_id, videoId, status });
    return updated;
  }

  async remove(videoId: string) {
    const { data: video } = await this.db.from("videos").select("*").eq("id", videoId).maybeSingle();
    if (video?.provider_asset_id) {
      try {
        await getStorageAdapter().deleteAsset(video.provider_asset_id as string);
      } catch (err) {
        logger.warn("video.delete.provider_failed", { videoId, err: (err as Error).message });
      }
    }
    const { error } = await this.db.from("videos").delete().eq("id", videoId);
    if (error) throw new ExternalServiceError("database", error.message);
    return { ok: true as const };
  }
}
