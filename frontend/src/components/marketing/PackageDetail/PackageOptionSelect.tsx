"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PackageOptionSelectProps = {
  options: Array<{
    id: number;
    name: string;
    isDefault?: boolean;
  }>;
  selectedOptionId: number;
  selectedOptionIsDefault: boolean;
  selectedOptionHasFlyer: boolean;
};

export default function PackageOptionSelect({
  options,
  selectedOptionId,
  selectedOptionIsDefault,
  selectedOptionHasFlyer,
}: PackageOptionSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(String(selectedOptionId));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(String(selectedOptionId));
  }, [selectedOptionId]);

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    const params = new URLSearchParams(searchParams.toString());
    params.set("option", nextValue);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  if (options.length < 2) {
    return null;
  }

  return (
    <div className="border-b border-neutral-200 bg-primary/[0.035] p-6">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
        <Check className="h-4 w-4 text-gold" />
        Pilihan paket
      </div>
      <div className="relative mt-3">
        <select
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          disabled={isPending}
          aria-label="Pilih opsi paket"
          className="h-12 w-full appearance-none rounded-sm border border-neutral-300 bg-white px-4 pr-11 text-sm font-extrabold text-primary outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:cursor-wait disabled:opacity-70"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
              {option.isDefault ? " - Opsi utama" : ""}
            </option>
          ))}
        </select>
        {isPending ? (
          <Loader2 className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-gold" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
        )}
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
        {selectedOptionIsDefault
          ? "Opsi utama memakai hotel, harga, dan gambar paket utama."
          : selectedOptionHasFlyer
            ? "Hotel, harga, dan flyer khusus sudah menyesuaikan opsi ini."
            : "Hotel dan harga sudah berubah. Flyer khusus opsi belum tersedia, jadi gambar utama masih ditampilkan."}
      </p>
    </div>
  );
}
