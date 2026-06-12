import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { LoginThrottle } from "@/modules/seller-account-catalog/services/login-throttle";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) return null;

        if (await LoginThrottle.isBlocked(username)) {
          throw new Error("THROTTLED");
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
  trustHost: true,
});
