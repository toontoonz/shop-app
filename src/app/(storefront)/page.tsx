import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductCard } from "@/modules/storefront-checkout/ui/ProductCard";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function StorefrontHomePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { q } = await searchParams;
  const sellerId = session.user.id;

  // POS model: show only products owned by the logged-in seller
  const products = await db.product.findMany({
    where: {
      sellerId,
      active: true,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { seller: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-700">
          {q ? `ไม่พบสินค้าที่ตรงกับ "${q}"` : "ยังไม่มีสินค้าในระบบ"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {q ? "ลองค้นหาด้วยคำอื่น" : "เพิ่มสินค้าได้ที่เมนู จัดการสินค้า"}
        </p>
      </div>
    );
  }

  // Separate in-stock and out-of-stock
  const inStock = products.filter((p) => p.stock > 0);
  const outOfStock = products.filter((p) => p.stock === 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Search result info */}
      {q && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-slate-500">
            ผลการค้นหา &ldquo;{q}&rdquo;
          </span>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
            {products.length} รายการ
          </span>
        </div>
      )}

      {/* Stats bar */}
      {!q && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">สินค้าทั้งหมด</h1>
            <p className="text-sm text-slate-500">เลือกสินค้าสำหรับลูกค้า</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-lg bg-green-50 px-3 py-1.5 text-center">
              <p className="text-lg font-bold text-green-700">{inStock.length}</p>
              <p className="text-xs text-green-600">มีสินค้า</p>
            </div>
            {outOfStock.length > 0 && (
              <div className="rounded-lg bg-red-50 px-3 py-1.5 text-center">
                <p className="text-lg font-bold text-red-700">{outOfStock.length}</p>
                <p className="text-xs text-red-600">สินค้าหมด</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-stock products grid */}
      {inStock.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {inStock.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              priceSatang={product.priceSatang}
              stock={product.stock}
              imageUrl={product.imageUrl}
              sellerName={product.seller.displayName}
            />
          ))}
        </div>
      )}

      {/* Out-of-stock section */}
      {outOfStock.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-slate-400 uppercase tracking-wide">
            สินค้าหมด ({outOfStock.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 opacity-60 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {outOfStock.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                priceSatang={product.priceSatang}
                stock={product.stock}
                imageUrl={product.imageUrl}
                sellerName={product.seller.displayName}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
