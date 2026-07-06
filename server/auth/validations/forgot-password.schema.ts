import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("invalidEmail"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
