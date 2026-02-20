// dashboard/src/services/agenService.ts
import api from "@/lib/axios";

// =====================================================
// INTERFACES
// =====================================================

export interface JamaahData {
  id: number;
  userId: number;
  packageId: number | null;
  agenId: number | null;
  status: "DRAFT" | "PENDING" | "VERIFIED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
  };
  package?: {
    id: number;
    title: string;
    departureDate: string;
  } | null;
}

export interface CreateJamaahRequest {
  fullName: string;
  email: string;
  phone: string;
  packageId?: number;
}

export interface JamaahListResponse {
  success: boolean;
  data: {
    jamaah: JamaahData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// =====================================================
// AGEN SERVICE
// =====================================================

export const agenService = {
  // ✅ FIX: Ambil data.packages (bukan data langsung)
  getPackages: async () => {
    const response = await api.get("/agen/packages", {
      params: {
        isActive: true,
      },
    });

    // ✅ DEBUG
    console.log("📦 PACKAGES RESPONSE:", response.data);

    // ✅ FIX: Response backend format { success, data: { packages, pagination } }
    return response.data; // Return full response
  },

  // Create Jamaah Account (Provisioning)
  createJamaah: async (data: CreateJamaahRequest) => {
    const response = await api.post("/agen/jamaah", data);
    return response.data;
  },

  // Get My Jamaah List
  getMyJamaah: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<JamaahListResponse>("/agen/jamaah", {
      params,
    });
    return response.data;
  },

  // Get Jamaah Detail
  getJamaahById: async (id: string | number) => {
    const response = await api.get(`/agen/jamaah/${id}`);
    return response.data;
  },

  // Check Document Completeness
  checkCompleteness: async (jamaahId: string | number) => {
    const response = await api.get(`/agen/jamaah/${jamaahId}/completeness`);
    return response.data;
  },

  // Get Dashboard Stats
  getDashboardStats: async () => {
    const response = await api.get("/agen/dashboard");
    return response.data;
  },

  // Get Commission
  getCommission: async () => {
    const response = await api.get("/agen/commission");
    return response.data;
  },

  getPackageDetail: async (id: string) => {
    const response = await api.get(`/agen/packages/${id}`);
    return response.data;
  },

  // Update Jamaah
  updateJamaah: async (id: string | number, data: any) => {
    const response = await api.put(`/agen/jamaah/${id}`, data);
    return response.data;
  },

  // Upload Document Jamaah
  uploadJamaahDocument: async (
    id: string | number,
    type: string,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("type", type);

    const response = await api.post(
      `/agen/jamaah/${id}/upload/${type}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  calendar: {
    getEventsByRange: async (startDate: string, endDate: string) => {
      const response = await api.get("/calendar/events", {
        params: { startDate, endDate },
      });
      return response.data;
    },

    getUpcoming: async (limit: number = 5) => {
      const response = await api.get("/calendar/upcoming", {
        params: { limit },
      });
      return response.data;
    },
  },
};



