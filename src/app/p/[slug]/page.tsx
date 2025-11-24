import { notFound } from "next/navigation";
import { fetchMagentoProductDetail } from "../../../lib/magento";
import { ProductDetailClient } from "../../../components/product-detail/product-detail-client";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const slug = decodeURIComponent(resolved.slug);
  const product = await fetchMagentoProductDetail(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} slug={slug} />;
}
