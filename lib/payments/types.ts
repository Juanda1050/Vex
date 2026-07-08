export interface PaymentFormData {
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  billingEmail: string;
  billingName: string;
  billingCountry: string;
}

export interface PaymentGatewayConfig {
  provider: "stripe" | "mercadopago" | "placeholder";
  apiKey?: string;
  webhookSecret?: string;
}
