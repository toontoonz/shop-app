import Link from "next/link";
import type { Product } from "@prisma/client";
import { formatTHB } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteProductDialog } from "./DeleteProductDialog";

type Props = {
  products: Product[];
};

export function ProductTableSeller({ products }: Props) {
  if (products.length === 0) {
    return <p className="py-8 text-center text-gray-500">ยังไม่มีสินค้า — สร้างสินค้าแรกของคุณ</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ชื่อ</TableHead>
          <TableHead className="text-right">ราคา</TableHead>
          <TableHead className="text-right">คงเหลือ</TableHead>
          <TableHead className="text-right">จัดการ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell className="text-right">{formatTHB(product.priceSatang)}</TableCell>
            <TableCell className="text-right">
              {product.stock === 0 ? (
                <Badge variant="destructive">สินค้าหมด</Badge>
              ) : (
                product.stock
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/products/${product.id}/edit`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  แก้ไข
                </Link>
                <DeleteProductDialog productId={product.id} productName={product.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
