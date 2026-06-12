import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProductForm } from "@/modules/seller-account-catalog/ui/ProductForm";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex justify-center py-8">
      <ProductForm />
    </div>
  );
}
