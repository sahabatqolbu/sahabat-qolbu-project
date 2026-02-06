// dashboard/src/services/staffService.ts
import api from "@/lib/axios";

export interface Staff {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  recentLogins: number;
}

export interface CreateStaffData {
  email: string;
  fullName: string;
  phone?: string;
}

export interface UpdateStaffData {
  fullName?: string;
  phone?: string;
  isActive?: boolean;
}

export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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

export const staffService = {
  // Get all staff with pagination
  getAllStaff: async (params: StaffListParams = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const response = await api.get<PaginatedResponse<Staff>>(
      `/admin/staff?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get staff statistics
  getStaffStats: async () => {
    const response = await api.get<{ success: boolean; data: StaffStats }>(
      "/admin/staff/stats"
    );
    return response.data;
  },

  // Get staff by ID
  getStaffById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Staff }>(
      `/admin/staff/${id}`
    );
    return response.data;
  },

  // Create new staff
  createStaff: async (data: CreateStaffData) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: Staff;
    }>("/admin/staff", data);
    return response.data;
  },

  // Update staff
  updateStaff: async (id: number, data: UpdateStaffData) => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: Staff;
    }>(`/admin/staff/${id}`, data);
    return response.data;
  },

  // Toggle staff status
  toggleStaffStatus: async (id: number) => {
    const response = await api.patch<{
      success: boolean;
      message: string;
      data: { id: number; isActive: boolean };
    }>(`/admin/staff/${id}/toggle`);
    return response.data;
  },

  // Delete staff
  deleteStaff: async (id: number) => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/admin/staff/${id}`
    );
    return response.data;
  },

  // Reset staff password
  resetStaffPassword: async (id: number) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: null;
    }>(`/admin/staff/${id}/reset-password`);
    return response.data;
  },
};
