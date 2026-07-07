// ─────────────────────────────────────────────────────────────
// Cloudflare Images — product image storage + delivery.
// uploadImage() pushes a file to Cloudflare and returns the
// delivery URL. deliveryUrl() builds a URL from an image id.
// Falls back to a log + null when unconfigured.
// ─────────────────────────────────────────────────────────────

const ACCOUNT_ID = () => process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = () => process.env.CLOUDFLARE_IMAGES_TOKEN;
const HASH = () => process.env.CLOUDFLARE_IMAGES_HASH;

export function imagesConfigured(): boolean {
  return Boolean(ACCOUNT_ID() && TOKEN() && HASH());
}

/** Build a Cloudflare Images delivery URL for a stored image id. */
export function deliveryUrl(imageId: string, variant = "public"): string {
  return `https://imagedelivery.net/${HASH()}/${imageId}/${variant}`;
}

export interface UploadResult {
  ok: boolean;
  id: string | null;
  url: string | null;
  skipped: boolean;
  error?: string;
}

/** Upload an image file to Cloudflare Images. */
export async function uploadImage(file: File | Blob, filename = "upload"): Promise<UploadResult> {
  const account = ACCOUNT_ID();
  const token = TOKEN();
  if (!account || !token || !HASH()) {
    console.log(`[images:skipped] upload "${filename}" (Cloudflare Images not set)`);
    return { ok: false, id: null, url: null, skipped: true };
  }
  try {
    const form = new FormData();
    form.append("file", file, filename);
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/images/v1`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
    );
    const json = (await res.json()) as {
      success: boolean;
      result?: { id: string };
      errors?: { message: string }[];
    };
    if (!json.success || !json.result) {
      return { ok: false, id: null, url: null, skipped: false, error: json.errors?.[0]?.message };
    }
    return { ok: true, id: json.result.id, url: deliveryUrl(json.result.id), skipped: false };
  } catch (err) {
    return { ok: false, id: null, url: null, skipped: false, error: (err as Error).message };
  }
}
