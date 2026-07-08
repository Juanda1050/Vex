/**
 * Payment gateway abstraction layer.
 *
 * Implementing this interface is all that is required to connect
 * Stripe, Mercado Pago, or any other provider without touching
 * the onboarding navigation flow.
 *
 * Steps to integrate a real provider:
 *  1. Create a new file, e.g. `lib/payments/stripe-gateway.ts`,
 *     implementing `PaymentGateway`.
 *  2. Set the env variable PAYMENT_GATEWAY=stripe (or "mercadopago").
 *  3. Export it from this file by updating `resolveGateway()`.
 */

export interface CheckoutSessionParams {
  planCode: string;
  /** External price ID from the plan catalogue (Stripe/MP). */
  priceId?: string;
  userId: string;
  locale: string;
  /** Full URL where the provider should redirect on success. */
  successUrl: string;
  /** Full URL where the provider should redirect on cancel. */
  cancelUrl: string;
}

export interface CheckoutSession {
  /** Opaque identifier used to verify the payment later. */
  sessionId: string;
  /**
   * URL to redirect the user to.
   * - Placeholder: internal checkout page
   * - Stripe: Stripe Checkout URL
   * - Mercado Pago: preference init_point URL
   */
  redirectUrl: string;
}

export interface PaymentVerification {
  valid: boolean;
  planCode: string;
}

export interface PaymentGateway {
  /** Human-readable provider name, used for logging. */
  readonly name: string;
  createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<CheckoutSession>;
  verifyPayment(sessionId: string): Promise<PaymentVerification>;
}

// ---------------------------------------------------------------------------
// Placeholder implementation (no external dependency)
// ---------------------------------------------------------------------------

class PlaceholderGateway implements PaymentGateway {
  readonly name = "placeholder";

  async createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<CheckoutSession> {
    const sessionId = `placeholder_${params.planCode}`;
    const url = new URL(params.successUrl);
    url.searchParams.set("session", sessionId);
    return { sessionId, redirectUrl: url.toString() };
  }

  async verifyPayment(sessionId: string): Promise<PaymentVerification> {
    if (sessionId.startsWith("placeholder_")) {
      const planCode = sessionId.replace("placeholder_", "");
      return { valid: true, planCode };
    }
    return { valid: false, planCode: "" };
  }
}

// ---------------------------------------------------------------------------
// Factory — swap implementation here when a real gateway is ready
// ---------------------------------------------------------------------------

function resolveGateway(): PaymentGateway {
  // const provider = process.env.PAYMENT_GATEWAY;
  // if (provider === "stripe") return new StripeGateway();
  // if (provider === "mercadopago") return new MercadoPagoGateway();
  return new PlaceholderGateway();
}

export const paymentGateway: PaymentGateway = resolveGateway();
