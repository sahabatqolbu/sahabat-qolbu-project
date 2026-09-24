"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import {
  jamaahSelfService,
  SELECTED_JAMAAH_MEMBER_KEY,
} from "@/services/jamaahSelfService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const relationshipLabels: Record<string, string> = {
  DIRI_SENDIRI: "Anggota utama",
  PASANGAN: "Pasangan",
  ANAK: "Anak",
  ORANG_TUA: "Orang tua",
  SAUDARA: "Saudara",
  KERABAT: "Kerabat",
  ROMBONGAN: "Rombongan",
};

export function JamaahMemberSwitcher() {
  const [storedBooking, setStoredBooking] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem(SELECTED_JAMAAH_MEMBER_KEY) || "",
  );
  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-members"],
    queryFn: () => jamaahSelfService.getMembers(),
    staleTime: 60_000,
  });

  const members = data?.data;
  const selectedMember =
    members?.find((member) => member.bookingNumber === storedBooking) ||
    members?.find((member) => member.isPrimary) ||
    members?.[0];
  const selectedBooking = selectedMember?.bookingNumber || "";

  if (isLoading || !members || members.length <= 1 || !selectedBooking) {
    return null;
  }

  return (
    <div className="border-b border-blue-100 bg-blue-50/90 px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-blue-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-900 text-white">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold">Akun Keluarga</p>
            <p className="text-xs text-blue-700">
              Kelola biodata, dokumen, dan pembayaran setiap anggota.
            </p>
          </div>
        </div>

        <Select
          value={selectedBooking}
          onValueChange={(bookingNumber) => {
            window.localStorage.setItem(
              SELECTED_JAMAAH_MEMBER_KEY,
              bookingNumber,
            );
            setStoredBooking(bookingNumber);
            window.location.reload();
          }}
        >
          <SelectTrigger className="h-10 w-full bg-white sm:w-[300px]">
            <SelectValue>
              {selectedMember
                ? `${selectedMember.fullName} - ${relationshipLabels[selectedMember.relationship] || selectedMember.relationship}`
                : "Pilih anggota"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.bookingNumber}>
                <span className="font-medium">{member.fullName}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {relationshipLabels[member.relationship] ||
                    member.relationship}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
