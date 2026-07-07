import { NextResponse } from "next/server";
import { addProductImage } from "@/lib/repos/products-admin";
import { uploadImage } from "@/lib/services/images";

export const dynamic = "force-dynamic";

// POST /api/admin/products/:id/images
//  • multipart form-data with `file`  → uploads to Cloudflare Images
//  • JSON { url, alt }                → stores a pasted delivery URL
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = Number(id);
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const alt = String(form.get("alt") || "");
      if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
      const result = await uploadImage(file, file.name);
      if (!result.ok || !result.url) {
        return NextResponse.json(
          { error: result.skipped ? "Cloudflare Images isn't configured yet — paste a URL instead." : result.error || "Upload failed" },
          { status: 400 }
        );
      }
      const imageId = await addProductImage(productId, { url: result.url, cloudflareId: result.id, alt });
      return NextResponse.json({ id: imageId, url: result.url });
    }

    const body = (await req.json()) as { url?: string; alt?: string };
    if (!body.url?.trim()) return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    const imageId = await addProductImage(productId, { url: body.url.trim(), alt: body.alt });
    return NextResponse.json({ id: imageId, url: body.url.trim() });
  } catch (err) {
    console.error("[admin/products/images POST]", err);
    return NextResponse.json({ error: "Failed to add image" }, { status: 500 });
  }
}
