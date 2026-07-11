import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/repos/products";
import ProductDetail from "@/components/store/ProductDetail";
import JsonLd from "@/components/seo/JsonLd";
import { productJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.description.slice(0, 155),
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || product.description.slice(0, 155),
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.archived) notFound();
  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <ProductDetail product={product} />
    </>
  );
}
