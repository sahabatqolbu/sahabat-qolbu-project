// dashboard/src/services/adminService.ts
import api from "@/lib/axios";

export const adminService = {
  dashboard: {
    getStats: async () => {
      const response = await api.get("/admin/dashboard/stats");
      return response.data;
    },
  },

  // ✅ TAMBAH getUsers function langsung (untuk backward compatibility)
  getUsers: async (params?: {
    search?: string;
    role?: string;
    limit?: number;
  }) => {
    const response = await api.get("/admin/users", { params });
    return {
      data: {
        users: response.data.data || response.data,
      },
    };
  },

  // ===== USER MANAGEMENT =====
  users: {
    getAll: async (params?: {
      search?: string;
      role?: string;
      isActive?: boolean;
    }) => {
      const response = await api.get("/admin/users", { params });
      return response.data;
    },

    getUserById: async (id: number) => {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    },

    // ✅ FIX: Hapus password, tambah packageId
    createUser: async (data: {
      fullName: string;
      email: string;
      phone: string;
      role: "ADMIN" | "FINANCE" | "STAFF" | "AGEN" | "JAMAAH"; // ✅ TAMBAH STAFF
      packageId?: number | null; // ✅ TAMBAH INI (optional untuk JAMAAH)
    }) => {
      console.log("🚀 adminService.createUser called with:", data); // ✅ DEBUG
      const response = await api.post("/admin/users", data);
      console.log("✅ Response:", response.data); // ✅ DEBUG
      return response.data;
    },

    updateUser: async (
      id: number,
      data: {
        fullName?: string;
        phone?: string;
        role?: "ADMIN" | "FINANCE" | "STAFF" | "AGEN" | "JAMAAH"; // ✅ TAMBAH STAFF
        isActive?: boolean;
      },
    ) => {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },

    toggleStatus: async (id: number) => {
      const response = await api.patch(`/admin/users/${id}/toggle`);
      return response.data;
    },

    deleteUser: async (id: number) => {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    },
  },

  // =====================================================
  // KELOLA AGEN
  // =====================================================
  agen: {
    getAll: async (params?: {
      star?: number;
      status?: string;
      obtainedBy?: string;
      search?: string;
    }) => {
      const response = await api.get("/admin/agen", { params });
      return response.data;
    },

    getById: async (id: number) => {
      const response = await api.get(`/admin/agen/${id}`);
      return response.data;
    },

    update: async (
      id: number,
      data: {
        fullName?: string;
        phone?: string;
        isActive?: boolean;
        fullNameKtp?: string;
        nickname?: string;
        birthPlace?: string;
        birthDate?: string;
        nik?: string;
        address?: string;
        province?: string;
        city?: string;
        postalCode?: string;
        instagram?: string;
        tiktok?: string;
        currentStar?: number;
        accountName?: string;
        accountNumber?: string;
        bankName?: string;
        status?: string;
        isComplete?: boolean;
      },
    ) => {
      const response = await api.put(`/admin/agen/${id}`, data);
      return response.data;
    },

    approve: async (id: number) => {
      const response = await api.post(`/admin/agen/${id}/approve`);
      return response.data;
    },

    reject: async (id: number, rejectionNote: string) => {
      const response = await api.post(`/admin/agen/${id}/reject`, {
        rejectionNote,
      });
      return response.data;
    },

    delete: async (id: number) => {
      const response = await api.delete(`/admin/agen/${id}`);
      return response.data;
    },
  },

  // =====================================================
  // MASTER DATA: AGENT LEVELS
  // =====================================================
  agentLevels: {
    getAll: async () => {
      const response = await api.get("/admin/master/agent-levels");
      return response.data;
    },

    getById: async (id: number) => {
      const response = await api.get(`/admin/master/agent-levels/${id}`);
      return response.data;
    },

    create: async (data: {
      name: string;
      slug: string;
      star: number;
      price: string;
      minClosing?: number;
      maxPeriod?: number;
      maintainClosing?: number;
      maintainPeriod?: number;
      downgradeClosing?: number;
      description?: string;
      order?: number;
      benefits?: Array<{
        title: string;
        description?: string;
        order?: number;
      }>;
    }) => {
      const response = await api.post("/admin/master/agent-levels", data);
      return response.data;
    },

    update: async (
      id: number,
      data: {
        name?: string;
        slug?: string;
        star?: number;
        price?: string;
        minClosing?: number;
        maxPeriod?: number;
        maintainClosing?: number;
        maintainPeriod?: number;
        downgradeClosing?: number;
        description?: string;
        isActive?: boolean;
        order?: number;
        benefits?: Array<{
          title: string;
          description?: string;
          order?: number;
        }>;
      },
    ) => {
      const response = await api.put(`/admin/master/agent-levels/${id}`, data);
      return response.data;
    },

    delete: async (id: number) => {
      const response = await api.delete(`/admin/master/agent-levels/${id}`);
      return response.data;
    },
  },

  // =====================================================
  // MASTER DATA: AGENT REQUIREMENTS
  // =====================================================
  agentRequirements: {
    getAll: async (params?: { isActive?: boolean }) => {
      const response = await api.get("/admin/master/agent-requirements", {
        params,
      });
      return response.data;
    },

    create: async (data: { title: string; order?: number }) => {
      const response = await api.post("/admin/master/agent-requirements", data);
      return response.data;
    },

    update: async (
      id: number,
      data: { title?: string; order?: number; isActive?: boolean },
    ) => {
      const response = await api.put(
        `/admin/master/agent-requirements/${id}`,
        data,
      );
      return response.data;
    },

    delete: async (id: number) => {
      const response = await api.delete(
        `/admin/master/agent-requirements/${id}`,
      );
      return response.data;
    },
  },

  // =====================================================
  // MASTER DATA: AGENT PURPOSES
  // =====================================================
  agentPurposes: {
    getAll: async (params?: { isActive?: boolean }) => {
      const response = await api.get("/admin/master/agent-purposes", {
        params,
      });
      return response.data;
    },

    create: async (data: { title: string; slug: string; order?: number }) => {
      const response = await api.post("/admin/master/agent-purposes", data);
      return response.data;
    },

    update: async (
      id: number,
      data: {
        title?: string;
        slug?: string;
        order?: number;
        isActive?: boolean;
      },
    ) => {
      const response = await api.put(
        `/admin/master/agent-purposes/${id}`,
        data,
      );
      return response.data;
    },

    delete: async (id: number) => {
      const response = await api.delete(`/admin/master/agent-purposes/${id}`);
      return response.data;
    },
  },

  // =====================================================
  // MASTER DATA: PERIODS
  // =====================================================
  periods: {
    getAll: async (params?: { isActive?: boolean }) => {
      const response = await api.get("/admin/master/periods", { params });
      return response.data;
    },

    getById: async (id: number) => {
      const response = await api.get(`/admin/master/periods/${id}`);
      return response.data;
    },

    create: async (data: {
      name: string;
      startDate: string;
      endDate: string;
      duration?: number;
    }) => {
      const response = await api.post("/admin/master/periods", data);
      return response.data;
    },

    update: async (
      id: number,
      data: {
        name?: string;
        startDate?: string;
        endDate?: string;
        duration?: number;
        isActive?: boolean;
      },
    ) => {
      const response = await api.put(`/admin/master/periods/${id}`, data);
      return response.data;
    },

    delete: async (id: number) => {
      const response = await api.delete(`/admin/master/periods/${id}`);
      return response.data;
    },
  },

  // =====================================================
  // AGEN: Self Profile & Update
  // =====================================================
  agenProfile: {
    getMyProfile: async () => {
      const response = await api.get("/agen/profile");
      return response.data;
    },

    updateMyProfile: async (data: {
      fullNameKtp?: string;
      nickname?: string;
      birthPlace?: string;
      birthDate?: string;
      nik?: string;
      address?: string;
      province?: string;
      city?: string;
      postalCode?: string;
      instagram?: string;
      facebook?: string; // ✅ TAMBAH INI
      tiktok?: string;
      accountName?: string;
      accountNumber?: string;
      bankName?: string;
      purposes?: number[];
      customPurpose?: string;
      agreedRequirements?: number[];
    }) => {
      const response = await api.put("/agen/profile", data);
      return response.data;
    },

    submitForApproval: async () => {
      const response = await api.post("/agen/profile/submit");
      return response.data;
    },

    uploadKtp: async (file: File) => {
      const formData = new FormData();
      formData.append("ktp", file); // ✅ HARUS "ktp" (sesuai backend)

      const response = await api.post("/agen/profile/upload-ktp", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },

    uploadPaymentProof: async (file: File) => {
      const formData = new FormData();
      formData.append("proof", file);
      const response = await api.post(
        "/agen/profile/upload-payment-proof",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data;
    },
  },

  // =====================================================
  // NOTIFICATIONS
  // =====================================================
  notifications: {
    getAll: async (params?: { limit?: number; unreadOnly?: boolean }) => {
      const response = await api.get("/notifications", { params });
      return response.data;
    },

    getUnreadCount: async () => {
      const response = await api.get("/notifications/unread-count");
      return response.data;
    },

    markAsRead: async (id: number) => {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    },

    markAllAsRead: async () => {
      const response = await api.patch("/notifications/read-all");
      return response.data;
    },

    delete: async (id: number) => {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    },

    clearRead: async () => {
      const response = await api.delete("/notifications/clear-read");
      return response.data;
    },

    // ✅ TAMBAH INI
    getJamaahNeedingReminder: async (type?: "document" | "payment") => {
      const response = await api.get("/admin/jamaah/need-reminder", {
        params: { type },
      });
      return response.data;
    },

    sendReminder: async (data: {
      jamaahId: number;
      type: "REMINDER_DOCUMENT" | "REMINDER_PAYMENT" | "REMINDER_GENERAL";
      title: string;
      message: string;
    }) => {
      const response = await api.post(
        "/admin/notifications/send-reminder",
        data,
      );
      return response.data;
    },

    sendBulkReminder: async (data: {
      jamaahIds: number[];
      type: "REMINDER_DOCUMENT" | "REMINDER_PAYMENT" | "REMINDER_GENERAL";
      title: string;
      message: string;
    }) => {
      const response = await api.post(
        "/admin/notifications/send-bulk-reminder",
        data,
      );
      return response.data;
    },
  },

  // =====================================================
  // REMINDERS
  // =====================================================
  reminders: {
    getJamaahList: async (filter?: string) => {
      const response = await api.get("/admin/reminders/jamaah", {
        params: { filter },
      });
      return response.data;
    },

    getAgenList: async (filter?: string) => {
      const response = await api.get("/admin/reminders/agen", {
        params: { filter },
      });
      return response.data;
    },

    send: async (data: {
      userId: number;
      type:
        | "REMINDER_DOCUMENT"
        | "REMINDER_PAYMENT"
        | "REMINDER_PROFILE"
        | "REMINDER_GENERAL";
      title: string;
      message: string;
    }) => {
      const response = await api.post("/admin/reminders/send", data);
      return response.data;
    },

    sendBulk: async (data: {
      userIds: number[];
      type:
        | "REMINDER_DOCUMENT"
        | "REMINDER_PAYMENT"
        | "REMINDER_PROFILE"
        | "REMINDER_GENERAL";
      title: string;
      message: string;
    }) => {
      const response = await api.post("/admin/reminders/send-bulk", data);
      return response.data;
    },
  },

  // =====================================================
  // AGEN NOTIFICATIONS & REMINDERS
  // =====================================================
  agenNotifications: {
    getAll: async (params?: { limit?: number; unreadOnly?: boolean }) => {
      const response = await api.get("/agen/notifications", { params });
      return response.data;
    },

    getUnreadCount: async () => {
      const response = await api.get("/agen/notifications/unread-count");
      return response.data;
    },

    markAsRead: async (id: number) => {
      const response = await api.patch(`/agen/notifications/${id}/read`);
      return response.data;
    },

    markAllAsRead: async () => {
      const response = await api.patch("/agen/notifications/read-all");
      return response.data;
    },

    getJamaahReminders: async (filter?: string) => {
      const response = await api.get("/agen/reminders/jamaah", {
        params: { filter },
      });
      return response.data;
    },

    sendReminder: async (data: {
      jamaahUserId: number;
      type: string;
      title: string;
      message: string;
    }) => {
      const response = await api.post("/agen/reminders/send", data);
      return response.data;
    },
  },

  // =====================================================
  // CALENDAR
  // =====================================================
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

    getByPackage: async (packageId: number) => {
      const response = await api.get(`/calendar/package/${packageId}`);
      return response.data;
    },

    create: async (data: any) => {
      const response = await api.post("/calendar/events", data);
      return response.data;
    },

    update: async (id: number, data: any) => {
      const response = await api.put(`/calendar/events/${id}`, data);
      return response.data;
    },

    delete: async (id: number) => {
      const response = await api.delete(`/calendar/events/${id}`);
      return response.data;
    },

    syncAllPackages: async () => {
      const response = await api.post("/calendar/sync-packages");
      return response.data;
    },
  },
};
