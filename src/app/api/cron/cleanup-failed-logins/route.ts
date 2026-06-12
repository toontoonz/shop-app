import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/log";

/**
 * GET /api/cron/cleanup-failed-logins
 * Vercel Cron Job — runs daily at 03:00 UTC.
 * Deletes FailedLogin rows older than 24 hours.
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Invalid cron secret" } },
      { status: 401 },
    );
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await db.failedLogin.deleteMany({
    where: { attemptedAt: { lt: cutoff } },
  });

  log.info({ deleted: result.count }, "Cron: cleaned up failed login records");

  return NextResponse.json({ ok: true, data: { deleted: result.count } });
}
