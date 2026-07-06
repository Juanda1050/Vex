import { z } from "zod";

export const changePlanSchema = z.object({
  planCode: z.string().min(1, "planCodeRequired"),
  priceId: z.string().uuid("invalidPriceId").optional(),
});

export type ChangePlanInput = z.infer<typeof changePlanSchema>;

export const subscriptionActionStateSchema = z.object({
  success: z.boolean(),
  error: z.string().nullable(),
});

export type SubscriptionActionState = z.infer<
  typeof subscriptionActionStateSchema
>;
