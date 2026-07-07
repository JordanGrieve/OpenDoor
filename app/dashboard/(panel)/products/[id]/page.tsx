import ProductEditor from "@/components/dashboard/ProductEditor";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor mode="edit" productId={Number(id)} />;
}
