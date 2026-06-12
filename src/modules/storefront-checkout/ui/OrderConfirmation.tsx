import { formatTHB } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: "โอนเงินผ่านธนาคาร",
  COD: "เก็บเงินปลายทาง",
  E_WALLET: "กระเป๋าเงินอิเล็กทรอนิกส์",
  CREDIT_CARD: "บัตรเครดิต",
};

type OrderItem = {
  productNameAtOrder: string;
  quantity: number;
  unitPriceSatang: number;
};

type Props = {
  id: string;
  sellerName: string;
  totalSatang: number;
  paymentMethod: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  items: OrderItem[];
};

export function OrderConfirmation({
  id,
  sellerName,
  totalSatang,
  paymentMethod,
  buyerName,
  buyerPhone,
  buyerEmail,
  items,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>ออเดอร์ #{id.slice(-8)}</span>
          <Badge variant="secondary">{sellerName}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div>
          <h3 className="mb-1 text-sm font-semibold text-gray-700">รายการสินค้า</h3>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-0.5 text-sm">
              <span>
                {item.productNameAtOrder} × {item.quantity}
              </span>
              <span>{formatTHB(item.unitPriceSatang * item.quantity)}</span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
            <span>รวม</span>
            <span className="text-primary">{formatTHB(totalSatang)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="text-sm">
          <span className="font-medium text-gray-700">วิธีชำระเงิน: </span>
          <span>{PAYMENT_LABELS[paymentMethod] ?? paymentMethod}</span>
        </div>

        {/* Buyer Info */}
        <div className="text-sm">
          <h3 className="mb-1 font-semibold text-gray-700">ข้อมูลผู้สั่งซื้อ</h3>
          <p>ชื่อ: {buyerName}</p>
          <p>เบอร์โทร: {buyerPhone}</p>
          {buyerEmail && <p>อีเมล: {buyerEmail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
