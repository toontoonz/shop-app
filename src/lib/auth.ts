import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { LoginThrottle } from "@/modules/seller-account-catalog/services/login-throttle";

// Lightweight logger that writes to Vercel function logs via console.
// Tagged so we can grep in production logs.
const log = (msg: string, data?: Record<string, unknown>) => {
  console.log(`[auth] ${msg}`, data ? JSON.stringify(data) : "");
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NOTE: removed PrismaAdapter — incompatible with `session.strategy: "jwt"`
  // and unnecessary for Credentials provider. The adapter is only useful with
  // database session strategy or OAuth providers that need to persist accounts.
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const username = credentials?.username as string | undefined;
          const password = credentials?.password as string | undefined;

          log("authorize:start", { username, hasPassword: !!password });

          if (!username || !password) {
            log("authorize:reject:missing-fields");
            return null;
          }

          const blocked = await LoginThrottle.isBlocked(username);
          log("authorize:throttle-check", { username, blocked });
          if (blocked) {
            throw new Error("THROTTLED");
          }

          const seller = await db.seller.findFirst({
            where: { username, active: true },
          });
          log("authorize:seller-lookup", {
            username,
            found: !!seller,
            sellerId: seller?.id,
            hashLen: seller?.passwordHash?.length,
          });

          if (!seller) {
            await LoginThrottle.recordFailure(username);
            log("authorize:reject:no-seller");
            return null;
          }

          const ok = await bcrypt.compare(password, seller.passwordHash);
          log("authorize:bcrypt-result", { username, ok });

          if (!ok) {
            await LoginThrottle.recordFailure(username);
            log("authorize:reject:wrong-password");
            return null;
          }

          await LoginThrottle.clear(username);
          log("authorize:success", { username, sellerId: seller.id });

          return {
            id: seller.id,
            name: seller.displayName,
            email: seller.username,
          };
        } catch (err) {
          // Re-throw THROTTLED so Auth.js can surface it; log everything else.
          if (err instanceof Error && err.message === "THROTTLED") throw err;
          log("authorize:error", {
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
          });
          return null;
        }
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
