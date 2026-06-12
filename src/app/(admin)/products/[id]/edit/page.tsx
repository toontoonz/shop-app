import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProductRepository } from "@/modules/seller-account-catalog";
import { ProductForm } from "@/modules/seller-account-catalog/ui/ProductForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const product = await ProductRepository.findActiveById(id);

  if (!product || product.sellerId !== session.user.id) {
    notFound();
  }

  return (
    <div className="flex justify-center py-8">
      <ProductForm
        defaultValues={{
          id: product.id,
          name: product.name,
          description: product.description,
          priceSatang: product.priceSatang,
          stock: product.stock,
          imageUrl: product.imageUrl,
        }}
      />
    </div>
  );
}
