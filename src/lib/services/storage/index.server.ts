/** Storage adapter factory. */
import { serverEnv } from "@/lib/env";
import type { StorageAdapter } from "./adapter";
import { CloudinaryAdapter } from "./cloudinary.server";
import { MuxAdapter } from "./mux.server";
import { S3Adapter } from "./s3.server";

export function getStorageAdapter(): StorageAdapter {
  switch (serverEnv().MEDIA_PROVIDER) {
    case "mux": return new MuxAdapter();
    case "s3": return new S3Adapter();
    case "cloudinary":
    default: return new CloudinaryAdapter();
  }
}
export type { StorageAdapter, UploadInput, UploadTicket, StoredAsset } from "./adapter";
