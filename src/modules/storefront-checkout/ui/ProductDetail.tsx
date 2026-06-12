import { formatTHB } from "@/lib/money";

type Props = {
  name: string;
  description: string | null;
  priceSatang: number;
  stock: number;
  imageUrl: string | null;
  sellerName: string;
};

export function ProductDetail({ name, description, priceSatang, stock, imageUrl, sellerName }: Props) {
  const outOfStock = stock === 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner">
          <div className="aspect-square flex items-center justify-center p-8">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              <span className="text-8xl opacity-25">📦</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center gap-5 py-4">
          {/* Name */}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-indigo-600">{formatTHB(priceSatang)}</span>
          </div>

          {/* Seller */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {sellerName.charAt(0)}
            </div>
            <span className="text-sm text-slate-600">{sellerName}</span>
          </div>

          {/* Stock */}
          {outOfStock ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
              <span className="text-sm">❌</span>
              <span className="text-sm font-medium text-red-700">สินค้าหมด</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
              <span className="text-sm">✅</span>
              <span className="text-sm font-medium text-green-700">มีสินค้า — คงเหลือ {stock} ชิ้น</span>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                รายละเอียดสินค้า
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
