import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-600">ไม่พบหน้าที่คุณต้องการ</p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        กลับหน้าหลัก
      </Link>
    </main>
  );
}
