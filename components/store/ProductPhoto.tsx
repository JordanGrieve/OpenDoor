import { categoryGradient } from "@/lib/theme";

// Fills its (position:relative) parent: a real photo when present, else the
// category gradient placeholder. Cloudinary already serves f_auto,q_auto so
// a plain <img> is enough (no next/image needed).
export default function ProductPhoto({
  url,
  category,
  alt,
}: {
  url: string | null;
  category: string;
  alt: string;
}) {
  const base: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} loading="lazy" style={{ ...base, objectFit: "cover" }} />;
  }
  return <div aria-hidden style={{ ...base, background: categoryGradient(category) }} />;
}
