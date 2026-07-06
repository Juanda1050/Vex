import { z } from "zod";

const verifyTypeSchema = z
  .enum(["signup", "email", "email_change", "magiclink", "invite", "recovery"])
  .optional();

export const verifyEmailSchema = z
  .object({
    token_hash: z.string().min(1, "invalidVerificationLink").optional(),
    code: z.string().min(1, "invalidVerificationLink").optional(),
    type: verifyTypeSchema,
    next: z.string().optional(),
  })
  .refine((data) => Boolean(data.token_hash || data.code), {
    message: "invalidVerificationLink",
    path: ["token_hash"],
  });

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
