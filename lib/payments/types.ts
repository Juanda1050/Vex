export interface PaymentFormData {
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  billingCountry: string;
  billingPostalCode: string;
}

export interface PaymentGatewayConfig {
  provider: "stripe" | "mercadopago" | "placeholder";
  apiKey?: string;
  webhookSecret?: string;
}
