import { z } from "zod";

export const CredentialsSchema = z.object({
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export type CredentialsInput = z.infer<typeof CredentialsSchema>;
