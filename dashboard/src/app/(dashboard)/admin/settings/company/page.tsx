"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getImageUrl } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Instagram,
  Facebook,
  Youtube,
  Upload,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CompanyProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<any>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // ===== FETCH COMPANY PROFILE =====
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      const res = await api.get("/master/company");
      return res.data;
    },
  });

  // ✅ SET FORM DATA & LOGO PREVIEW
  useEffect(() => {
    if (data?.data) {
      setFormData(data.data);

      if (data.data.logo) {
        const logoPath = data.data.logo; // /uploads/company/xxx.webp
        setLogoPreview(getImageUrl(logoPath));
      } else {
        setLogoPreview("");
      }
    }
  }, [data]);

  // ===== UPDATE MUTATION =====
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put("/master/company", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });

      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 5000);

      toast({
        title: "✅ Profil Berhasil Disimpan",
        description: "Perubahan telah tersimpan ke database",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Update Profil",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // ===== UPLOAD LOGO MUTATION =====
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("logo", file);

      const res = await api.post("/master/company/logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });

      const newLogoPath = response.data.logo; // /uploads/company/xxx.webp
      setLogoPreview(getImageUrl(newLogoPath));
      setLogoFile(null);

      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 5000);

      toast({
        title: "✅ Logo Berhasil Diupload",
        description: "Logo perusahaan telah diperbarui",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Upload Logo",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File terlalu besar",
          description: "Maksimal ukuran file adalah 2MB",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Format file tidak valid",
          description: "Hanya file gambar yang diperbolehkan",
        });
        return;
      }

      setLogoFile(file);

      // Preview dari file local
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            Gagal memuat data profil perusahaan: {(error as any)?.response?.data?.message || (error as Error)?.message || "Terjadi kesalahan"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Profil Perusahaan
        </h1>
        <p className="text-gray-600 mt-1">
          Kelola informasi perusahaan dan kontak
        </p>
      </div>

      {/* ✅ SUCCESS ALERT */}
      {showSuccessAlert && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Berhasil!</strong> Perubahan telah tersimpan ke database.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Info Dasar</TabsTrigger>
            <TabsTrigger value="contact">Kontak</TabsTrigger>
            <TabsTrigger value="social">Sosial Media</TabsTrigger>
            <TabsTrigger value="about">Tentang</TabsTrigger>
          </TabsList>

          {/* ===== TAB: INFO DASAR ===== */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>Data umum perusahaan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <div className="space-y-4">
                  <Label>Logo Perusahaan</Label>
                  <div className="flex items-start gap-6">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {logoPreview ? (
                        <div className="space-y-2">
                          <div className="w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                            <img
                              src={logoPreview}
                              alt="Logo Perusahaan"
                              className="w-full h-full object-contain p-2"
                            //   onLoad={() =>
                            //     console.log("✅ Image loaded successfully")
                            //   }
                            //   onError={(e) => {
                            //     console.error("❌ Image failed to load");
                            //     console.error("Image src:", logoPreview);
                            //   }}
                            />
                          </div>
                          {/* Debug URL */}
                          {/* <p className="text-xs text-gray-500 break-all max-w-[128px]">
                            {logoPreview.substring(0, 50)}...
                          </p> */}
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
                          <ImageIcon className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Upload */}
                    <div className="flex-1 space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      {logoFile && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            File dipilih: <strong>{logoFile.name}</strong> (
                            {(logoFile.size / 1024).toFixed(1)} KB)
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleUploadLogo}
                            disabled={uploadLogoMutation.isPending}
                          >
                            {uploadLogoMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Logo Sekarang
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Format: PNG, JPG, WebP • Maksimal 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nama Perusahaan */}
                <div className="space-y-2">
                  <Label>Nama Perusahaan</Label>
                  <Input
                    value={formData.companyName || ""}
                    onChange={(e) =>
                      handleChange("companyName", e.target.value)
                    }
                    placeholder="PT Sahabat Qolbu Indonesia"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={formData.tagline || ""}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    placeholder="Mitra Terpercaya Perjalanan Ibadah Anda"
                  />
                </div>

                {/* Legalitas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>NPWP</Label>
                    <Input
                      value={formData.npwp || ""}
                      onChange={(e) => handleChange("npwp", e.target.value)}
                      placeholder="00.000.000.0-000.000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nomor PPIU</Label>
                    <Input
                      value={formData.ppiu || ""}
                      onChange={(e) => handleChange("ppiu", e.target.value)}
                      placeholder="D/123/2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kode IATA</Label>
                    <Input
                      value={formData.iata || ""}
                      onChange={(e) => handleChange("iata", e.target.value)}
                      placeholder="12345678"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: KONTAK ===== */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Informasi Kontak
                </CardTitle>
                <CardDescription>
                  Detail kontak yang dapat dihubungi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Alamat */}
                <div className="space-y-2">
                  <Label>Alamat Lengkap</Label>
                  <Textarea
                    rows={3}
                    value={formData.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Jl. Contoh No. 123"
                  />
                </div>

                {/* Kota, Provinsi, Kode Pos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Kota/Kabupaten</Label>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Jakarta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provinsi</Label>
                    <Input
                      value={formData.province || ""}
                      onChange={(e) => handleChange("province", e.target.value)}
                      placeholder="DKI Jakarta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kode Pos</Label>
                    <Input
                      value={formData.postalCode || ""}
                      onChange={(e) =>
                        handleChange("postalCode", e.target.value)
                      }
                      placeholder="12345"
                    />
                  </div>
                </div>

                {/* Phone, WhatsApp, Email, Website */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telepon</Label>
                    <Input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="021-12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      type="tel"
                      value={formData.whatsapp || ""}
                      onChange={(e) => handleChange("whatsapp", e.target.value)}
                      placeholder="08123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="info@sahabatqolbu.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      type="url"
                      value={formData.website || ""}
                      onChange={(e) => handleChange("website", e.target.value)}
                      placeholder="https://sahabatqolbu.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: SOSIAL MEDIA ===== */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Sosial Media</CardTitle>
                <CardDescription>Link akun sosial media resmi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    type="url"
                    value={formData.instagram || ""}
                    onChange={(e) => handleChange("instagram", e.target.value)}
                    placeholder="https://instagram.com/sahabatqolbu"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    type="url"
                    value={formData.facebook || ""}
                    onChange={(e) => handleChange("facebook", e.target.value)}
                    placeholder="https://facebook.com/sahabatqolbu"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </Label>
                  <Input
                    type="url"
                    value={formData.youtube || ""}
                    onChange={(e) => handleChange("youtube", e.target.value)}
                    placeholder="https://youtube.com/@sahabatqolbu"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FaTiktok className="h-4 w-4" />
                    TikTok
                  </Label>
                  <Input
                    type="url"
                    value={formData.tiktok || ""}
                    onChange={(e) => handleChange("tiktok", e.target.value)}
                    placeholder="https://tiktok.com/@sahabatqolbu"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: TENTANG ===== */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tentang Perusahaan
                </CardTitle>
                <CardDescription>
                  Deskripsi, visi, dan misi perusahaan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Deskripsi Perusahaan</Label>
                  <Textarea
                    rows={5}
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Sahabat Qolbu adalah..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Visi</Label>
                  <Textarea
                    rows={3}
                    value={formData.vision || ""}
                    onChange={(e) => handleChange("vision", e.target.value)}
                    placeholder="Menjadi mitra terpercaya..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Misi</Label>
                  <Textarea
                    rows={5}
                    value={formData.mission || ""}
                    onChange={(e) => handleChange("mission", e.target.value)}
                    placeholder="1. Memberikan pelayanan terbaik...&#10;2. ..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <Card className="mt-6 sticky bottom-4 shadow-lg">
          <CardContent className="p-4">
            <Button
              type="submit"
              className="w-full bg-secondary hover:bg-secondary/90"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan Perubahan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Semua Perubahan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
