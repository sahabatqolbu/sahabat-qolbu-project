"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface PdfItineraryPreviewProps {
  fileUrl: string;
  title: string;
}

const PdfItineraryRenderer = dynamic(() => import("./PdfItineraryRenderer"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] items-center justify-center gap-3 bg-neutral-100 font-bold text-primary">
      <Loader2 className="h-6 w-6 animate-spin" />
      Memuat itinerary...
    </div>
  ),
});

export default function PdfItineraryPreview({
  fileUrl,
  title,
}: PdfItineraryPreviewProps) {
  return <PdfItineraryRenderer fileUrl={fileUrl} title={title} />;
}
