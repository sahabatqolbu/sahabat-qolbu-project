// dashboard/src/components/packages/MediaUpload.tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

interface MediaUploadProps {
  onImagesChange: (files: File[]) => void;
  onPdfChange: (file: File | null) => void;
  existingImages?: { id: number; imageUrl: string; caption?: string }[];
  existingPdf?: string;
  onDeleteImage?: (imageId: number) => void;
}

export function MediaUpload({
  onImagesChange,
  onPdfChange,
  existingImages = [],
  existingPdf,
  onDeleteImage,
}: MediaUploadProps) {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pdf, setPdf] = useState<File | null>(null);

  // ===== IMAGE DROPZONE =====
  const onDropImages = useCallback(
    (acceptedFiles: File[]) => {
      const imageFiles = acceptedFiles.filter((file) =>
        file.type.startsWith("image/")
      );

      setImages((prev) => [...prev, ...imageFiles]);
      onImagesChange([...images, ...imageFiles]);

      // Create previews
      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    },
    [images, onImagesChange]
  );

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: onDropImages,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
    },
    multiple: true,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // ===== PDF UPLOAD =====
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdf(file);
      onPdfChange(file);
    } else {
      alert("Hanya file PDF yang diperbolehkan");
    }
  };

  // ===== REMOVE NEW IMAGE =====
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
    onImagesChange(newImages);
  };

  // ===== REMOVE PDF =====
  const removePdf = () => {
    setPdf(null);
    onPdfChange(null);
  };

  return (
    <div className="space-y-6">
      {/* ===== UPLOAD IMAGES ===== */}
      <Card>
        <CardContent className="p-6">
          <Label className="text-base font-semibold mb-4 block">
            Gambar / Brosur Paket
          </Label>

          {/* Dropzone */}
          <div
            {...getImageRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${
                isImageDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary/50"
              }
            `}
          >
            <input {...getImageInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              {isImageDragActive
                ? "Drop gambar di sini..."
                : "Drag & drop gambar atau klik untuk pilih"}
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG, WebP (Max 5MB per file)
            </p>
          </div>

          {/* Existing Images (from server) */}
          {existingImages.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Gambar Tersimpan ({existingImages.length})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                      <Image
                        src={getImageUrl(img.imageUrl)}
                        alt={img.caption || "Package image"}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {onDeleteImage && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDeleteImage(img.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Gambar Baru ({imagePreviews.length})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="mt-1 text-xs text-gray-500 truncate">
                      {images[index].name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== UPLOAD PDF ITINERARY ===== */}
      <Card>
        <CardContent className="p-6">
          <Label className="text-base font-semibold mb-4 block">
            PDF Itinerary (Opsional)
          </Label>

          {/* Existing PDF */}
          {existingPdf && !pdf && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    Itinerary Tersimpan
                  </p>
                  <a
                    href={getImageUrl(existingPdf)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Lihat PDF
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* PDF Upload Input */}
          <div>
            <Label
              htmlFor="pdf-upload"
              className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <FileText className="h-8 w-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                  {pdf
                    ? pdf.name
                    : existingPdf
                    ? "Upload PDF baru untuk replace"
                    : "Klik untuk upload PDF itinerary"}
                </p>
                <p className="text-xs text-gray-500">Max 10MB</p>
              </div>
            </Label>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              className="hidden"
            />
          </div>

          {/* PDF Preview */}
          {pdf && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{pdf.name}</p>
                  <p className="text-sm text-green-700">
                    {(pdf.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={removePdf}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
