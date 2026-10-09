import api from "@/lib/axios";

export type FinancialDocumentType = "INVOICE" | "RECEIPT";
export type FinancialSourceType = "MANUAL" | "BOOKING" | "PAYMENT" | "TRANSACTION" | "AGENT" | "AGENT_PAYMENT";
export interface FinancialLine { description: string; qty: number; unitPrice: number; amount?: number }
export interface FinancialPayload {
  type: FinancialDocumentType;
  sourceType: FinancialSourceType;
  sourceId?: string;
  bankId?: number | null;
  customerName?: string;
  customerPhone?: string;
  memberCount?: number;
  programName?: string;
  departureDate?: string;
  roomType?: string;
  items?: FinancialLine[];
  previousPaid?: number;
  currentPayment?: number;
  paymentMethod?: string;
  paidBy?: string;
  targetStar?: number;
  confirmedReceived?: boolean;
}
export interface FinancialPreview extends FinancialPayload {
  number: string;
  customerName: string;
  programName: string;
  totalAmount: number;
  previousPaid: number;
  currentPayment: number;
  remaining: number;
  items: FinancialLine[];
}
export interface FinancialDocument {
  id: number;
  type: FinancialDocumentType;
  number: string;
  status: "ISSUED" | "VOID";
  sourceType: string;
  sourceId: string | null;
  customerName: string;
  totalAmount: string;
  issuedAt: string;
  voidReason: string | null;
}
export interface BankOption { id: number; bankName: string; accountNumber: string; accountName: string }

export const financialDocumentService = {
  list: async (params: { type?: string; search?: string } = {}) =>
    (await api.get<{ data: FinancialDocument[] }>("/financial-documents", { params })).data.data,
  banks: async () => (await api.get<{ data: BankOption[] }>("/financial-documents/banks")).data.data,
  settings: async () => (await api.get<{ data: { signerName: string; hasSignature: boolean; hasStamp: boolean } }>("/financial-documents/settings")).data.data,
  saveSigner: async (signerName: string) => (await api.put("/financial-documents/settings/signer", { signerName })).data,
  uploadMark: async (kind: "signature" | "stamp", file: File) => {
    const data = new FormData();
    data.append("file", file);
    return (await api.post(`/financial-documents/settings/${kind}`, data)).data;
  },
  prepare: async (payload: FinancialPayload) =>
    (await api.post<{ data: FinancialPreview }>("/financial-documents/prepare", payload)).data.data,
  issue: async (payload: FinancialPayload) =>
    (await api.post<{ data: { id: number; number: string } }>("/financial-documents", payload)).data.data,
  void: async (id: number, reason: string) => (await api.post(`/financial-documents/${id}/void`, { reason })).data,
  previewPdf: async (payload: FinancialPayload) =>
    (await api.post("/financial-documents/preview", payload, { responseType: "blob" })).data as Blob,
  pdf: async (id: number) =>
    (await api.get(`/financial-documents/${id}/pdf`, { responseType: "blob" })).data as Blob,
};
