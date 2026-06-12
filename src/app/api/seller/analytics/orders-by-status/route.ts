import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth } from "@/lib/auth-middleware";
import { resolveRange, parseRangeParam } from "@/lib/time-range";
import { getOrdersByStatus } from "@/modules/sales-analytics";

export const GET = withSellerAuth(async (req, { seller }) => {
  const rangeParam = req.nextUrl.searchParams.get("range");
  const preset = parseRangeParam(rangeParam);
  const range = resolveRange(preset);
  const result = await getOrdersByStatus(seller.id, range);
  return NextResponse.json({ ok: true, data: result });
});
