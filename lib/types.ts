export interface LineItem {
  name: string;
  description?: string;
  quantity: number | string;
  unit?: string;
  rate: number;
  amount?: number;
}

export interface ExtraCharge {
  label: string;
  amount: number;
}

export interface PaymentSchedule {
  percent: number;
  label: string;
}

export interface BankingDetails {
  accountHolder: string;
  bank: string;
  accountNo: string;
  ifsc: string;
}

export interface CompanyInfo {
  name: string;
  tagline?: string;
  legalName?: string;
  city?: string;
  website?: string;
}

export interface PreparedBy {
  name: string;
  title?: string;
  phone?: string;
  email?: string;
}

export interface QuotationInput {
  company: CompanyInfo;
  reference: string;
  documentTitle?: string;
  clientName: string;
  clientSubtitle?: string;
  date: string;
  validUntil?: string;
  validityLabel?: string;
  preparedByLabel?: string;
  projectType?: string;
  projectTitle: string;
  projectSubtitle?: string;
  zones?: number;
  items: LineItem[];
  extraCharges?: ExtraCharge[];
  gstPercent?: number;
  paymentTerms?: string;
  paymentSchedule?: PaymentSchedule[];
  deliveryTimeline?: string;
  whatsIncluded?: string[];
  maintenanceSupport?: {
    description: string;
    cost: string;
  };
  banking?: BankingDetails;
  termsAndConditions?: string[];
  preparedBy?: PreparedBy;
}
