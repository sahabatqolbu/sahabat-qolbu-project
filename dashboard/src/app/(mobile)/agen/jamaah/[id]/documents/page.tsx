// dashboard/src/app/(mobile)/agen/jamaah/[id]/documents/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agenService } from "@/services/agenService";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  FileText,
  User,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { getImageUrl } from "@/lib/utils";

const DOCUMENT_TYPES = [
  { key: "fotoUrl", label: "Pas Foto", icon: Camera, required: true },
  { key: "ktpUrl", label: "KTP", icon: FileText, required: true },
  { key: "kkUrl", label: "Kartu Keluarga", icon: Users, required: true },
  { key: "pasporUrl", label: "Scan Paspor", icon: FileText, required: true },
  { key: "bukuNikahUrl", label: "Buku Nikah", icon: FileText, required: false },
  { key: "aktaLahirUrl", label: "Akta Lahir", icon: FileText, required: false },
  { key: "ijazahUrl", label: "Ijazah", icon: FileText, required: false },
  {
    key: "vaksinUrl",
    label: "Sertifikat Vaksin",
    icon: FileText,
    required: false,
  },
  {
    key: "meningitisUrl",
    label: "Sertifikat Meningitis",
    icon: FileText,
    required: false,
  },
];

export default function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch Jamaah
  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-detail", id],
    queryFn: () => agenService.getJamaahById(id),
    enabled: !!id,
  });

  const jamaah = data?.data;

  // Handle File Select
  const handleFileSelect = (type: string) => {
    setSelectedType(type);
    fileInputRef.current?.click();
  };

  // Handle Upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedType) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File terlalu besar",
        description: "Maksimal ukuran file adalah 5MB",
      });
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Format tidak didukung",
        description: "Gunakan format JPG, PNG, WebP, atau PDF",
      });
      return;
    }

    setUploading(selectedType);

    try {
      await agenService.uploadJamaahDocument(id, selectedType, file);
      toast({
        title: "✅ Berhasil",
        description: "Dokumen berhasil diupload",
      });
      queryClient.invalidateQueries({ queryKey: ["jamaah-detail", id] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Gagal upload",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    } finally {
      setUploading(null);
      setSelectedType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!jamaah) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">Data tidak ditemukan</p>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const requiredDocs = DOCUMENT_TYPES.filter((d) => d.required);
  const optionalDocs = DOCUMENT_TYPES.filter((d) => !d.required);
  const uploadedCount = DOCUMENT_TYPES.filter(
    (d) => jamaah[d.key as keyof typeof jamaah],
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:max-w-7xl lg:px-6 lg:mx-auto">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleUpload}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 -ml-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Upload Dokumen</h1>
            <p className="text-sm opacity-80">
              {uploadedCount}/{DOCUMENT_TYPES.length} dokumen terupload
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Required Documents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Dokumen Wajib</span>
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-300"
              >
                {
                  requiredDocs.filter(
                    (d) => jamaah[d.key as keyof typeof jamaah],
                  ).length
                }
                /{requiredDocs.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requiredDocs.map((doc) => {
              const DocIcon = doc.icon;
              const url = jamaah[doc.key as keyof typeof jamaah] as
                | string
                | null;
              const isUploading = uploading === doc.key;

              return (
                <div
                  key={doc.key}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    url
                      ? "border-green-200 bg-green-50"
                      : "border-orange-200 bg-orange-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        url ? "bg-green-100" : "bg-orange-100"
                      }`}
                    >
                      {url ? (
                        <img
                          src={getImageUrl(url)}
                          alt={doc.label}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <DocIcon
                          className={`h-5 w-5 ${
                            url ? "text-green-600" : "text-orange-600"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.label}</p>
                      <p
                        className={`text-xs ${
                          url ? "text-green-600" : "text-orange-600"
                        }`}
                      >
                        {url ? "Sudah diupload" : "Belum diupload"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {url && (
                      <a
                        href={getImageUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileSelect(doc.key)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          {url ? "Ganti" : "Upload"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Optional Documents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Dokumen Tambahan</span>
              <Badge variant="outline">
                {
                  optionalDocs.filter(
                    (d) => jamaah[d.key as keyof typeof jamaah],
                  ).length
                }
                /{optionalDocs.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {optionalDocs.map((doc) => {
              const DocIcon = doc.icon;
              const url = jamaah[doc.key as keyof typeof jamaah] as
                | string
                | null;
              const isUploading = uploading === doc.key;

              return (
                <div
                  key={doc.key}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    url
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        url ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <DocIcon
                        className={`h-5 w-5 ${
                          url ? "text-green-600" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.label}</p>
                      <p className="text-xs text-gray-500">Opsional</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {url && (
                      <a
                        href={getImageUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileSelect(doc.key)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          {url ? "Ganti" : "Upload"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Tips:</strong> Upload dokumen dengan format JPG, PNG, atau
              PDF. Maksimal ukuran file 5MB. Pastikan foto jelas dan tidak blur.
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNav role="AGEN" />
    </div>
  );
}
