// dashboard/src/services/jamaahService.ts
import api from "@/lib/axios";

export interface JamaahFilters {
  search?: string;
  statusPayment?: string;
  registrationStatus?: string;
  packageId?: number;
}

export interface JamaahListItem {
  id: number;
  bookingNumber: string;
  dateOfBooking: string;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  namaPaspor: string | null;
  nik: string | null;
  gender: string | null;
  packageId: number | null;
  packageName: string;
  packageType: string;
  departureDate: string | null;
  namaMitra: string | null;
  agenName: string | null;
  notePaket: string;
  roomTypeMakkah: string | null;
  roomTypeMadinah: string | null;
  hargaPaket: string;
  hargaFinal: string;
  totalPayment: string;
  outstanding: string;
  statusPayment: string;
  registrationStatus: string;
  isProfileComplete: boolean;
  hasDocuments: {
    foto: boolean;
    ktp: boolean;
    kk: boolean;
    paspor: boolean;
    bukuNikah: boolean;
    aktaLahir: boolean;
  };
  createdAt: string;
}

export interface JamaahDetail {
  id: number;
  bookingNumber: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };
  package: {
    id: number;
    name: string;
    departureDate: string;
    returnDate: string;
    hotelMakkah?: { name: string; rating: number };
    hotelMadinah?: { name: string; rating: number };
    airline?: { name: string; logo: string };
  } | null;
  // ... all other fields
}

export interface DataLinkStatus {
  active: boolean;
  createdAt?: string;
  expiresAt?: string;
  lastUsedAt?: string | null;
  useCount?: number;
}

export interface CreatedDataLink {
  url: string;
  expiresAt: string;
  message: string;
  whatsappUrl: string | null;
  phone: string | null;
}

export interface DataCollectionRow {
  userId: number;
  name: string;
  phone: string | null;
  bookingNumber: string;
  progress: number;
  complete: boolean;
  submitted: boolean;
  members: { bookingNumber: string; name: string; isPrimary: boolean; registrationStatus: string; progress: number }[];
  link: { sentAt: string; active: boolean; expiresAt: string; lastUsedAt: string | null; useCount: number } | null;
}

export const jamaahService = {
  getDataCollection: async () =>
    (await api.get<{ data: DataCollectionRow[] }>("/jamaah/admin/data-collection")).data.data,
  getDataLink: async (bookingNumber: string) =>
    (await api.get<{ data: DataLinkStatus }>(`/jamaah/admin/${encodeURIComponent(bookingNumber)}/data-link`)).data.data,
  createDataLink: async (bookingNumber: string) =>
    (await api.post<{ data: CreatedDataLink }>(`/jamaah/admin/${encodeURIComponent(bookingNumber)}/data-link`)).data.data,
  revokeDataLink: async (bookingNumber: string) =>
    (await api.delete(`/jamaah/admin/${encodeURIComponent(bookingNumber)}/data-link`)).data,

  // ENDPOINT: /jamaah/admin
  getAll: async (filters?: JamaahFilters) => {
    console.log("jamaahService.getAll - Filters:", filters);

    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.statusPayment && filters.statusPayment !== "all") {
      params.append("statusPayment", filters.statusPayment);
    }
    if (filters?.registrationStatus && filters.registrationStatus !== "all") {
      params.append("registrationStatus", filters.registrationStatus);
    }
    if (filters?.packageId) {
      params.append("packageId", filters.packageId.toString());
    }

    const url = `/jamaah/admin${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    console.log("Request URL:", url);

    const response = await api.get(url);
    console.log("jamaahService.getAll - Response:", response.data);
    return response.data;
  },

  // Get jamaah by booking number
  getByBookingNumber: async (bookingNumber: string) => {
    console.log("jamaahService.getByBookingNumber:", bookingNumber);
    const response = await api.get(`/jamaah/admin/${bookingNumber}`);
    return response.data;
  },

  // Create jamaah
  create: async (data: any) => {
    const response = await api.post("/jamaah/admin", data);
    return response.data;
  },

  // Update jamaah
  update: async (bookingNumber: string, data: any) => {
    console.log("jamaahService.update:", bookingNumber, data);
    const response = await api.put(`/jamaah/admin/${bookingNumber}`, data);
    return response.data;
  },

  // Delete jamaah
  delete: async (bookingNumber: string) => {
    const response = await api.delete(`/jamaah/admin/${bookingNumber}`);
    return response.data;
  },

  // ===== PAYMENTS =====
  getPayments: async (bookingNumber: string) => {
    const response = await api.get(`/jamaah/admin/${bookingNumber}/payments`);
    return response.data;
  },

  addPayment: async (bookingNumber: string, data: any) => {
    const response = await api.post(
      `/jamaah/admin/${bookingNumber}/payments`,
      data,
    );
    return response.data;
  },

  verifyPayment: async (paymentId: number) => {
    const response = await api.patch(
      `/jamaah/admin/payments/${paymentId}/verify`,
    );
    return response.data;
  },

  uploadPaymentProof: async (paymentId: number, file: File) => {
    const formData = new FormData();
    formData.append("proof", file);
    const response = await api.post(
      `/jamaah/admin/payments/${paymentId}/proof`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  rejectPayment: async (paymentId: number, reason: string) => {
    const response = await api.patch(
      `/jamaah/admin/payments/${paymentId}/reject`,
      { reason },
    );
    return response.data;
  },

  // ===== DOCUMENT UPLOAD =====
  uploadDocument: async (
    bookingNumber: string,
    documentType: string,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await api.post(
      `/jamaah/admin/${bookingNumber}/documents`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  // Approve jamaah
  approve: async (bookingNumber: string) => {
    console.log("jamaahService.approve", bookingNumber);
    const response = await api.post(`/jamaah/${bookingNumber}/approve`);
    return response.data;
  },

  // Reject jamaah
  reject: async (bookingNumber: string, reason: string) => {
    console.log("jamaahService.reject", bookingNumber);
    const response = await api.post(`/jamaah/${bookingNumber}/reject`, {
      reason,
    });
    return response.data;
  },

  // Revert to verified
  revert: async (bookingNumber: string) => {
    console.log("jamaahService.revert", bookingNumber);
    const response = await api.post(`/jamaah/${bookingNumber}/revert`);
    return response.data;
  },

  // TAMBAHKAN INI
  getCalendarEvents: async (startDate: string, endDate: string) => {
    const response = await api.get("/calendar/events", {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getUpcomingEvents: async (limit: number = 5) => {
    const response = await api.get("/calendar/upcoming", {
      params: { limit },
    });
    return response.data;
  },
};
