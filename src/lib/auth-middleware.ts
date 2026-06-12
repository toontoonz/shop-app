import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiErrors } from "@/lib/api-handler";
import type { Seller } from "@prisma/client";

export type SellerContext = { seller: Seller };

/**
 * Wraps a Next.js Route Handler to require an authenticated, active Seller.
 * Also provides error handling via handleApiErrors.
 *
 * Usage:
 *   export const GET = withSellerAuth(async (req, { seller }) => { ... });
 *   export const PATCH = withSellerAuth(async (req, { seller }) => { ... });
 */
export function withSellerAuth(
  handler: (req: NextRequest, ctx: SellerContext) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    return handleApiErrors(async () => {
      const session = await auth();

      if (!session?.user?.id) {
        return NextResponse.json(
          { ok: false, error: { code: "UNAUTHENTICATED", message: "Login required" } },
          { status: 401 },
        );
      }

      const seller = await db.seller.findUnique({
        where: { id: session.user.id, active: true },
      });

      if (!seller) {
        return NextResponse.json(
          { ok: false, error: { code: "UNAUTHENTICATED", message: "Login required" } },
          { status: 401 },
        );
      }

      return handler(req, { seller });
    }, req);
  };
}
