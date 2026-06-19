import api from "@/lib/axios";

export interface Package {
  id: number;
  code: string;
  name: string;
  type: "FULL_SERVICE" | "EXTREME" | "SEMI_MANDIRI" | "FLEKSIBILITAS" | "KONSORSIUM" | "LA";
  departureDate: string;
  returnDate: string;
  duration: number;
  price: number;
  discountPrice?: number;
  totalSeats: number;
  bookedSeats: number;
  remainingSeats: number;
  description?: string;
  facilities?: string;
  excludedFacilities?: string;
  notes?: string;
  isActive: boolean;
  isPublished: boolean;

  // Relations
  airlineId?: number;
  airline?: { name: string; code: string };
  airlineStatus?: string;
  airlinePaymentStatus?: string;

  hotelMakkahId?: number;
  hotelMakkah?: { name: string; starRating: number };
  hotelMakkahStatus?: string;

  hotelMadinahId?: number;
  hotelMadinah?: { name: string; starRating: number };
  hotelMadinahStatus?: string;

  images?: { id: number; imageUrl: string }[];

  // Computed
  daysUntilDeparture?: number;
}

export const packageService = {
  // ===== GET ALL PACKAGES =====
  getAll: async (params?: {
    search?: string;
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/admin/packages", { params }); // ✅ api
    return response.data;
  },

  // ===== GET SINGLE PACKAGE =====
  getById: async (id: number) => {
    const response = await api.get(`/admin/packages/${id}`); // ✅ api
    return response.data;
  },

  // ===== CREATE PACKAGE (with PDF & Images) =====
  create: async (data: {
    packageData: any;
    itineraryPdf?: File;
    images?: File[];
  }) => {
    const formData = new FormData();

    // ✅ Append package data as JSON string
    Object.entries(data.packageData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // ✅ Append PDF if exists
    if (data.itineraryPdf) {
      formData.append("itinerary_pdf", data.itineraryPdf);
    }

    const response = await api.post("/admin/packages", formData, {
      // ✅ api
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // ✅ Upload images separately (after package created)
    if (data.images && data.images.length > 0 && response.data.data?.id) {
      await packageService.uploadImages(response.data.data.id, data.images);
    }

    return response.data;
  },

  // ===== UPDATE PACKAGE =====
  update: async (id: number, data: any) => {
    // ✅ Langsung terima flat data
    const formData = new FormData();

    // ✅ KONVERSI DECIMAL KE STRING (MySQL requirement)
    const sanitizedData = {
      ...data,
      price: data.price?.toString() || "0",
      discountPrice: data.discountPrice ? data.discountPrice.toString() : null,
      airlineTermin1Amount: data.airlineTermin1Amount?.toString() || "0",
      airlineTermin2Amount: data.airlineTermin2Amount?.toString() || "0",
    };

    console.log("📤 SENDING UPDATE:", { id, data: sanitizedData });

    // ✅ APPEND SEMUA FIELD KE FORMDATA
    Object.entries(sanitizedData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, value.toString());
      }
    });

    const response = await api.put(`/admin/packages/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // ===== DELETE PACKAGE =====
  delete: async (id: number) => {
    const response = await api.delete(`/admin/packages/${id}`); // ✅ api
    return response.data;
  },

  // ===== UPLOAD ITINERARY PDF =====
  uploadItineraryPdf: async (packageId: number, file: File) => {
    const formData = new FormData();
    formData.append("itinerary_pdf", file);

    console.log(
      "📤 uploadItineraryPdf → packageId:",
      packageId,
      "file:",
      file.name
    );

    const response = await api.post(
      `/admin/packages/${packageId}/itinerary-pdf`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  // ===== DELETE ITINERARY PDF =====
  deleteItineraryPdf: async (packageId: number) => {
    const response = await api.delete(
      `/admin/packages/${packageId}/itinerary-pdf`
    );
    return response.data;
  },

  // ===== UPLOAD MULTIPLE IMAGES =====
  uploadImages: async (packageId: number, images: File[]) => {
    const formData = new FormData();

    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await api.post(
      // ✅ api
      `/admin/packages/${packageId}/images/bulk`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  // ===== UPLOAD SINGLE IMAGE (UNTUK EDIT PAGE) =====
  uploadImage: async (packageId: number, file: File) => {
    const formData = new FormData();
    formData.append("image", file); // harus 'image' (match upload.single("image"))

    console.log("📤 uploadImage → packageId:", packageId, "file:", file.name);

    const response = await api.post(
      `/admin/packages/${packageId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },



  // ===== DELETE IMAGE =====
  deleteImage: async (imageId: number) => {
    const response = await api.delete(`/admin/packages/images/${imageId}`); // ✅ api
    return response.data;
  },

  // ===== EXPORT EXCEL =====
  exportExcel: async () => {
    const response = await api.get("/admin/packages/export", {
      // ✅ api
      responseType: "blob",
    });

    // Download file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `packages-${new Date().toISOString()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // ===== IMPORT EXCEL =====
  importExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/admin/packages/import", formData, {
      // ✅ api
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
};

export interface CreatePackagePayload {
  packageData: any;
  itineraryPdf?: File;
  images?: File[];
}

export const create = async ({
  packageData,
  itineraryPdf,
  images,
}: CreatePackagePayload) => {
  const formData = new FormData();

  // ✅ CONVERT SEMUA NUMBER JADI STRING UNTUK DECIMAL
  const sanitizedData = {
    ...packageData,
    price: packageData.price.toString(),
    discountPrice: packageData.discountPrice?.toString() || null,
    airlineTermin1Amount: packageData.airlineTermin1Amount?.toString() || "0",
    airlineTermin2Amount: packageData.airlineTermin2Amount?.toString() || "0",
  };

  console.log("📤 SENDING DATA:", sanitizedData); // DEBUG

  formData.append("data", JSON.stringify(sanitizedData));

  if (itineraryPdf) {
    formData.append("itineraryPdf", itineraryPdf);
  }

  if (images && images.length > 0) {
    images.forEach((img) => {
      formData.append("images", img);
    });
  }

  const { data } = await api.post("/admin/packages", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
};
