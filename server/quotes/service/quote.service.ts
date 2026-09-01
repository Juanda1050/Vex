import { quoteRepository } from "../repository/quote.repository";
import { invalidateTenantOperationalCaches } from "@/server/cache/tenantCacheInvalidation";
import type {
  ConvertQuoteToSaleInput,
  CreateQuoteInput,
  QuoteFilters,
} from "../types/quote.types";

export class QuoteService {
  async createQuote(input: CreateQuoteInput) {
    const quote = await quoteRepository.createQuote(input);
    invalidateTenantOperationalCaches(input.tenantId);
    return quote;
  }

  async getQuote(tenantId: string, quoteId: string) {
    const quote = await quoteRepository.findById(tenantId, quoteId);
    if (!quote) throw new Error("Cotizacion no encontrada.");
    return quote;
  }

  async listQuotes(tenantId: string, filters: QuoteFilters) {
    return quoteRepository.listQuotes(tenantId, filters);
  }

  async deleteQuote(tenantId: string, quoteId: string) {
    await quoteRepository.deleteQuote(tenantId, quoteId);
    invalidateTenantOperationalCaches(tenantId);
  }

  async convertQuoteToSale(input: ConvertQuoteToSaleInput) {
    const sale = await quoteRepository.convertToSale(input);
    invalidateTenantOperationalCaches(input.tenantId);
    return sale;
  }
}

export const quoteService = new QuoteService();
