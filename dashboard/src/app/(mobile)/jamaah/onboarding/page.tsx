// dashboard/src/app/(mobile)/jamaah/onboarding/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jamaahSelfService, BiodataUpdate } from "@/services/jamaahSelfService";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useToast } from "@/hooks/use-toast";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingProgress } from "@/components/jamaah/OnboardingProgress";
import { SaveIndicator } from "@/components/jamaah/SaveIndicator";
import { DocumentUploader } from "@/components/jamaah/DocumentUploader";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Send,
  User,
  MapPin,
  CreditCard,
  Users,
  Phone,
  FileText,
  ClipboardCheck,
} from "lucide-react";

// ===== STEPS CONFIG =====
const STEPS = [
  { id: 1, title: "Data Diri", shortTitle: "Data Diri", icon: User },
  { id: 2, title: "Alamat", shortTitle: "Alamat", icon: MapPin },
  { id: 3, title: "Paspor", shortTitle: "Paspor", icon: CreditCard },
  { id: 4, title: "Mahram", shortTitle: "Mahram", icon: Users },
  { id: 5, title: "Kontak Darurat", shortTitle: "Darurat", icon: Phone },
  { id: 6, title: "Dokumen", shortTitle: "Dokumen", icon: FileText },
  { id: 7, title: "Review", shortTitle: "Review", icon: ClipboardCheck },
];

// ===== INITIAL FORM DATA =====
const initialFormData: BiodataUpdate = {
  namaPaspor: "",
  nik: "",
  birthPlace: "",
  birthDate: "",
  gender: undefined,
  maritalStatus: undefined,
  address: "",
  province: "",
  city: "",
  district: "",
  postalCode: "",
  passportNumber: "",
  passportIssueDate: "",
  passportExpiry: "",
  passportIssuePlace: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  mahramId: null,
  mahramRelation: "",
};

export default function JamaahOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ===== STATE =====
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BiodataUpdate>(initialFormData);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [documents, setDocuments] = useState({
    fotoUrl: null as string | null,
    ktpUrl: null as string | null,
    kkUrl: null as string | null,
    pasporUrl: null as string | null,
    vaksinUrl: null as string | null,
    meningitisUrl: null as string | null,
    bukuNikahUrl: null as string | null,
  });

  // ===== FETCH PROFILE =====
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["jamaah-profile"],
    queryFn: () => jamaahSelfService.getProfile(),
    staleTime: 30000,
  });

  const profile = profileData?.data;

  // ===== REDIRECT LOGIC =====
  useEffect(() => {
    if (!isLoading && profile) {
      // Jika sudah APPROVED, redirect ke dashboard
      if (profile.registrationStatus === "APPROVED") {
        router.replace("/jamaah");
        return;
      }

      // Jika VERIFIED (menunggu approval), redirect ke waiting
      if (profile.registrationStatus === "VERIFIED") {
        router.replace("/jamaah/waiting-approval");
        return;
      }
    }
  }, [isLoading, profile, router]);

  // ===== POPULATE FORM DATA =====
  useEffect(() => {
    if (profile) {
      setFormData({
        namaPaspor: profile.namaPaspor || "",
        nik: profile.nik || "",
        birthPlace: profile.birthPlace || "",
        birthDate: profile.birthDate || "",
        gender: profile.gender || undefined,
        maritalStatus: profile.maritalStatus || undefined,
        address: profile.address || "",
        province: profile.province || "",
        city: profile.city || "",
        district: profile.district || "",
        postalCode: profile.postalCode || "",
        passportNumber: profile.passportNumber || "",
        passportIssueDate: profile.passportIssueDate || "",
        passportExpiry: profile.passportExpiry || "",
        passportIssuePlace: profile.passportIssuePlace || "",
        emergencyName: profile.emergencyName || "",
        emergencyPhone: profile.emergencyPhone || "",
        emergencyRelation: profile.emergencyRelation || "",
        mahramId: profile.mahramId || null,
        mahramRelation: profile.mahramRelation || "",
      });

      setDocuments({
        fotoUrl: profile.fotoUrl,
        ktpUrl: profile.ktpUrl,
        kkUrl: profile.kkUrl,
        pasporUrl: profile.pasporUrl,
        vaksinUrl: profile.vaksinUrl,
        meningitisUrl: profile.meningitisUrl,
        bukuNikahUrl: profile.bukuNikahUrl,
      });
    }
  }, [profile]);

  // ===== AUTO-SAVE =====
  const { saveStatus, lastSaved, saveNow, isSaving } = useAutoSave({
    data: formData,
    onSave: async (data) => {
      await jamaahSelfService.updateBiodata(data);
      queryClient.invalidateQueries({ queryKey: ["jamaah-profile"] });
    },
    debounceMs: 2000,
    enabled: !!profile && profile.registrationStatus !== "APPROVED",
  });

  // ===== SUBMIT MUTATION =====
  const submitMutation = useMutation({
    mutationFn: () => jamaahSelfService.submit(),
    onSuccess: () => {
      toast({
        title: "✅ Data Tersubmit",
        description: "Menunggu approval dari admin",
      });
      router.push("/jamaah/waiting-approval");
    },
    onError: (error: any) => {
      const missingFields = error.response?.data?.data?.missingFields || [];
      const missingDocs = error.response?.data?.data?.missingDocs || [];

      toast({
        variant: "destructive",
        title: "Data Belum Lengkap",
        description: `${missingFields.length > 0 ? `Field: ${missingFields.join(", ")}. ` : ""
          }${missingDocs.length > 0 ? `Dokumen: ${missingDocs.join(", ")}` : ""}`,
      });
    },
  });

  // ===== HANDLERS =====
  const updateFormData = (field: keyof BiodataUpdate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  // ===== VALIDATION PER STEP =====
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1: // Data Diri
        return !!(
          formData.namaPaspor &&
          formData.nik &&
          formData.birthDate &&
          formData.birthPlace &&
          formData.gender
        );
      case 2: // Alamat
        return !!(formData.address && formData.province && formData.city);
      case 3: // Paspor (opsional, boleh skip)
        return true;
      case 4: // Mahram (opsional)
        return true;
      case 5: // Emergency
        return !!(formData.emergencyName && formData.emergencyPhone);
      case 6: // Documents
        return !!(documents.fotoUrl && documents.ktpUrl && documents.kkUrl);
      case 7: // Review
        return true;
      default:
        return false;
    }
  }, [currentStep, formData, documents]);

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // ===== REJECTION ALERT =====
  const isRejected = profile?.registrationStatus === "REJECTED";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-24 md:max-w-7xl md:px-6 mx-auto">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white p-4 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold mb-1">Pendaftaran Jamaah</h1>
          <p className="text-sm text-white/70">Lengkapi data Anda</p>

          {/* Save Indicator */}
          <div className="mt-3 flex items-center justify-between">
            <SaveIndicator status={saveStatus} lastSaved={lastSaved} />
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={saveNow}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Simpan
            </Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <OnboardingProgress
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Rejection Alert */}
        {isRejected && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Data Ditolak</AlertTitle>
            <AlertDescription>
              Silakan perbaiki data yang diminta dan submit ulang.
              {(profile as any)?.notes && (
                <p className="mt-2 font-medium">Catatan: {(profile as any).notes}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              {(() => {
                const StepIcon = STEPS[currentStep - 1].icon;
                return (
                  <StepIcon className="h-5 w-5 text-[var(--color-primary)]" />
                );
              })()}
              {STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* STEP 1: Data Diri */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="namaPaspor">
                    Nama Lengkap (Sesuai Paspor){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="namaPaspor"
                    placeholder="Nama lengkap sesuai paspor"
                    value={formData.namaPaspor}
                    onChange={(e) =>
                      updateFormData("namaPaspor", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nik">
                    NIK <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nik"
                    placeholder="16 digit NIK"
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) =>
                      updateFormData("nik", e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="birthPlace">
                      Tempat Lahir <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="birthPlace"
                      placeholder="Kota"
                      value={formData.birthPlace}
                      onChange={(e) =>
                        updateFormData("birthPlace", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">
                      Tanggal Lahir <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        updateFormData("birthDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => updateFormData("gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIA">Pria</SelectItem>
                        <SelectItem value="WANITA">Wanita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Pernikahan</Label>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) =>
                        updateFormData("maritalStatus", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BELUM_MENIKAH">
                          Belum Menikah
                        </SelectItem>
                        <SelectItem value="MENIKAH">Menikah</SelectItem>
                        <SelectItem value="CERAI">Cerai</SelectItem>
                        <SelectItem value="DUDA_JANDA">Duda/Janda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: Alamat */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Jalan, RT/RW, No. Rumah"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="province">
                      Provinsi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="province"
                      placeholder="Provinsi"
                      value={formData.province}
                      onChange={(e) =>
                        updateFormData("province", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      Kota/Kabupaten <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="Kota/Kabupaten"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="district">Kecamatan</Label>
                    <Input
                      id="district"
                      placeholder="Kecamatan"
                      value={formData.district}
                      onChange={(e) =>
                        updateFormData("district", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Kode Pos</Label>
                    <Input
                      id="postalCode"
                      placeholder="Kode Pos"
                      maxLength={5}
                      value={formData.postalCode}
                      onChange={(e) =>
                        updateFormData(
                          "postalCode",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* STEP 3: Paspor */}
            {currentStep === 3 && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Data paspor boleh diisi nanti (menyusul). Pastikan sudah
                    lengkap sebelum H-30 keberangkatan.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Nomor Paspor</Label>
                  <Input
                    id="passportNumber"
                    placeholder="Nomor paspor"
                    value={formData.passportNumber}
                    onChange={(e) =>
                      updateFormData("passportNumber", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="passportIssueDate">Tanggal Terbit</Label>
                    <Input
                      id="passportIssueDate"
                      type="date"
                      value={formData.passportIssueDate}
                      onChange={(e) =>
                        updateFormData("passportIssueDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportExpiry">Masa Berlaku</Label>
                    <Input
                      id="passportExpiry"
                      type="date"
                      value={formData.passportExpiry}
                      onChange={(e) =>
                        updateFormData("passportExpiry", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passportIssuePlace">Tempat Terbit</Label>
                  <Input
                    id="passportIssuePlace"
                    placeholder="Kantor imigrasi penerbit"
                    value={formData.passportIssuePlace}
                    onChange={(e) =>
                      updateFormData("passportIssuePlace", e.target.value)
                    }
                  />
                </div>
              </>
            )}

            {/* STEP 4: Mahram */}
            {currentStep === 4 && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Mahram adalah wali/pendamping untuk jamaah wanita. Opsional,
                    bisa diisi nanti.
                  </AlertDescription>
                </Alert>

                <MahramSelector
                  value={formData.mahramId || null}
                  relation={formData.mahramRelation || ""}
                  onChangeMahram={(id) => updateFormData("mahramId", id)}
                  onChangeRelation={(rel) =>
                    updateFormData("mahramRelation", rel)
                  }
                />
              </>
            )}

            {/* STEP 5: Emergency Contact */}
            {currentStep === 5 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">
                    Nama Kontak Darurat <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emergencyName"
                    placeholder="Nama lengkap"
                    value={formData.emergencyName}
                    onChange={(e) =>
                      updateFormData("emergencyName", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">
                    No. HP Kontak Darurat{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emergencyPhone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      updateFormData("emergencyPhone", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyRelation">Hubungan</Label>
                  <Select
                    value={formData.emergencyRelation}
                    onValueChange={(value) =>
                      updateFormData("emergencyRelation", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hubungan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUAMI">Suami</SelectItem>
                      <SelectItem value="ISTRI">Istri</SelectItem>
                      <SelectItem value="AYAH">Ayah</SelectItem>
                      <SelectItem value="IBU">Ibu</SelectItem>
                      <SelectItem value="ANAK">Anak</SelectItem>
                      <SelectItem value="SAUDARA">Saudara</SelectItem>
                      <SelectItem value="LAINNYA">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* STEP 6: Documents */}
            {currentStep === 6 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Upload dokumen yang diperlukan. Format: JPG/PNG, maks 5MB.
                </p>

                <DocumentUploader
                  type="foto"
                  label="Foto Jamaah"
                  description="Background putih, wajah tampak 80%"
                  currentUrl={documents.fotoUrl}
                  required
                  onUploadSuccess={(url) =>
                    setDocuments((prev) => ({ ...prev, fotoUrl: url }))
                  }
                />

                <DocumentUploader
                  type="ktp"
                  label="KTP"
                  description="Scan/foto jelas, tegak lurus"
                  currentUrl={documents.ktpUrl}
                  required
                  onUploadSuccess={(url) =>
                    setDocuments((prev) => ({ ...prev, ktpUrl: url }))
                  }
                />

                <DocumentUploader
                  type="kk"
                  label="Kartu Keluarga"
                  description="Scan/foto jelas"
                  currentUrl={documents.kkUrl}
                  required
                  onUploadSuccess={(url) =>
                    setDocuments((prev) => ({ ...prev, kkUrl: url }))
                  }
                />

                <div className="border-t pt-3 mt-4">
                  <p className="text-xs text-gray-500 mb-3">
                    Dokumen berikut boleh menyusul (sebelum H-30):
                  </p>

                  <div className="space-y-3">
                    <DocumentUploader
                      type="paspor"
                      label="Paspor"
                      description="Halaman identitas"
                      currentUrl={documents.pasporUrl}
                      onUploadSuccess={(url) =>
                        setDocuments((prev) => ({ ...prev, pasporUrl: url }))
                      }
                    />

                    <DocumentUploader
                      type="vaksin"
                      label="Sertifikat Vaksin"
                      description="Meningitis & Polio"
                      currentUrl={documents.vaksinUrl}
                      onUploadSuccess={(url) =>
                        setDocuments((prev) => ({ ...prev, vaksinUrl: url }))
                      }
                    />

                    {formData.maritalStatus === "MENIKAH" && (
                      <DocumentUploader
                        type="bukuNikah"
                        label="Buku Nikah"
                        description="Jika diperlukan untuk mahram"
                        currentUrl={documents.bukuNikahUrl}
                        onUploadSuccess={(url) =>
                          setDocuments((prev) => ({
                            ...prev,
                            bukuNikahUrl: url,
                          }))
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Review */}
            {currentStep === 7 && (
              <ReviewStep
                formData={formData}
                documents={documents}
                profile={profile}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid}
              className="flex-1 bg-[var(--color-primary)]"
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="flex-1 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== SUB-COMPONENTS =====

// Mahram Selector
function MahramSelector({
  value,
  relation,
  onChangeMahram,
  onChangeRelation,
}: {
  value: number | null;
  relation: string;
  onChangeMahram: (id: number | null) => void;
  onChangeRelation: (rel: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ["mahram-search", search],
    queryFn: () => jamaahSelfService.searchMahram(search),
    enabled: search.length >= 3,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Cari Mahram</Label>
        <Input
          placeholder="Ketik nama atau no. booking (min 3 karakter)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isFetching && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Mencari...
        </div>
      )}

      {searchResults?.data && searchResults.data.length > 0 && (
        <div className="space-y-2">
          {searchResults.data.map((item: any) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-colors ${value === item.id
                ? "border-[var(--color-primary)] bg-primary/5"
                : "hover:bg-gray-50"
                }`}
              onClick={() => onChangeMahram(item.id)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {item.bookingNumber} •{" "}
                    {item.gender === "PRIA" ? "Pria" : "Wanita"}
                  </p>
                </div>
                {value === item.id && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {value && (
        <div className="space-y-2">
          <Label>Hubungan dengan Mahram</Label>
          <Select value={relation} onValueChange={onChangeRelation}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih hubungan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUAMI">Suami</SelectItem>
              <SelectItem value="ISTRI">Istri</SelectItem>
              <SelectItem value="AYAH">Ayah</SelectItem>
              <SelectItem value="IBU">Ibu</SelectItem>
              <SelectItem value="ANAK">Anak</SelectItem>
              <SelectItem value="SAUDARA_KANDUNG">Saudara Kandung</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-500"
            onClick={() => {
              onChangeMahram(null);
              onChangeRelation("");
            }}
          >
            Hapus Mahram
          </Button>
        </div>
      )}
    </div>
  );
}

// Review Step
function ReviewStep({
  formData,
  documents,
  profile,
}: {
  formData: BiodataUpdate;
  documents: any;
  profile: any;
}) {
  const requiredDocsComplete =
    documents.fotoUrl && documents.ktpUrl && documents.kkUrl;
  const biodataComplete =
    formData.namaPaspor &&
    formData.nik &&
    formData.birthDate &&
    formData.birthPlace &&
    formData.gender &&
    formData.address &&
    formData.province &&
    formData.city &&
    formData.emergencyName &&
    formData.emergencyPhone;

  const canSubmit = requiredDocsComplete && biodataComplete;

  return (
    <div className="space-y-4">
      {/* Status */}
      <Alert variant={canSubmit ? "default" : "destructive"}>
        {canSubmit ? (
          <>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Data Lengkap ✅</AlertTitle>
            <AlertDescription>
              Anda dapat submit data untuk direview admin.
            </AlertDescription>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Data Belum Lengkap</AlertTitle>
            <AlertDescription>
              Lengkapi semua field wajib dan dokumen sebelum submit.
            </AlertDescription>
          </>
        )}
      </Alert>

      {/* Summary */}
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Data Diri</p>
          <p className="font-medium text-sm">{formData.namaPaspor || "-"}</p>
          <p className="text-xs text-gray-600">
            NIK: {formData.nik || "-"} •{" "}
            {formData.gender === "PRIA"
              ? "Pria"
              : formData.gender === "WANITA"
                ? "Wanita"
                : "-"}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Alamat</p>
          <p className="text-sm">{formData.address || "-"}</p>
          <p className="text-xs text-gray-600">
            {formData.city}, {formData.province}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Kontak Darurat</p>
          <p className="font-medium text-sm">{formData.emergencyName || "-"}</p>
          <p className="text-xs text-gray-600">
            {formData.emergencyPhone || "-"}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Dokumen</p>
          <div className="grid grid-cols-3 gap-2">
            <DocStatus label="Foto" ok={!!documents.fotoUrl} required />
            <DocStatus label="KTP" ok={!!documents.ktpUrl} required />
            <DocStatus label="KK" ok={!!documents.kkUrl} required />
            <DocStatus label="Paspor" ok={!!documents.pasporUrl} />
            <DocStatus label="Vaksin" ok={!!documents.vaksinUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DocStatus({
  label,
  ok,
  required = false,
}: {
  label: string;
  ok: boolean;
  required?: boolean;
}) {
  return (
    <div
      className={`text-center p-2 rounded ${ok
        ? "bg-green-50 text-green-700"
        : required
          ? "bg-red-50 text-red-700"
          : "bg-gray-100 text-gray-500"
        }`}
    >
      <p className="text-xs font-medium">{label}</p>
      <p className="text-[10px]">
        {ok ? "✓" : required ? "Wajib" : "Opsional"}
      </p>
    </div>
  );
}
