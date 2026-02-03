// dashboard/src/components/jamaah/DocumentUploader.tsx
"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Check, Loader2, FileImage, Eye } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils"; // ✅ Import getImageUrl

interface DocumentUploaderProps {
  type: string;
  label: string;
  description?: string;
  currentUrl: string | null;
  required?: boolean;
  onUploadSuccess: (url: string) => void;
  accept?: string;
}

export function DocumentUploader({
  type,
  label,
  description,
  currentUrl,
  required = false,
  onUploadSuccess,
  accept = "image/jpeg,image/jpg,image/png",
}: DocumentUploaderProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => jamaahSelfService.uploadDocument(type, file),
    onSuccess: (data) => {
      toast({
        title: "✅ Berhasil",
        description: `${label} berhasil diupload`,
      });
      onUploadSuccess(data.data.url);
      setPreview(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload Gagal",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Terlalu Besar",
        description: "Maksimal ukuran file 5MB",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadMutation.mutate(file);
  };

  // ✅ FIX: Gunakan getImageUrl helper
  const imageUrl = getImageUrl(currentUrl);

  return (
    <>
      <Card
        className={cn(
          "border-2 border-dashed transition-colors",
          currentUrl
            ? "border-green-300 bg-green-50"
            : required
              ? "border-amber-300 bg-amber-50"
              : "border-gray-200",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Preview / Placeholder */}
            <div
              className={cn(
                "w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
                currentUrl ? "bg-white border" : "bg-gray-100",
              )}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              ) : preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : currentUrl ? (
                <img
                  src={imageUrl} // ✅ Sudah full URL
                  alt={label}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowPreview(true)}
                  onError={(e) => {
                    console.error("Image load failed:", imageUrl);
                    e.currentTarget.src = `https://via.placeholder.com/80x80?text=${encodeURIComponent(label)}`;
                  }}
                />
              ) : (
                <FileImage className="h-8 w-8 text-gray-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">
                  {label}
                </span>
                {required && !currentUrl && (
                  <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                    Wajib
                  </span>
                )}
                {currentUrl && <Check className="h-4 w-4 text-green-500" />}
              </div>

              {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant={currentUrl ? "outline" : "default"}
                  className={cn(
                    "h-8 text-xs",
                    !currentUrl &&
                      "bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90",
                  )}
                  onClick={() => inputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : currentUrl ? (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Ganti
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </>
                  )}
                </Button>

                {currentUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Lihat
                  </Button>
                )}
              </div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && currentUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <Button
              size="sm"
              variant="secondary"
              className="absolute -top-10 right-0"
              onClick={() => setShowPreview(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Tutup
            </Button>
            <img
              src={imageUrl} // ✅ Sudah full URL
              alt={label}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(label)}`;
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
