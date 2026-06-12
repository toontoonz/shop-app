import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProductDetail } from "@/modules/storefront-checkout/ui/ProductDetail";
import { AddToCartButton } from "@/modules/storefront-checkout/ui/AddToCartButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await db.product.findFirst({
    where: { id, active: true },
    include: { seller: { select: { displayName: true } } },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">หน้าร้าน</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">{product.name}</span>
      </nav>

      <ProductDetail
        name={product.name}
        description={product.description}
        priceSatang={product.priceSatang}
        stock={product.stock}
        imageUrl={product.imageUrl}
        sellerName={product.seller.displayName}
      />

      {/* Add to cart — positioned below the info section on mobile, beside on desktop */}
      <div className="mx-auto mt-8 max-w-4xl">
        <div className="md:ml-auto md:w-1/2 md:pl-4">
          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </div>
    </div>
  );
}
