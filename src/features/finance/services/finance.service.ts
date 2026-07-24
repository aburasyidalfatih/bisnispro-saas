export interface CreateInvoiceDTO {
  tenantId: string;
  clientId: string;
  billingTypeId?: string;
  title: string;
  amount: number;
  dueDate: string | Date;
  month?: number;
  year?: number;
  notes?: string;
  installments?: { dueDate: string; amount: number }[];
}

export interface CreateBulkInvoiceDTO {
  tenantId: string;
  billingTypeId: string;
  title: string;
  dueDate: string | Date;
  month?: number;
  year?: number;
  notes?: string;
  userId: string;
}

export interface PayInvoiceDTO {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: "WALLET" | "TRANSFER" | "CASH" | "TRIPAY";
  proofUrl?: string;
  notes?: string;
  userId: string;
}

export interface VerifyPaymentDTO {
  tenantId: string;
  paymentId: string;
  action: "VERIFIED" | "REJECTED";
  notes?: string;
  userId: string;
}

export type FinanceResultDTO<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export class FinanceService {
  static async createInvoice(data: CreateInvoiceDTO): Promise<FinanceResultDTO> {
    return { success: false, error: "Not Implemented" }
  }

  static async createBulkInvoices(data: CreateBulkInvoiceDTO): Promise<FinanceResultDTO> {
    return { success: false, error: "Not Implemented" }
  }

  static async processPayment(data: PayInvoiceDTO): Promise<FinanceResultDTO> {
    return { success: false, error: "Not Implemented" }
  }

  static async verifyPayment(data: VerifyPaymentDTO): Promise<FinanceResultDTO> {
    return { success: false, error: "Not Implemented" }
  }
}

