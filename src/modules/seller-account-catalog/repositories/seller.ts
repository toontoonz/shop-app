import { db } from "@/lib/db";
import type { Seller } from "@prisma/client";

export const SellerRepository = {
  findByUsername: async (username: string): Promise<Seller | null> => {
    return db.seller.findUnique({ where: { username, active: true } });
  },

  findById: async (id: string): Promise<Seller | null> => {
    return db.seller.findUnique({ where: { id, active: true } });
  },

  findAll: async (): Promise<Seller[]> => {
    return db.seller.findMany({ where: { active: true }, orderBy: { displayName: "asc" } });
  },
};
