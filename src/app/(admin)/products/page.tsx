import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ProductRepository } from "@/modules/seller-account-catalog";
import { ProductTableSeller } from "@/modules/seller-account-catalog/ui/ProductTableSeller";
import { buttonVariants } from "@/components/ui/button";

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const products = await ProductRepository.findActiveBySellerId(session.user.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">สินค้าของฉัน</h1>
        <Link href="/products/new" className={buttonVariants()}>
          + สร้างสินค้า
        </Link>
      </div>
      <ProductTableSeller products={products} />
    </div>
  );
}
