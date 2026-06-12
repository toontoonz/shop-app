"use client";

import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "โอนเงินผ่านธนาคาร", icon: "🏦" },
  { value: "COD", label: "เก็บเงินปลายทาง", icon: "💵" },
  { value: "E_WALLET", label: "กระเป๋าเงินอิเล็กทรอนิกส์", icon: "📱" },
  { value: "CREDIT_CARD", label: "บัตรเครดิต", icon: "💳" },
] as const;

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
};

export function PaymentMethodPicker({ value, onChange, error }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">วิธีชำระเงิน *</p>
      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(method.value)}
            className={cn(
              "flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors",
              value === method.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-gray-200 hover:border-gray-300",
            )}
          >
            <span className="text-lg">{method.icon}</span>
            <span>{method.label}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
