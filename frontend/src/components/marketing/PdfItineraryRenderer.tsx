"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileWarning, Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfItineraryRendererProps {
  fileUrl: string;
  title: string;
}

export default function PdfItineraryRenderer({
  fileUrl,
  title,
}: PdfItineraryRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setContainerWidth(container.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const pageWidth = Math.max(Math.min(containerWidth - 24, 980), 280);

  return (
    <div
      ref={containerRef}
      className="min-h-[520px] bg-neutral-100 px-3 py-4"
      aria-label={title}
    >
      {failed ? (
        <div className="flex min-h-[480px] flex-col items-center justify-center px-6 text-center">
          <FileWarning className="h-10 w-10 text-amber-600" />
          <p className="mt-4 font-extrabold text-primary">
            Preview PDF belum dapat dimuat
          </p>
          <p className="mt-2 max-w-md text-sm font-medium leading-6 text-neutral-600">
            Dokumen tetap tersedia melalui tombol Download PDF.
          </p>
        </div>
      ) : (
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => {
            setPageCount(numPages);
            setFailed(false);
          }}
          onLoadError={() => setFailed(true)}
          loading={
            <div className="flex min-h-[480px] items-center justify-center gap-3 font-bold text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
              Memuat itinerary...
            </div>
          }
          className="space-y-4"
        >
          {containerWidth > 0 &&
            Array.from({ length: pageCount }, (_, index) => (
              <Page
                key={`page-${index + 1}`}
                pageNumber={index + 1}
                width={pageWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                className="mx-auto overflow-hidden rounded-sm bg-white shadow-sm"
                loading={
                  <div
                    className="mx-auto animate-pulse bg-white"
                    style={{ width: pageWidth, aspectRatio: "0.707" }}
                  />
                }
              />
            ))}
        </Document>
      )}
    </div>
  );
}
