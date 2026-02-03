"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
  DollarSign,
  Copy,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { BottomNav } from "@/components/mobile/BottomNav";

export default function PaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>("");

  // ===== FETCH PROFILE =====
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["agen-profile"],
    queryFn: () => adminService.agenProfile.getMyProfile(),
  });

  const agentData = profileData?.data?.agentData;
  const selectedLevel = agentData?.currentLevel;

  // ===== UPLOAD MUTATION =====
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      adminService.agenProfile.uploadPaymentProof(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agen-profile"] });
      setPaymentProofPreview(data.data.url);
      toast({
        title: "✅ Bukti pembayaran berhasil diupload!",
        description: "Menunggu verifikasi admin",
      });
      setTimeout(() => {
        router.push("/agen");
      }, 2000);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPaymentProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!paymentProofFile) {
      toast({
        variant: "destructive",
        title: "Pilih file terlebih dahulu",
      });
      return;
    }
    uploadMutation.mutate(paymentProofFile);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28 w-full md:max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/agen">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Bayar Training</h1>
            <p className="text-sm opacity-90 mt-1">
              Upload bukti transfer Anda
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Bank Info */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">Informasi Transfer</CardTitle>
            <CardDescription>Transfer ke rekening berikut</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white rounded-lg p-4 border">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Jumlah:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-lg text-green-600">
                      Rp{" "}
                      {parseInt(selectedLevel?.price || "0").toLocaleString(
                        "id-ID"
                      )}
                    </strong>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          selectedLevel?.price || ""
                        );
                        toast({ title: "✅ Nominal dicopy!" });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bank:</span>
                  <strong>BCA</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">No. Rekening:</span>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono">1234567890</strong>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText("1234567890");
                        toast({ title: "✅ No. rekening dicopy!" });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">A/N:</span>
                  <strong>PT Sahabat Qolbu</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Bukti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Bukti Transfer</CardTitle>
            <CardDescription>
              Screenshot/foto bukti transfer yang jelas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentProofPreview ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={paymentProofPreview}
                  alt="Bukti TF"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-500">Belum ada bukti</p>
              </div>
            )}

            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploadMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="sticky bottom-20">
          <Button
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg h-14 text-lg"
            onClick={handleUpload}
            disabled={!paymentProofFile || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Mengupload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload Bukti Transfer
              </>
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}
