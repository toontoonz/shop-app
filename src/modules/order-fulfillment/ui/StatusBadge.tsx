import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ORDERED: { label: "สั่งซื้อ", className: "bg-blue-100 text-blue-800" },
  PAID: { label: "ชำระเงิน", className: "bg-yellow-100 text-yellow-800" },
  PACKING: { label: "กำลังแพ็ค", className: "bg-orange-100 text-orange-800" },
  SHIPPED: { label: "จัดส่ง", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "ยกเลิก", className: "bg-red-100 text-red-800" },
};

type Props = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-800" };

  return (
    <Badge variant="secondary" className={cn("font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
