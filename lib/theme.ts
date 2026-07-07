// Visual fallbacks that mirror the mockup's gradient placeholders,
// used when a product has no Cloudflare image yet.

const CATEGORY_GRADIENTS: Record<string, string> = {
  Croissants: "linear-gradient(150deg,#eccb8f,#c89f5d)",
  Brownies: "linear-gradient(150deg,#6f4a2f,#43291a)",
  Cakes: "linear-gradient(150deg,#f1d0c9,#d99f93)",
  Tarts: "linear-gradient(150deg,#f3e2bb,#d9ab63)",
  Cookies: "linear-gradient(150deg,#ddae77,#b07c45)",
  Pastries: "linear-gradient(150deg,#eccb8f,#c89f5d)",
  "Mixed Boxes": "linear-gradient(150deg,#dcb78c,#a87d52)",
  "Celebration Boxes": "linear-gradient(150deg,#f3cfd2,#c98aa8)",
  Other: "linear-gradient(150deg,#f0d3a3,#d2a86a)",
};

/** A CSS `background` value for a product tile: real image if present, else category gradient. */
export function tileBackground(imageUrl: string | null, category: string): string {
  if (imageUrl) return `#efe5d3 center/cover url('${imageUrl}')`;
  return CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.Other;
}
