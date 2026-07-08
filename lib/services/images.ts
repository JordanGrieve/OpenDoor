// ─────────────────────────────────────────────────────────────
// Cloudinary — product image storage + delivery.
// uploadImage() pushes a file to Cloudinary and returns an
// f_auto,q_auto-optimised delivery URL. Falls back to a log + null
// when unconfigured (so the dashboard can accept pasted URLs instead).
// ─────────────────────────────────────────────────────────────
import { v2 as cloudinary } from "cloudinary";

let _configured = false;

function configure(): boolean {
  if (_configured) return true;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) return false;
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  _configured = true;
  return true;
}

export function imagesConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/** Optimised (auto format + quality) delivery URL for a stored public id. */
export function deliveryUrl(publicId: string): string {
  configure();
  return cloudinary.url(publicId, { fetch_format: "auto", quality: "auto", secure: true });
}

export interface UploadResult {
  ok: boolean;
  id: string | null; // Cloudinary public_id
  url: string | null; // optimised delivery URL
  skipped: boolean;
  error?: string;
}

/** Upload an image file to Cloudinary (folder: open-door). */
export async function uploadImage(file: File | Blob, filename = "upload"): Promise<UploadResult> {
  if (!configure()) {
    console.log(`[images:skipped] upload "${filename}" (Cloudinary not configured)`);
    return { ok: false, id: null, url: null, skipped: true };
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = (file as File).type || "image/jpeg";
    const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;
    const res = await cloudinary.uploader.upload(dataUri, { folder: "open-door" });
    return { ok: true, id: res.public_id, url: deliveryUrl(res.public_id), skipped: false };
  } catch (err) {
    return { ok: false, id: null, url: null, skipped: false, error: (err as Error).message };
  }
}
