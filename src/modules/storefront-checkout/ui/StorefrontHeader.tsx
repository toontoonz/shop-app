import Link from "next/link";
import { SearchBox } from "./SearchBox";
import { LogoutButton } from "@/modules/seller-account-catalog/ui/LogoutButton";

type Props = {
  sellerName: string;
};

export function StorefrontHeader({ sellerName }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
            S
          </div>
          <span className="hidden text-lg font-bold text-slate-900 sm:inline">Shop App</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <SearchBox />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Link
            href="/cart"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            <span>🛒</span>
            <span className="hidden sm:inline">ตะกร้า</span>
          </Link>

          {/* Admin link */}
          <Link
            href="/dashboard"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            <span>📊</span>
            <span className="hidden sm:inline">หลังบ้าน</span>
          </Link>

          {/* Seller info + logout */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {sellerName.charAt(0)}
            </div>
            <span className="hidden text-sm text-slate-600 sm:inline">{sellerName}</span>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
