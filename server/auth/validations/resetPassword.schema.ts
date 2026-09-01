import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "./constants";

export const resetPasswordSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN_LENGTH, "passwordMin"),
    confirmPassword: z.string().min(PASSWORD_MIN_LENGTH, "passwordMin"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords_mismatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
