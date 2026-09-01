import { productRepository } from "../repository/product.repository";
import { unstable_cache } from "next/cache";
import { invalidateTenantOperationalCaches } from "@/server/cache/tenantCacheInvalidation";
import type {
  CreateProductInput,
  ProductFilters,
  UpdateProductInput,
} from "../types/product.types";

export class ProductService {
  async countActiveProducts(tenantId: string) {
    return unstable_cache(
      () => productRepository.countActiveByTenant(tenantId),
      ["products-active-count", tenantId],
      {
        revalidate: 30,
        tags: [`products-active-count:${tenantId}`],
      },
    )();
  }

  async createProduct(input: CreateProductInput) {
    const product = await productRepository.create(input);
    invalidateTenantOperationalCaches(input.tenantId);
    return product;
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
    const product = await productRepository.update(input);
    invalidateTenantOperationalCaches(input.tenantId);
    return product;
  }

  async deleteProduct(tenantId: string, productId: string) {
    await this.getProduct(tenantId, productId);
    await productRepository.softDelete(tenantId, productId);
    invalidateTenantOperationalCaches(tenantId);
  }
}

export const productService = new ProductService();
