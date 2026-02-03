// dashboard/src/services/masterService.ts
import api from "@/lib/axios";

export const masterService = {
  // ===== HOTELS =====
  hotels: {
    getAll: async (params?: { isActive?: boolean; city?: string }) => {
      const response = await api.get("/master/hotels", { params });
      return response.data;
    },
    getById: async (id: number) => {
      // ✅ TAMBAHKAN
      const response = await api.get(`/master/hotels/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post("/master/hotels", data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/master/hotels/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/master/hotels/${id}`);
      return response.data;
    },
  },

  // ===== AIRLINES =====
  airlines: {
    getAll: async (params?: { isActive?: boolean }) => {
      const response = await api.get("/master/airlines", { params });
      return response.data;
    },
    getById: async (id: number) => {
      // ✅ TAMBAHKAN
      const response = await api.get(`/master/airlines/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post("/master/airlines", data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/master/airlines/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/master/airlines/${id}`);
      return response.data;
    },
  },

  // ===== AIRPORTS =====
  airports: {
    getAll: async (params?: { isActive?: boolean }) => {
      const response = await api.get("/master/airports", { params });
      return response.data;
    },
    getById: async (id: number) => {
      // ✅ TAMBAHKAN
      const response = await api.get(`/master/airports/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post("/master/airports", data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/master/airports/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/master/airports/${id}`);
      return response.data;
    },
  },

  // ===== BANKS =====
  banks: {
    getAll: async () => {
      const response = await api.get("/master/banks");
      return response.data;
    },
    getActive: async () => {
      const response = await api.get("/master/banks/active");
      return response.data;
    },
    getById: async (id: number) => {
      // ✅ TAMBAHKAN
      const response = await api.get(`/master/banks/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post("/master/banks", data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/master/banks/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/master/banks/${id}`);
      return response.data;
    },
  },

  // ===== COMPANY PROFILE =====
  company: {
    get: async () => {
      const response = await api.get("/master/company");
      return response.data;
    },
    update: async (data: any) => {
      const response = await api.put("/master/company", data);
      return response.data;
    },
  },
};
