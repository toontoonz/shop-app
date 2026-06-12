import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { OrderConfirmation } from "@/modules/storefront-checkout/ui/OrderConfirmation";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function ConfirmationPage({ params }: Props) {
  const { orderId } = await params;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      seller: { select: { displayName: true } },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 rounded-lg bg-green-50 p-4 text-center">
        <p className="text-lg font-bold text-green-800">✓ บันทึกคำสั่งซื้อเรียบร้อย</p>
        <p className="mt-1 text-sm text-green-600">
          ขอบคุณที่สั่งซื้อ ออเดอร์ของคุณถูกส่งไปยังผู้ขายแล้ว
        </p>
      </div>

      <OrderConfirmation
        id={order.id}
        sellerName={order.seller.displayName}
        totalSatang={order.totalSatang}
        paymentMethod={order.paymentMethod}
        buyerName={order.buyerName}
        buyerPhone={order.buyerPhone}
        buyerEmail={order.buyerEmail}
        items={order.items.map((item) => ({
          productNameAtOrder: item.productNameAtOrder,
          quantity: item.quantity,
          unitPriceSatang: item.unitPriceSatang,
        }))}
      />

      <div className="mt-6 text-center">
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          กลับหน้าร้าน
        </Link>
      </div>
    </div>
  );
}
