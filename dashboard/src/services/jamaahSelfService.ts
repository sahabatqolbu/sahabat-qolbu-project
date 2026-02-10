// dashboard/src/services/jamaahSelfService.ts
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/utils"; // ✅ Import helper

// ===== TYPES =====
export interface JamaahProfile {
  id: number;
  bookingNumber: string;
  userId: number;

  // User info
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };

  // Biodata
  namaPaspor: string | null;
  nik: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  gender: "PRIA" | "WANITA" | null;
  maritalStatus: "BELUM_MENIKAH" | "MENIKAH" | "CERAI" | "DUDA_JANDA" | null;

  // Alamat
  address: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;

  // Paspor
  passportNumber: string | null;
  passportIssueDate: string | null;
  passportExpiry: string | null;
  passportIssuePlace: string | null;

  // Emergency
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;

  // Mahram
  mahramId: number | null;
  mahramRelation: string | null;
  mahram: {
    id: number;
    user: {
      fullName: string;
    };
  } | null;

  // Documents
  fotoUrl: string | null;
  ktpUrl: string | null;
  kkUrl: string | null;
  pasporUrl: string | null;
  bukuNikahUrl: string | null;
  aktaLahirUrl: string | null;
  ijazahUrl: string | null;
  vaksinUrl: string | null;
  meningitisUrl: string | null;

  // Package
  package: {
    id: number;
    name: string;
    departureDate: string;
    returnDate: string;
    hotelMakkah?: { name: string; rating: number };
    hotelMadinah?: { name: string; rating: number };
    airline?: { name: string; logo: string };
  } | null;

  // Agen
  agen: {
    id: number;
    fullName: string;
    phone: string;
  } | null;

  // Status
  registrationStatus:
    | "DRAFT"
    | "PENDING_DOCUMENT"
    | "PENDING_PAYMENT"
    | "VERIFIED"
    | "APPROVED"
    | "REJECTED";
  statusPayment: "BELUM_BAYAR" | "CICILAN" | "LUNAS";
  isProfileComplete: boolean;

  // Pricing
  hargaPaket: string;
  hargaFinal: string;
  totalPayment: string;
  outstanding: string;

  // Computed (dari backend)
  completeness: {
    biodata: boolean;
    requiredDocs: {
      foto: boolean;
      ktp: boolean;
      kk: boolean;
    };
    optionalDocs: {
      paspor: boolean;
      vaksin: boolean;
      meningitis: boolean;
      bukuNikah: boolean;
    };
    requiredDocsComplete: boolean;
    overallComplete: boolean;
  };
  deadlines: {
    h30: string | null;
    daysUntilH30: number | null;
    h45: string | null;
  };

  createdAt: string;
  updatedAt: string;
}

export interface BiodataUpdate {
  // Biodata
  namaPaspor?: string;
  nik?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: "PRIA" | "WANITA";
  maritalStatus?: "BELUM_MENIKAH" | "MENIKAH" | "CERAI" | "DUDA_JANDA";

  // Alamat
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  postalCode?: string;

  // Paspor
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiry?: string;
  passportIssuePlace?: string;

  // Emergency
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;

  // Mahram
  mahramId?: number | null;
  mahramRelation?: string;
}

export interface MahramSearchResult {
  id: number;
  bookingNumber: string;
  fullName: string;
  phone: string;
  gender: string | null;
}

export interface PaymentSummary {
  summary: {
    hargaFinal: string;
    totalPayment: string;
    outstanding: string;
    statusPayment: string;
  };
  payments: Array<{
    id: number;
    paymentNumber: number;
    amount: string;
    paymentDate: string;
    proofUrl: string | null;
    verifiedAt: string | null;
    bank: {
      name: string;
      accountNumber: string;
    } | null;
  }>;
}

// Helper functions
const emptyToNull = (value: any): any => {
  if (value === "" || value === undefined || value === "undefined") {
    return null;
  }
  return value;
};

const formatDateToYMD = (value: any): string | null => {
  if (!value || value === "" || value === "undefined") {
    return null;
  }
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
};

const formatProfileDates = (profile: any): any => {
  if (!profile) return profile;
  const dateFields = ["birthDate", "passportIssueDate", "passportExpiry"];
  const formatted = { ...profile };
  for (const field of dateFields) {
    if (formatted[field]) {
      formatted[field] = formatDateToYMD(formatted[field]);
    }
  }
  return formatted;
};

const sanitizeBiodataForAPI = (data: BiodataUpdate): BiodataUpdate => {
  const sanitized: any = {};
  const dateFields = ["birthDate", "passportIssueDate", "passportExpiry"];
  const intFields = ["mahramId"];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (dateFields.includes(key)) {
      sanitized[key] = formatDateToYMD(value);
    } else if (intFields.includes(key)) {
      sanitized[key] =
        value === "" || value === null
          ? null
          : parseInt(value as string, 10) || null;
    } else {
      sanitized[key] = emptyToNull(value);
    }
  }
  return sanitized;
};

export const jamaahSelfService = {
  // ✅ Get profile - hanya format dates, BUKAN document URLs
  getProfile: async (): Promise<{ success: boolean; data: JamaahProfile }> => {
    console.log("📡 jamaahSelfService.getProfile");
    const response = await api.get("/jamaah/profile");

    if (response.data.success && response.data.data) {
      response.data.data = formatProfileDates(response.data.data);
      // ❌ REMOVE: response.data.data = formatDocumentUrls(response.data.data);
    }

    return response.data;
  },

  updateBiodata: async (data: BiodataUpdate) => {
    const sanitizedData = sanitizeBiodataForAPI(data);
    console.log(
      "📡 jamaahSelfService.updateBiodata (sanitized)",
      sanitizedData,
    );
    const response = await api.put("/jamaah/biodata", sanitizedData);
    return response.data;
  },

  // ✅ Upload document - return raw URL dari backend
  uploadDocument: async (documentType: string, file: File) => {
    console.log("📡 jamaahSelfService.uploadDocument", documentType);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await api.post("/jamaah/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // ❌ REMOVE URL formatting di sini
    return response.data;
  },

  // ... sisanya tetap sama
  submit: async () => {
    console.log("📡 jamaahSelfService.submit");
    const response = await api.post("/jamaah/submit");
    return response.data;
  },

  searchMahram: async (query: string) => {
    console.log("📡 jamaahSelfService.searchMahram", query);
    const response = await api.get(
      `/jamaah/mahram/search?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  },

  getPayments: async () => {
    console.log("📡 jamaahSelfService.getPayments");
    const response = await api.get("/jamaah/payments");
    return response.data;
  },

  getPackage: async () => {
    console.log("📡 jamaahSelfService.getPackage");
    const response = await api.get("/jamaah/package");
    return response.data;
  },

  getAvailablePackages: async () => {
    const response = await api.get("/packages", {
      params: {
        isActive: true,
      },
    });
    return response.data;
  },

  getPackageDetail: async (id: number | string) => {
    const response = await api.get(`/packages/${id}`);
    return response.data;
  },

  requestPackageConsultation: async (packageId: number | string) => {
    const response = await api.post("/jamaah/package/request", { packageId });
    return response.data;
  },

  // ✅ PASTIKAN INI ADA
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
