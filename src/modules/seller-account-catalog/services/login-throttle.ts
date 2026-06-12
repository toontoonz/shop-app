import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

/**
 * Login throttle: blocks a username after 5 failed attempts within 15 minutes.
 * See US-001 AC#6.
 */
export const LoginThrottle = {
  /**
   * Check whether the given username is currently blocked.
   */
  isBlocked: async (username: string): Promise<boolean> => {
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
    const count = await db.failedLogin.count({
      where: {
        username,
        attemptedAt: { gte: windowStart },
      },
    });
    return count >= MAX_ATTEMPTS;
  },

  /**
   * Record a failed login attempt for the given username.
   */
  recordFailure: async (username: string): Promise<void> => {
    await db.failedLogin.create({
      data: { username },
    });
  },

  /**
   * Clear recent failed login records on successful login.
   */
  clear: async (username: string): Promise<void> => {
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
    await db.failedLogin.deleteMany({
      where: {
        username,
        attemptedAt: { gte: windowStart },
      },
    });
  },
};
