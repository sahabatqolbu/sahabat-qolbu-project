// dashboard/src/app/(mobile)/jamaah/documents/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BottomNav } from "@/components/mobile/BottomNav";
import { DocumentUploader } from "@/components/jamaah/DocumentUploader";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  Eye,
  X,
  ImageOff,
} from "lucide-react";
import Link from "next/link";

// ✅ Helper function untuk generate URL gambar
const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  // Jika sudah full URL, return langsung
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Tambahkan API URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
};

export default function JamaahDocumentsPage() {
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-profile"],
    queryFn: () => jamaahSelfService.getProfile(),
  });

  const profile = data?.data;
  const isApproved = profile?.registrationStatus === "APPROVED";

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["jamaah-profile"] });
  };

  // ✅ Handle preview dengan error handling
  const handlePreview = (url: string | null) => {
    if (url) {
      setImageError(null);
      setPreviewUrl(url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-24 w-full rounded-2xl mb-3" />
        <Skeleton className="h-24 w-full rounded-2xl mb-3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const documents = [
    {
      type: "foto",
      label: "Foto Jamaah",
      description: "Background putih, wajah tampak 80%",
      url: profile?.fotoUrl,
      required: true,
    },
    {
      type: "ktp",
      label: "KTP",
      description: "Scan/foto jelas, tegak lurus",
      url: profile?.ktpUrl,
      required: true,
    },
    {
      type: "kk",
      label: "Kartu Keluarga",
      description: "Scan/foto jelas",
      url: profile?.kkUrl,
      required: true,
    },
    {
      type: "paspor",
      label: "Paspor",
      description: "Halaman identitas (boleh menyusul H-30)",
      url: profile?.pasporUrl,
      required: false,
    },
    {
      type: "vaksin",
      label: "Sertifikat Vaksin",
      description: "Meningitis & Polio (boleh menyusul H-30)",
      url: profile?.vaksinUrl,
      required: false,
    },
    {
      type: "meningitis",
      label: "Kartu Meningitis",
      description: "Boleh menyusul H-30",
      url: profile?.meningitisUrl,
      required: false,
    },
    {
      type: "bukuNikah",
      label: "Buku Nikah",
      description: "Jika diperlukan untuk bukti mahram",
      url: profile?.bukuNikahUrl,
      required: false,
      condition: profile?.maritalStatus === "MENIKAH",
    },
  ];

  const requiredDocs = documents.filter((d) => d.required);
  const optionalDocs = documents.filter(
    (d) => !d.required && (d.condition === undefined || d.condition),
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:max-w-7xl md:px-6 mx-auto">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/jamaah">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Dokumen</h1>
        </div>
      </div>

      <div className="p-4 md:py-6 space-y-4 md:space-y-6">
        {/* Status */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Kelengkapan Dokumen</span>
              <Badge
                className={
                  profile?.completeness?.requiredDocsComplete
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }
              >
                {profile?.completeness?.requiredDocsComplete
                  ? "Lengkap"
                  : "Belum Lengkap"}
              </Badge>
            </div>

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>
                  {
                    Object.values(
                      profile?.completeness?.requiredDocs || {},
                    ).filter(Boolean).length
                  }
                  /3 Wajib
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>
                  {
                    Object.values(
                      profile?.completeness?.optionalDocs || {},
                    ).filter(Boolean).length
                  }{" "}
                  Opsional
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadline Warning */}
        {profile?.deadlines?.daysUntilH30 &&
          profile.deadlines.daysUntilH30 > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Paspor asli & bukti vaksin wajib diserahkan H-30 (
                {profile.deadlines.daysUntilH30} hari lagi)
              </AlertDescription>
            </Alert>
          )}

        {/* Read Only Notice */}
        {isApproved && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Dokumen wajib sudah diapprove. Dokumen opsional tetap bisa diupload.
            </AlertDescription>
          </Alert>
        )}

        {/* Required Documents */}
        <div>
          <h2 className="text-sm font-semibold mb-3 px-1 flex items-center gap-2">
            <span className="text-red-500">*</span>
            Dokumen Wajib
          </h2>
          <div className="space-y-3">
            {requiredDocs.map((doc) =>
              isApproved ? (
                <DocumentCard
                  key={doc.type}
                  doc={doc}
                  onPreview={handlePreview}
                />
              ) : (
                <DocumentUploader
                  key={doc.type}
                  type={doc.type}
                  label={doc.label}
                  description={doc.description}
                  currentUrl={doc.url || null}
                  required
                  onUploadSuccess={handleUploadSuccess}
                />
              ),
            )}
          </div>
        </div>

        {/* Optional Documents */}
        <div>
          <h2 className="text-sm font-semibold mb-3 px-1">
            Dokumen Opsional (Boleh Menyusul)
          </h2>
          <div className="space-y-3">
            {optionalDocs.map((doc) => (
              <DocumentUploader
                key={doc.type}
                type={doc.type}
                label={doc.label}
                description={doc.description}
                currentUrl={doc.url || null}
                onUploadSuccess={handleUploadSuccess}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Preview Modal dengan error handling */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              size="sm"
              variant="secondary"
              className="absolute -top-12 right-0 z-10"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="h-4 w-4 mr-1" />
              Tutup
            </Button>

            {/* Image dengan error handling */}
            {imageError ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <ImageOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Gagal memuat gambar</p>
                <p className="text-sm text-gray-400 mt-1 break-all">
                  {previewUrl}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => window.open(previewUrl, "_blank")}
                >
                  Buka di Tab Baru
                </Button>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                onError={() => setImageError(previewUrl)}
              />
            )}
          </div>
        </div>
      )}

      <BottomNav role="JAMAAH" />
    </div>
  );
}

// ✅ FIXED: DocumentCard dengan proper URL handling
function DocumentCard({
  doc,
  onPreview,
}: {
  doc: {
    type: string;
    label: string;
    description?: string;
    url: string | null | undefined;
    required?: boolean;
  };
  onPreview: (url: string | null) => void;
}) {
  const [imgError, setImgError] = useState(false);

  // ✅ Gunakan helper function
  const imageUrl = getImageUrl(doc.url);

  return (
    <Card
      className={`border-2 ${doc.url
          ? "border-green-300 bg-green-50"
          : doc.required
            ? "border-amber-300 bg-amber-50"
            : "border-gray-200"
        }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div
            className="w-16 h-16 rounded-lg bg-white border overflow-hidden flex items-center justify-center cursor-pointer"
            onClick={() => imageUrl && onPreview(imageUrl)}
          >
            {imageUrl && !imgError ? (
              <img
                src={imageUrl}
                alt={doc.label}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <FileText className="h-6 w-6 text-gray-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{doc.label}</span>
              {doc.url && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
            {doc.description && (
              <p className="text-xs text-gray-500">{doc.description}</p>
            )}
            {doc.url && imageUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs mt-1 p-0"
                onClick={() => onPreview(imageUrl)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Lihat
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
