import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/modules/seller-account-catalog/ui/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen">
      {/* Left panel — branding / illustration */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-12 text-white lg:flex">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shop App</h1>
          <p className="mt-1 text-sm text-slate-400">ระบบจัดการร้านค้า</p>
        </div>
        <div className="space-y-4">
          <blockquote className="border-l-2 border-indigo-400 pl-4 text-lg italic text-slate-300">
            &ldquo;จัดการสินค้า ออเดอร์ และยอดขายได้ง่ายๆ ในที่เดียว&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-xl">
              🏪
            </div>
            <div>
              <p className="text-sm font-medium">POS สำหรับร้านค้ายุคใหม่</p>
              <p className="text-xs text-slate-400">เริ่มขายได้ทันทีหลัง login</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">© 2026 Shop App. All rights reserved.</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-6 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile-only logo */}
          <div className="text-center lg:hidden">
            <h1 className="text-2xl font-bold text-slate-900">Shop App</h1>
            <p className="text-sm text-slate-500">ระบบจัดการร้านค้า</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
