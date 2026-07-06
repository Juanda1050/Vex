import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "./constants";

export const loginSchema = z.object({
  email: z.string().email("invalidEmail"),
  password: z.string().min(PASSWORD_MIN_LENGTH, "passwordMin"),
});

export type LoginInput = z.infer<typeof loginSchema>;
