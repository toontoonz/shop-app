import { db } from "@/lib/db";
import { QUALIFYING_STATUSES } from "../domain/analytics-criteria";
import type { ResolvedRange } from "@/lib/time-range";

export type SalesPoint = {
  bucket: string; // ISO date (YYYY-MM-DD) or year-month (YYYY-MM)
  revenueSatang: number;
};

export type SalesOverTimeResult = {
  interval: "DAY" | "MONTH";
  points: SalesPoint[];
};

/**
 * Get sales over time for a seller within a date range.
 * Groups by day or month depending on the resolved interval.
 */
export async function getSalesOverTime(
  sellerId: string,
  range: ResolvedRange,
): Promise<SalesOverTimeResult> {
  const truncFn = range.interval === "DAY" ? "day" : "month";

  const rows = await db.$queryRaw<Array<{ bucket: Date; revenue: bigint }>>`
    SELECT
      date_trunc(${truncFn}, "createdAt") AS bucket,
      COALESCE(SUM("totalSatang"), 0) AS revenue
    FROM "Order"
    WHERE "sellerId" = ${sellerId}
      AND "createdAt" >= ${range.from}
      AND "createdAt" <= ${range.to}
      AND "status" IN (${db.$queryRaw`${QUALIFYING_STATUSES[0]!}`}, ${db.$queryRaw`${QUALIFYING_STATUSES[1]!}`}, ${db.$queryRaw`${QUALIFYING_STATUSES[2]!}`})
    GROUP BY bucket
    ORDER BY bucket ASC
  `.catch(() => []);

  // Fallback: use Prisma's standard query instead of raw SQL for better compatibility
  const orders = await db.order.findMany({
    where: {
      sellerId,
      createdAt: { gte: range.from, lte: range.to },
      status: { in: QUALIFYING_STATUSES },
    },
    select: { createdAt: true, totalSatang: true },
    orderBy: { createdAt: "asc" },
  });

  // Group manually by bucket
  const bucketMap = new Map<string, number>();
  for (const order of orders) {
    const d = order.createdAt;
    const key =
      range.interval === "DAY"
        ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
        : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    bucketMap.set(key, (bucketMap.get(key) ?? 0) + order.totalSatang);
  }

  const points: SalesPoint[] = Array.from(bucketMap.entries()).map(([bucket, revenueSatang]) => ({
    bucket,
    revenueSatang,
  }));

  return { interval: range.interval, points };
}
