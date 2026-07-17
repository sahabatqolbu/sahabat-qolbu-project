import api from "@/lib/axios";

export type AssetType = "DEVICE" | "ACCOUNT";
export type AssetStatus = "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED" | "LOST";
export type AssignmentStatus = "ACTIVE" | "RETURNED";

export interface AssetHolder {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "STAFF" | "FINANCE";
}

export interface AssetSummary {
  id: number;
  assetCode: string;
  name: string;
  type: AssetType;
  category?: string;
}

export interface AssetAssignment {
  id: number;
  assetId: number;
  holderUserId: number;
  status: AssignmentStatus;
  assignedAt: string;
  initialCondition: string;
  purpose: string;
  notes: string | null;
  expectedReturnAt: string | null;
  returnedAt: string | null;
  returnCondition: string | null;
  returnNotes: string | null;
  holder?: AssetHolder;
  asset?: AssetSummary;
}

export interface AssetDocument {
  id: number;
  assetId: number;
  assignmentId: number;
  type: "HANDOVER" | "RETURN";
  documentNumber: string;
  fileName: string;
  mimeType: string;
  signedFileUrl?: string | null;
  signedFileName?: string | null;
  signedMimeType?: string | null;
  signedUploadedAt?: string | null;
  createdAt: string;
  asset?: AssetSummary;
  holder?: Pick<AssetHolder, "id" | "fullName" | "role">;
}

export interface Asset {
  id: number;
  assetCode: string;
  name: string;
  type: AssetType;
  category: string;
  status: AssetStatus;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  identifier: string | null;
  location: string | null;
  condition: string | null;
  notes: string | null;
  platform: string | null;
  accountUsername: string | null;
  recoveryContact: string | null;
  accountPic: string | null;
  accountNotes: string | null;
  activeAssignment: AssetAssignment | null;
  assignments?: AssetAssignment[];
  documents?: AssetDocument[];
}

export interface AssetRecordListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

export interface AssetListParams extends AssetRecordListParams {
  search?: string;
}

export interface AssetPayload {
  assetCode?: string;
  name: string;
  type: AssetType;
  category: string;
  status?: AssetStatus;
  brand?: string;
  model?: string;
  serialNumber?: string;
  identifier?: string;
  location?: string;
  condition?: string;
  notes?: string;
  platform?: string;
  accountUsername?: string;
  recoveryContact?: string;
  accountPic?: string;
  accountNotes?: string;
}

export interface AssignAssetPayload {
  holderUserId: number;
  assignedAt: string;
  initialCondition: string;
  purpose: string;
  notes?: string;
  expectedReturnAt?: string;
}

export interface ReturnAssetPayload {
  returnedAt: string;
  returnCondition: string;
  returnNotes?: string;
  nextStatus: Exclude<AssetStatus, "ASSIGNED">;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const buildQuery = (params: AssetRecordListParams | AssetListParams) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.append(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
};

export const assetService = {
  getAssets: async (params: AssetListParams = {}) => {
    const response = await api.get<PaginatedResponse<Asset>>(`/assets${buildQuery(params)}`);
    return response.data;
  },

  getAsset: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Asset }>(`/assets/${id}`);
    return response.data;
  },

  getHolders: async () => {
    const response = await api.get<{ success: boolean; data: AssetHolder[] }>("/assets/holders");
    return response.data;
  },

  getAssignments: async (params: AssetRecordListParams = {}) => {
    const response = await api.get<PaginatedResponse<AssetAssignment>>(`/assets/assignments${buildQuery(params)}`);
    return response.data;
  },

  getDocuments: async (params: AssetRecordListParams = {}) => {
    const response = await api.get<PaginatedResponse<AssetDocument>>(`/assets/documents${buildQuery(params)}`);
    return response.data;
  },

  createAsset: async (payload: AssetPayload) => {
    const response = await api.post<{ success: boolean; data: Asset; message: string }>("/assets", payload);
    return response.data;
  },

  updateAsset: async (id: number, payload: AssetPayload) => {
    const response = await api.put<{ success: boolean; data: Asset; message: string }>(`/assets/${id}`, payload);
    return response.data;
  },

  deleteAsset: async (id: number) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/assets/${id}`);
    return response.data;
  },

  assignAsset: async (id: number, payload: AssignAssetPayload) => {
    const response = await api.post<{ success: boolean; data: unknown; message: string }>(`/assets/${id}/assign`, payload);
    return response.data;
  },

  returnAsset: async (id: number, payload: ReturnAssetPayload) => {
    const response = await api.post<{ success: boolean; data: unknown; message: string }>(`/assets/${id}/return`, payload);
    return response.data;
  },

  uploadSignedDocument: async (assetId: number, documentId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ success: boolean; data: AssetDocument; message: string }>(
      `/assets/${assetId}/documents/${documentId}/signed`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  downloadDocument: async (assetId: number, documentId: number, fileName: string) => {
    const response = await api.get(`/assets/${assetId}/documents/${documentId}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  },

  downloadSignedDocument: async (assetId: number, documentId: number, fileName: string) => {
    const response = await api.get(`/assets/${assetId}/documents/${documentId}/signed/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  },
};