// dashboard/src/components/calendar/EventFormDialog.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { packageService } from "@/services/packageService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: any;
  defaultDate?: Date;
}

const EVENT_TYPES = [
  { value: "DEADLINE", label: "⏰ Deadline" },
  { value: "MANASIK", label: "🤲 Manasik" },
  { value: "MEETING", label: "👥 Meeting" },
  { value: "EVENT", label: "🎉 Event" },
  { value: "ANNOUNCEMENT", label: "📢 Pengumuman" },
  { value: "OTHER", label: "📅 Lainnya" },
];

const VISIBILITY_OPTIONS = [
  { value: "ALL", label: "Semua (Admin, Agen, Jamaah)" },
  { value: "ADMIN_AGEN", label: "Admin & Agen saja" },
  { value: "ADMIN_ONLY", label: "Admin saja" },
  { value: "PACKAGE_MEMBERS", label: "Member Paket terkait" },
];

const COLOR_OPTIONS = [
  { value: "blue", label: "🔵 Biru" },
  { value: "green", label: "🟢 Hijau" },
  { value: "red", label: "🔴 Merah" },
  { value: "yellow", label: "🟡 Kuning" },
  { value: "purple", label: "🟣 Ungu" },
  { value: "orange", label: "🟠 Oranye" },
  { value: "pink", label: "🩷 Pink" },
];

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
}: EventFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!event;

  // Fetch packages for dropdown
  const { data: packagesData } = useQuery({
    queryKey: ["packages-dropdown"],
    queryFn: () => packageService.getAll({ limit: 100 }),
    enabled: open,
  });

  const packages = packagesData?.data?.packages || [];

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      location: "",
      type: "EVENT",
      startDate: defaultDate ? format(defaultDate, "yyyy-MM-dd") : "",
      endDate: "",
      startTime: "",
      endTime: "",
      isAllDay: true,
      packageId: "none", // ✅ Default "none" bukan ""
      visibility: "ALL",
      color: "blue",
      icon: "📅",
      reminderDays: "",
    },
  });

  // Reset form when event changes
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title || "",
        description: event.description || "",
        location: event.location || "",
        type: event.type || "EVENT",
        startDate: event.startDate || "",
        endDate: event.endDate || "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        isAllDay: event.isAllDay ?? true,
        packageId: event.packageId?.toString() || "",
        visibility: event.visibility || "ALL",
        color: event.color || "blue",
        icon: event.icon || "📅",
        reminderDays: event.reminderDays?.toString() || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        location: "",
        type: "EVENT",
        startDate: defaultDate ? format(defaultDate, "yyyy-MM-dd") : "",
        endDate: "",
        startTime: "",
        endTime: "",
        isAllDay: true,
        packageId: "",
        visibility: "ALL",
        color: "blue",
        icon: "📅",
        reminderDays: "",
      });
    }
  }, [event, defaultDate, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.calendar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event berhasil dibuat");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat event");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.calendar.update(event.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event berhasil diupdate");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengupdate event");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => adminService.calendar.delete(event.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event berhasil dihapus");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus event");
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      packageId: data.packageId ? parseInt(data.packageId) : null,
      reminderDays: data.reminderDays ? parseInt(data.reminderDays) : null,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Event" : "Tambah Event Baru"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Judul wajib diisi" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Event</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Deadline Pelunasan"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Event</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                rules={{ required: "Tanggal mulai wajib diisi" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Mulai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Selesai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* All Day Toggle */}
            <FormField
              control={form.control}
              name="isAllDay"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-sm">Sepanjang Hari</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Times (if not all day) */}
            {!form.watch("isAllDay") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jam Mulai</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jam Selesai</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Package (optional) */}
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paket Terkait (Opsional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "none"} // ✅ Default ke "none" bukan empty
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih paket..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada</SelectItem>{" "}
                      {/* ✅ value="none" */}
                      {packages.map((pkg: any) => (
                        <SelectItem key={pkg.id} value={pkg.id.toString()}>
                          {pkg.code} - {pkg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Kantor Pusat" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detail event..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Color & Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warna</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COLOR_OPTIONS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            {color.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibilitas</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Yakin ingin menghapus event ini?")) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Hapus"
                  )}
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEdit ? (
                    "Update"
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
