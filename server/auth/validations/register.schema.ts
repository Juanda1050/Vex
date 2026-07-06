import { z } from "zod";
import { ORG_NAME_MIN_LENGTH, PASSWORD_MIN_LENGTH } from "./constants";

export const registerSchema = z
  .object({
    orgName: z.string().min(ORG_NAME_MIN_LENGTH, "orgNameMin"),
    email: z.string().email("invalidEmail"),
    password: z.string().min(PASSWORD_MIN_LENGTH, "passwordMin"),
    confirmPassword: z.string().min(PASSWORD_MIN_LENGTH, "passwordMin"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords_mismatch",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
