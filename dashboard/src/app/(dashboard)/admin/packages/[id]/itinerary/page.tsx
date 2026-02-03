// dashboard/src/app/(dashboard)/admin/packages/[id]/itinerary/page.tsx
"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { packageService } from "@/services/packageService";
import { getImageUrl } from "@/lib/utils";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PackageItineraryPage({ params }: PageProps) {
  const { id: packageId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch Package
  const { data: packageData, isLoading } = useQuery({
    queryKey: ["package", packageId],
    queryFn: () => packageService.getById(parseInt(packageId)),
  });

  const pkg = packageData?.data;

  useEffect(() => {
    if (!isLoading && pkg) {
      if (pkg.itineraryPdf) {
        // ✅ LANGSUNG BUKA PDF DI TAB BARU
        const pdfUrl = getImageUrl(pkg.itineraryPdf);
        window.open(pdfUrl, "_blank");

        // Redirect balik ke detail paket
        router.replace(`/admin/packages/${packageId}`);
      } else {
        // Kalo belum ada PDF, kasih toast warning
        toast({
          variant: "destructive",
          title: "❌ PDF Itinerary Belum Ada",
          description: "Silakan upload PDF terlebih dahulu",
        });

        // Redirect ke edit page tab gambar
        router.replace(`/admin/packages/${packageId}/edit?tab=images`);
      }
    }
  }, [pkg, isLoading, packageId, router, toast]);

  // Loading state
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-gray-600">
          {isLoading ? "Memuat..." : "Membuka PDF Itinerary..."}
        </p>
      </div>
    </div>
  );
}
