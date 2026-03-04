export type InvoiceStatus = 'Unpaid' | 'Paid';

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  dueDate: string; // yyyy-mm-dd
  status: InvoiceStatus;
  issuedAt: number;
  paidAt?: number;
  notes?: string;
  items?: InvoiceItem[];
  taxIds?: string[];
  subtotal?: number;
  taxTotal?: number;
  createdAt?: number;
  updatedAt?: number;
};

export type InvoiceCreateInput = {
  customerId: string;
  amount: number;
  currency: string;
  dueDate: string;
  notes?: string;
  items?: InvoiceItem[];
  taxIds?: string[];
  subtotal?: number;
  taxTotal?: number;
};

export type InvoicePatchInput = Partial<Omit<Invoice, 'id' | 'issuedAt'>>;

