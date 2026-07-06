import { customerRepository } from "../repository/customer.repository";
import type {
  CreateCustomerInput,
  CustomerFilters,
  UpdateCustomerInput,
} from "../types/customer.types";

export class CustomerService {
  async createCustomer(input: CreateCustomerInput) {
    return customerRepository.create(input);
  }

  async getCustomer(tenantId: string, customerId: string) {
    const customer = await customerRepository.findById(tenantId, customerId);
    if (!customer) throw new Error("Cliente no encontrado.");
    return customer;
  }

  async listCustomers(tenantId: string, filters: CustomerFilters = {}) {
    return customerRepository.list(tenantId, filters);
  }

  async updateCustomer(input: UpdateCustomerInput) {
    await this.getCustomer(input.tenantId, input.id);
    return customerRepository.update(input);
  }
}

export const customerService = new CustomerService();
