/**
 * Debug endpoint — verify DB connection + auth state on production.
 *
 * Guarded by CRON_SECRET. Call with:
 *   GET /api/debug/auth?secret=<CRON_SECRET>           → status snapshot
 *   POST /api/debug/auth?secret=<CRON_SECRET>&action=clear-throttle&username=<u>
 *                                                       → clear all FailedLogin
 *                                                         rows for the user
 *
 * Remove this file after the production login issue is resolved.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = req.nextUrl.searchParams.get("secret");
  return !!secret && secret === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const sellers = await db.seller.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        active: true,
        passwordHash: true, // returned only to verify length/prefix
      },
    });

    const failedLogins = await db.failedLogin.findMany({
      orderBy: { attemptedAt: "desc" },
      take: 20,
      select: { username: true, attemptedAt: true },
    });

    const failedCount = await db.failedLogin.count();

    return NextResponse.json({
      ok: true,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
      },
      sellers: sellers.map((s) => ({
        id: s.id,
        username: s.username,
        displayName: s.displayName,
        active: s.active,
        passwordHashPrefix: s.passwordHash.slice(0, 7), // bcrypt = $2a$12$ / $2b$12$
        passwordHashLength: s.passwordHash.length,
      })),
      failedLogins: {
        total: failedCount,
        recent: failedLogins,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get("action");
  const username = req.nextUrl.searchParams.get("username");

  try {
    if (action === "clear-throttle") {
      const where = username ? { username } : {};
      const result = await db.failedLogin.deleteMany({ where });
      return NextResponse.json({
        ok: true,
        action,
        deleted: result.count,
        username: username ?? "(all)",
      });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
