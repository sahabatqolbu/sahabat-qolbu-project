import api from "@/lib/axios";

export type ScheduleStatus = "CHECK_SEAT" | "SOLD_OUT" | "CLOSED";

export interface PackageScheduleItem {
  id?: number;
  departureDate: string;
  duration: number | null;
  airlineId: number | null;
  arrivalAirportId: number | null;
  returnAirportId: number | null;
  hotelMakkahLabel: string;
  hotelMadinahLabel: string;
  hotelMakkahId: number | null;
  hotelMadinahId: number | null;
  priceQuad: number | string;
  priceTriple: number | string;
  priceDouble: number | string;
  note?: string | null;
  status: ScheduleStatus;
  sortOrder?: number;
  airline?: { id: number; name: string; code: string } | null;
  route?: string;
  effectiveStatus?: ScheduleStatus;
}

export interface PackageScheduleList {
  id?: number;
  name: string;
  month: string;
  subtitle?: string | null;
  note?: string | null;
  isActive: boolean;
  isPublished: boolean;
  items: PackageScheduleItem[];
}

export const packageScheduleService = {
  getAll: async () => (await api.get("/admin/package-schedule-lists")).data,
  getById: async (id: number) => (await api.get(`/admin/package-schedule-lists/${id}`)).data,
  create: async (data: PackageScheduleList) => (await api.post("/admin/package-schedule-lists", data)).data,
  update: async (id: number, data: PackageScheduleList) => (await api.put(`/admin/package-schedule-lists/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/admin/package-schedule-lists/${id}`)).data,
};
