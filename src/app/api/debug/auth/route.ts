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
import bcrypt from "bcryptjs";
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

    if (action === "reset-password") {
      // Resets a seller's password to a fresh bcryptjs hash.
      // Use ?username=<u>&password=<p> (defaults to "demo1234").
      if (!username) {
        return NextResponse.json(
          { ok: false, error: "username required" },
          { status: 400 },
        );
      }
      const newPassword = req.nextUrl.searchParams.get("password") ?? "demo1234";
      const passwordHash = await bcrypt.hash(newPassword, 12);
      const updated = await db.seller.update({
        where: { username },
        data: { passwordHash, active: true },
        select: { id: true, username: true, displayName: true, active: true },
      });
      return NextResponse.json({
        ok: true,
        action,
        seller: updated,
        passwordHashPrefix: passwordHash.slice(0, 7),
        passwordSet: newPassword,
      });
    }

    if (action === "verify-password") {
      // Verifies a candidate password against the stored hash for diagnostics.
      // Use ?username=<u>&password=<p>
      if (!username) {
        return NextResponse.json(
          { ok: false, error: "username required" },
          { status: 400 },
        );
      }
      const candidate = req.nextUrl.searchParams.get("password");
      if (!candidate) {
        return NextResponse.json(
          { ok: false, error: "password required" },
          { status: 400 },
        );
      }
      const seller = await db.seller.findFirst({ where: { username } });
      if (!seller) {
        return NextResponse.json(
          { ok: false, error: "seller not found" },
          { status: 404 },
        );
      }
      const match = await bcrypt.compare(candidate, seller.passwordHash);
      return NextResponse.json({
        ok: true,
        action,
        username,
        match,
        passwordHashPrefix: seller.passwordHash.slice(0, 7),
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
