import { productRepository } from "../repository/product.repository";
import type {
  CreateProductInput,
  ProductFilters,
  UpdateProductInput,
} from "../types/product.types";

export class ProductService {
  async createProduct(input: CreateProductInput) {
    return productRepository.create(input);
  }

  async getProduct(tenantId: string, productId: string) {
    const product = await productRepository.findById(tenantId, productId);
    if (!product) throw new Error("Producto no encontrado.");
    return product;
  }

  async listProducts(tenantId: string, filters: ProductFilters) {
    return productRepository.list(tenantId, filters);
  }

  async updateProduct(input: UpdateProductInput) {
    await this.getProduct(input.tenantId, input.id);
    return productRepository.update(input);
  }

  async deleteProduct(tenantId: string, productId: string) {
    await this.getProduct(tenantId, productId);
    await productRepository.softDelete(tenantId, productId);
  }
}

export const productService = new ProductService();
