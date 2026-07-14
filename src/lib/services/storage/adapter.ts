/**
 * Storage adapter abstraction — one interface, three back-end
 * implementations. Selection driven by MEDIA_PROVIDER env var.
 */
export interface UploadInput {
  filename: string;
  contentType: string;
  size: number;
  shopId: string;
}

export interface UploadTicket {
  uploadUrl: string;
  method: "POST" | "PUT";
  fields?: Record<string, string>;
  headers?: Record<string, string>;
  assetId: string;
  provider: string;
}

export interface StoredAsset {
  provider: string;
  assetId: string;
  url: string;
  hlsUrl?: string;
  mp4Url?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface StorageAdapter {
  readonly name: string;
  createUploadTicket(input: UploadInput): Promise<UploadTicket>;
  getAsset(assetId: string): Promise<StoredAsset>;
  deleteAsset(assetId: string): Promise<void>;
}
