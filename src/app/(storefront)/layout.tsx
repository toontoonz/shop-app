import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StorefrontHeader } from "@/modules/storefront-checkout/ui/StorefrontHeader";
import { LogoutButton } from "@/modules/seller-account-catalog/ui/LogoutButton";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  // POS model: seller must be logged in to operate the storefront
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader sellerName={session.user.name ?? ""} logoutButton={<LogoutButton />} />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
