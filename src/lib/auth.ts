import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { LoginThrottle } from "@/modules/seller-account-catalog/services/login-throttle";

/**
 * Throttle error — surfaced to the client via `result.code = "throttled"`
 * so the LoginForm can show a localized message.
 */
class ThrottledSignin extends CredentialsSignin {
  code = "throttled";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NOTE: PrismaAdapter intentionally omitted — it is incompatible with
  // `session.strategy: "jwt"` and is unnecessary for the Credentials provider.
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

          if (!username || !password) return null;

          if (await LoginThrottle.isBlocked(username)) {
            throw new ThrottledSignin();
          }

          const seller = await db.seller.findFirst({
            where: { username, active: true },
          });

          if (!seller) {
            await LoginThrottle.recordFailure(username);
            return null;
          }

          const ok = await bcrypt.compare(password, seller.passwordHash);
          if (!ok) {
            await LoginThrottle.recordFailure(username);
            return null;
          }

          await LoginThrottle.clear(username);
          return {
            id: seller.id,
            name: seller.displayName,
            email: seller.username,
          };
        } catch (err) {
          // Re-throw Auth.js-aware errors so the framework can map them.
          if (err instanceof CredentialsSignin) throw err;
          // Log unexpected failures to Vercel function logs for diagnosis,
          // then return null so Auth.js produces the standard error.
          console.error("[auth] authorize unexpected error:", err);
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
