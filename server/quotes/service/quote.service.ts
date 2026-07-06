import { quoteRepository } from "../repository/quote.repository";
import type {
  ConvertQuoteToSaleInput,
  CreateQuoteInput,
  QuoteFilters,
} from "../types/quote.types";

export class QuoteService {
  async createQuote(input: CreateQuoteInput) {
    return quoteRepository.createQuote(input);
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
  }

  async convertQuoteToSale(input: ConvertQuoteToSaleInput) {
    return quoteRepository.convertToSale(input);
  }
}

export const quoteService = new QuoteService();
