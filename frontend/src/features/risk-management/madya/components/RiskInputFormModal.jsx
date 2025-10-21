// frontend/src/features/risk-management/madya/components/RiskInputFormModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogPanel, Title, Text, Button, TextInput, Textarea, Select, SelectItem, NumberInput, Grid, Card } from "@tremor/react";
import { FiSave, FiX, FiInfo, FiClipboard, FiTrendingUp, FiUserCheck, FiTool, FiCheckCircle } from "react-icons/fi";
import apiClient from "../../../../api/api";

const statusRisikoOptions = ["Risiko Aktif", "Risiko Retired"];
const peluangAncamanOptions = ["Ancaman", "Peluang"];
const strategiOptions = [
  "Menghindari Risiko",
  "Mengambil atau Meningkatkan Risiko",
  "Menghilangkan Sumber Risiko",
  "Mengubah Kemungkinan",
  "Mengubah Dampak",
  "Membagi Risiko",
  "Mempertahankan (Retain) Risiko",
  "Mengubah Kemungkinan dan Dampak",
];
const kategoriRisikoOptions = [
  "Risiko Kredit",
  "Risiko Pasar",
  "Risiko Likuiditas",
  "Risiko Operasional",
  "Risiko Kepatuhan",
  "Risiko Hukum",
  "Risiko Strategik",
  "Risiko Reputasi",
  "Risiko Lainnya", // Nanti akan jadi 'Lainnya'
];

const formatDateForInput = (date) => {
  if (!date) return "";
  try {
    // Cek jika sudah string YYYY-MM-DD
    if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    // Jika objek Date atau string format lain, coba format
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  } catch (e) {
    return ""; // Return string kosong jika format tidak valid
  }
};

const parseFloatSafely = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = String(value)
    .replace(/[^0-9.,]/g, "")
    .replace(",", "."); // Handle koma desimal
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// Helper baru untuk format Rupiah
const formatRupiah = (value) => {
  const num = parseFloatSafely(value);
  if (num === null) return "";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};
const parseRupiah = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = String(value).replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
};

// --- Helper BARU untuk clamping nilai P & I ---
const clampValue = (value, min = 1, max = 5) => {
  const num = parseInt(value, 10);
  if (value === "" || value === undefined || value === null || isNaN(num)) {
    return ""; // Memungkinkan user menghapus isi field
  }
  return Math.max(min, Math.min(num, max));
};

const getDefaultFormState = () => ({
  assessment_id: null,
  status_risiko: "Risiko Aktif",
  peluang_ancaman: "Ancaman",
  kategori_risiko: "",
  kategori_risiko_lainnya: "",
  unit_kerja: "",
  sasaran_id: "",
  tanggal_identifikasi: formatDateForInput(new Date()),
  deskripsi_risiko: "",
  akar_penyebab: "",
  indikator_risiko: "",
  internal_control: "",
  deskripsi_dampak: "",
  inherent_probabilitas: 1,
  inherent_dampak: 1,
  inherent_prob_kualitatif: null,
  inherent_dampak_finansial: null,
  pemilik_risiko: "",
  jabatan_pemilik: "",
  kontak_pemilik_hp: "",
  kontak_pemilik_email: "",
  strategi: "",
  rencana_penanganan: "",
  biaya_penanganan: null,
  penanganan_dilakukan: "",
  status_penanganan: "",
  jadwal_mulai_penanganan: "",
  jadwal_selesai_penanganan: "",
  pic_penanganan: "",
  residual_probabilitas: null,
  residual_dampak: null,
  residual_prob_kualitatif: null,
  residual_dampak_finansial: null,
  tanggal_review: "",
});

function RiskInputFormModal({
  isOpen,
  onClose,
  onSaveSuccess,
  assessmentId,
  initialData = null, // Data untuk mode edit
  sasaranOptions = [], // Opsi dari Card 3
  unitKerjaOptions = [], // Opsi dari Card 1
  templateScores = [],
}) {
  const isEditMode = Boolean(initialData?.id);
  const [formData, setFormData] = useState(getDefaultFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const validSasaranOptions = Array.isArray(sasaranOptions) ? sasaranOptions : [];

  // Inisialisasi atau reset form state saat modal dibuka atau initialData berubah
  useEffect(() => {
    if (isOpen) {
      const defaultState = getDefaultFormState();
      defaultState.assessment_id = assessmentId;

      if (isEditMode && initialData) {
        const formattedInitialData = {
          ...initialData,
          tanggal_identifikasi: formatDateForInput(initialData.tanggal_identifikasi),
          jadwal_mulai_penanganan: formatDateForInput(initialData.jadwal_mulai_penanganan),
          jadwal_selesai_penanganan: formatDateForInput(initialData.jadwal_selesai_penanganan),
          tanggal_review: formatDateForInput(initialData.tanggal_review),
          inherent_probabilitas: clampValue(initialData.inherent_probabilitas) || 1,
          inherent_dampak: clampValue(initialData.inherent_dampak) || 1,
          residual_probabilitas: clampValue(initialData.residual_probabilitas) || null,
          residual_dampak: clampValue(initialData.residual_dampak) || null,
        };
        setFormData({ ...defaultState, ...formattedInitialData, assessment_id: assessmentId });
      } else {
        setFormData(defaultState);
      }
      setError(""); // Reset error
    }
  }, [isOpen, initialData, assessmentId, isEditMode]);

  const calculatedInherenNilaiBersih = useMemo(() => {
    const prob = parseFloatSafely(formData.inherent_prob_kualitatif);
    const dampak = parseRupiah(formData.inherent_dampak_finansial);
    if (prob === null || dampak === null) return null;
    return (prob / 100.0) * dampak;
  }, [formData.inherent_prob_kualitatif, formData.inherent_dampak_finansial]);

  const calculatedResidualNilaiBersih = useMemo(() => {
    const prob = parseFloatSafely(formData.residual_prob_kualitatif);
    const dampak = parseRupiah(formData.residual_dampak_finansial);
    if (prob === null || dampak === null) return null;
    return (prob / 100.0) * dampak;
  }, [formData.residual_prob_kualitatif, formData.residual_dampak_finansial]);

  // Handler generik untuk input & select
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClampedNumberChange = (name, value) => {
    const clamped = clampValue(value, 1, 5); // Clamp antara 1 dan 5, atau '' jika input kosong/invalid
    setFormData((prev) => ({ ...prev, [name]: clamped }));
  };

  // Handler khusus untuk Kategori Risiko (menangani 'Lainnya')
  const handleKategoriChange = (value) => {
    handleChange("kategori_risiko", value);
    if (value !== "Risiko Lainnya") {
      handleChange("kategori_risiko_lainnya", "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    if (formData.kategori_risiko === "Risiko Lainnya" && !formData.kategori_risiko_lainnya?.trim()) {
      /*...validasi...*/
      setError("Harap isi nama Kategori Risiko Lainnya.");
      setIsLoading(false);
      return;
    }
    const inherentP = parseInt(formData.inherent_probabilitas, 10);
    const inherentI = parseInt(formData.inherent_dampak, 10);
    const residualP = formData.residual_probabilitas !== "" ? parseInt(formData.residual_probabilitas, 10) : null;
    const residualI = formData.residual_dampak !== "" ? parseInt(formData.residual_dampak, 10) : null;

    if (isNaN(inherentP) || inherentP < 1 || inherentP > 5 || isNaN(inherentI) || inherentI < 1 || inherentI > 5) {
      setError("Probabilitas dan Dampak Inheren harus antara 1 dan 5.");
      setIsLoading(false);
      return;
    }
    if ((residualP !== null && (isNaN(residualP) || residualP < 1 || residualP > 5)) || (residualI !== null && (isNaN(residualI) || residualI < 1 || residualI > 5))) {
      setError("Probabilitas dan Dampak Residual harus antara 1 dan 5 (jika diisi).");
      setIsLoading(false);
      return;
    }

    // Siapkan payload, pastikan tipe data angka benar
    const payload = {
      ...formData,
      inherent_probabilitas: inherentP,
      inherent_dampak: inherentI,
      residual_probabilitas: residualP,
      residual_dampak: residualI,
      sasaran_id: formData.sasaran_id ? parseInt(formData.sasaran_id, 10) : null,
      inherent_prob_kualitatif: parseFloatSafely(formData.inherent_prob_kualitatif),
      residual_prob_kualitatif: parseFloatSafely(formData.residual_prob_kualitatif),
      inherent_dampak_finansial: parseRupiah(formData.inherent_dampak_finansial),
      residual_dampak_finansial: parseRupiah(formData.residual_dampak_finansial),
      biaya_penanganan: parseRupiah(formData.biaya_penanganan),
      tanggal_identifikasi: formData.tanggal_identifikasi || null,
      jadwal_mulai_penanganan: formData.jadwal_mulai_penanganan || null,
      jadwal_selesai_penanganan: formData.jadwal_selesai_penanganan || null,
      tanggal_review: formData.tanggal_review || null,
    };

    // for (const dateField of ["tanggal_identifikasi", "jadwal_mulai_penanganan", "jadwal_selesai_penanganan", "tanggal_review"]) {
    //   if (!payload[dateField]) {
    //     payload[dateField] = null;
    //   }
    // }
    delete payload.inherent_skor_display;
    delete payload.residual_skor_display;
    delete payload.inherent_nilai_bersih_display;
    delete payload.residual_nilai_bersih_display;

    console.log("Payload to backend (template-aware score calculated by backend):", payload);

    try {
      let response;
      if (isEditMode) {
        response = await apiClient.put(`/risk-inputs/${initialData.id}`, payload);
      } else {
        response = await apiClient.post(`/madya-assessments/${assessmentId}/risk-inputs`, payload);
      }
      onSaveSuccess(response.data.entry, isEditMode); // Kirim data hasil save/update ke parent
      onClose(); // Tutup modal jika sukses
    } catch (err) {
      setError(err.response?.data?.msg || `Gagal ${isEditMode ? "memperbarui" : "menyimpan"} Risk Input.`);
      console.error("Save/Update error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (label, name, component, isRequired = false, props = {} /* ... sama ... */) => (
    <div className={props.span === 2 ? "md:col-span-2" : ""}>
      <label className="text-sm font-medium text-tremor-content">
        {label}
        {isRequired && " *"}
      </label>
      {React.cloneElement(component, { name: name, value: formData[name] || "", onChange: (e) => handleChange(name, e.target.value), required: isRequired, className: "mt-1", ...props })}
    </div>
  );
  const renderSelectField = (label, name, options, isRequired = false, props = {}, optionValueKey = "value", optionLabelKey = "label" /* ... sama ... */) => (
    <div className={props.span === 2 ? "md:col-span-2" : ""}>
      <label className="text-sm font-medium text-tremor-content">
        {label}
        {isRequired && " *"}
      </label>
      <Select name={name} value={String(formData[name] || "")} onValueChange={(v) => handleChange(name, v)} required={isRequired} className="mt-1" {...props}>
        <SelectItem value="">{props.placeholder || `Pilih ${label}...`}</SelectItem>
        {options.map((opt, index) => (
          <SelectItem key={typeof opt === "object" ? opt[optionValueKey] : index} value={String(typeof opt === "object" ? opt[optionValueKey] : opt)}>
            {typeof opt === "object" ? opt[optionLabelKey] : opt}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
  const renderNumberField = (label, name, isRequired = false, props = {}) => (
    <div className={props.span === 2 ? "md:col-span-2" : ""}>
      <label className="text-sm font-medium text-tremor-content">
        {label}
        {isRequired && " *"}
      </label>
      <NumberInput
        name={name}
        value={formData[name] ?? ""}
        onValueChange={(v) => {
          if (name.includes("probabilitas") || name.includes("dampak")) {
            const clampedValue = clampValue(v, 1, 5);
            handleChange(name, clampedValue);
          } else {
            handleChange(name, v);
          }
        }}
        required={isRequired}
        className="mt-1"
        enableStepper={name.includes("probabilitas") || name.includes("dampak")}
        {...props}
      />
    </div>
  );

  const renderRupiahField = (label, name, props = {}) => (
    <div className={props.span === 2 ? "md:col-span-2" : ""}>
      <label className="text-sm font-medium text-tremor-content">{label}</label>
      <TextInput
        icon={() => <span className="text-gray-500 text-sm">Rp</span>}
        name={name}
        value={formatRupiah(formData[name])}
        onChange={(e) => handleChange(name, parseRupiah(e.target.value))}
        placeholder={props.placeholder || "0"}
        className="mt-1"
        {...props}
      />
    </div>
  );

  const inherentPForScore = parseInt(formData.inherent_probabilitas, 10);
  const inherentIForScore = parseInt(formData.inherent_dampak, 10);
  const inherentSkor = useMemo(() => {
    const p = parseInt(formData.inherent_probabilitas, 10);
    const i = parseInt(formData.inherent_dampak, 10);

    console.log(`inherentSkor useMemo: P=${formData.inherent_probabilitas} (parsed=${p}), I=${formData.inherent_dampak} (parsed=${i})`);

    if (isNaN(p) || p < 1 || p > 5 || isNaN(i) || i < 1 || i > 5) {
      console.log("--> Invalid P/I, returning empty string.");
      return "";
    }

    if (!Array.isArray(templateScores)) {
      console.error("--> templateScores is not an array!", templateScores);
      return "";
    }

    let foundScoreData = null;
    templateScores.forEach((s, index) => {
      const s_p = parseInt(s.likelihood_level, 10);
      const s_i = parseInt(s.impact_level, 10);
      console.log(`  Comparing with item ${index}: s_p=${s_p} (${typeof s_p}), s_i=${s_i} (${typeof s_i}). Match? ${s_p === p && s_i === i}`);
      if (s_p === p && s_i === i) {
        foundScoreData = s;
      }
    });

    const scoreData = foundScoreData;

    console.log(`--> Found scoreData for P=${p}, I=${i}:`, scoreData);

    return scoreData ? String(scoreData.score) : "";
  }, [formData.inherent_probabilitas, formData.inherent_dampak, templateScores]);

  const residualSkor = useMemo(() => {
    const pStr = formData.residual_probabilitas;
    const iStr = formData.residual_dampak;
    const p = pStr !== "" && pStr !== null && pStr !== undefined ? parseInt(pStr, 10) : null;
    const i = iStr !== "" && iStr !== null && iStr !== undefined ? parseInt(iStr, 10) : null;

    console.log(`residualSkor useMemo: P=${formData.residual_probabilitas} (parsed=${p}), I=${formData.residual_dampak} (parsed=${i})`);

    if (p === null || isNaN(p) || p < 1 || p > 5 || i === null || isNaN(i) || i < 1 || i > 5) {
      console.log("--> Invalid or empty P/I residual, returning empty string.");
      return ""; // Tampilkan string kosong jika P atau I residual tidak valid/kosong
    }

    if (!Array.isArray(templateScores)) {
      console.error("--> templateScores is not an array!", templateScores);
      return "";
    }

    let foundScoreData = null;
    templateScores.forEach((s, index) => {
      const s_p = parseInt(s.likelihood_level, 10);
      const s_i = parseInt(s.impact_level, 10);
      if (s_p === p && s_i === i) {
        foundScoreData = s;
      }
    });

    const scoreData = foundScoreData;

    console.log(`--> Found scoreData for residual P=${p}, I=${i}:`, scoreData);

    return scoreData ? String(scoreData.score) : "";
    // Alternatif fallback: return scoreData ? scoreData.score : p * i;
  }, [formData.residual_probabilitas, formData.residual_dampak, templateScores]);

  return (
    <Dialog open={isOpen} onClose={onClose} static={true} className="z-[100]">
      <DialogPanel className="max-w-5xl">
        <div className="flex justify-between items-start">
          <Title>{isEditMode ? "Edit" : "Tambah"} Risk Input Baru</Title>
          <Button icon={FiX} variant="light" className="-mt-1 -mr-1" onClick={onClose} />
        </div>
        {error && <Text className="text-red-500 mt-2">{error}</Text>}
        {/* Buat form scrollable jika kontennya panjang */}
        <form onSubmit={handleSubmit} className="mt-6 max-h-[75vh] overflow-y-auto pr-4 -mr-4 space-y-6">
          {/* --- BAGIAN IDENTIFIKASI --- */}
          <Card className="border border-gray-200 shadow-sm">
            {/* ... field identifikasi ... */}
            <div className="flex items-center gap-3 mb-4 border-b pb-2">
              <FiClipboard className="w-5 h-5 text-gray-500" />
              <Title order={5} className="text-tremor-content-strong">
                Identifikasi Risiko
              </Title>
            </div>
            <Grid numItemsMd={2} className="gap-x-6 gap-y-4">
              {renderField("Kode Risiko", "kode_risiko", <TextInput placeholder="Otomatis atau manual..." />)} {renderSelectField("Status Risiko", "status_risiko", statusRisikoOptions, true, { defaultValue: "Risiko Aktif" })}
              {renderSelectField("Peluang / Ancaman", "peluang_ancaman", peluangAncamanOptions, true, { defaultValue: "Ancaman" })}
              <div>
                <label className="text-sm font-medium text-tremor-content">Kategori Risiko *</label>
                <Select name="kategori_risiko" value={formData.kategori_risiko || ""} onValueChange={handleKategoriChange} required className="mt-1">
                  <SelectItem value="">Pilih Kategori...</SelectItem>
                  {kategoriRisikoOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              {formData.kategori_risiko === "Risiko Lainnya" && renderField("Nama Kategori Lainnya", "kategori_risiko_lainnya", <TextInput />, true, { span: 2 })}
              {renderSelectField("Unit Kerja", "unit_kerja", unitKerjaOptions, true, { disabled: unitKerjaOptions.length === 0, placeholder: "Pilih Unit Kerja...", optionValueKey: null, optionLabelKey: null })}
              <div>
                <label className="text-sm font-medium text-tremor-content">Sasaran Terkait (Opsional)</label>
                <Select name="sasaran_id" value={String(formData.sasaran_id || "")} onValueChange={(v) => handleChange("sasaran_id", v)} disabled={validSasaranOptions.length === 0} className="mt-1">
                  <SelectItem value="">Pilih Sasaran/KPI...</SelectItem>
                  {validSasaranOptions.map((opt) => {
                    const displayText = typeof opt.sasaran_kpi === "string" || typeof opt.sasaran_kpi === "number" ? String(opt.sasaran_kpi) : `Invalid Option (ID: ${opt.id})`;
                    return (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {displayText}
                      </SelectItem>
                    );
                  })}
                </Select>
              </div>
              {renderField("Tanggal Identifikasi", "tanggal_identifikasi", <TextInput type="date" />, true)} {renderField("Deskripsi Risiko", "deskripsi_risiko", <Textarea rows={3} />, true, { span: 2 })}
              {renderField("Akar Penyebab", "akar_penyebab", <Textarea rows={3} />, false, { span: 2 })} {renderField("Indikator Risiko Kunci (KRI)", "indikator_risiko", <Textarea rows={3} />, false, { span: 2 })}
              {renderField("Kontrol Internal Yang Ada", "internal_control", <Textarea rows={3} />, false, { span: 2 })} {renderField("Deskripsi Dampak", "deskripsi_dampak", <Textarea rows={3} />, false, { span: 2 })}
            </Grid>
          </Card>

          {/* --- BAGIAN ANALISIS INHEREN --- */}
          <Card className="border border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 border-b border-blue-200 pb-2">
              <Title order={5} className="text-tremor-content-strong text-blue-700">
                Analisis Risiko Inheren
              </Title>
            </div>
            <Grid numItemsMd={2} className="gap-x-6 gap-y-4 items-end">
              {renderNumberField("Probabilitas (P)", "inherent_probabilitas", true, { min: 1, max: 5 })}
              {renderNumberField("Dampak (I)", "inherent_dampak", true, { min: 1, max: 5 })}
              <div>
                <label className="text-sm font-medium text-tremor-content">Skor Risiko</label>
                <TextInput name="inherent_skor_display" value={inherentSkor} disabled placeholder={templateScores.length > 0 ? "Otomatis" : "Pilih P & I"} className="mt-1" />
              </div>
              {renderNumberField("Probabilitas Kualitatif (%)", "inherent_prob_kualitatif", false, { icon: FiInfo, placeholder: "0 - 100", min: 0, max: 100 })}
              {renderRupiahField("Dampak Finansial (Rp)", "inherent_dampak_finansial", { placeholder: "1.000.000" })}
              {renderField(
                "Nilai Bersih Risiko Inheren",
                "inherent_nilai_bersih_display",
                <TextInput icon={() => <span className="text-gray-500 text-sm">Rp</span>} value={formatRupiah(calculatedInherenNilaiBersih)} disabled placeholder="Hasil % x Rp" />
              )}
            </Grid>
          </Card>

          {/* --- BAGIAN PEMILIK RISIKO --- */}
          <Card className="border border-yellow-300 shadow-sm">
            <div className="flex items-center gap-3 mb-4 border-b border-yellow-300 pb-2">
              <FiUserCheck className="w-5 h-5 text-yellow-600" />
              <Title order={5} className="text-tremor-content-strong text-yellow-700">
                Pemilik Risiko
              </Title>
            </div>
            <Grid numItemsMd={2} className="gap-x-6 gap-y-4">
              {renderField("Nama Pemilik Risiko", "pemilik_risiko", <TextInput placeholder="Nama..." />)} {renderField("Jabatan", "jabatan_pemilik", <TextInput placeholder="Jabatan..." />)}
              {renderField("No. HP", "kontak_pemilik_hp", <TextInput placeholder="08..." />)} {renderField("Email", "kontak_pemilik_email", <TextInput type="email" placeholder="email@..." />)}
            </Grid>
          </Card>

          {/* --- BAGIAN PENANGANAN --- */}
          <Card className="border border-green-300 shadow-sm">
            {/* ... field penanganan ... */}
            <div className="flex items-center gap-3 mb-4 border-b border-green-300 pb-2">
              <FiTool className="w-5 h-5 text-green-600" />
              <Title order={5} className="text-tremor-content-strong text-green-700">
                Evaluasi & Penanganan Risiko
              </Title>
            </div>
            <Grid numItemsMd={2} className="gap-x-6 gap-y-4">
              {renderSelectField("Strategi Penanganan", "strategi", strategiOptions, true)} {renderField("Rencana Penanganan / Mitigasi", "rencana_penanganan", <Textarea rows={4} />, true, { span: 2 })}
              {renderRupiahField("Estimasi Biaya Penanganan (Rp)", "biaya_penanganan", { placeholder: "500.000" })}
              {renderSelectField("Status Penanganan", "status_penanganan", ["Open", "In Progress", "Done", "Cancelled"], false, { placeholder: "Pilih Status..." })}
              {renderField("Jadwal Mulai", "jadwal_mulai_penanganan", <TextInput type="date" />)} {renderField("Jadwal Selesai", "jadwal_selesai_penanganan", <TextInput type="date" />)}
              {renderField("PIC Penanganan", "pic_penanganan", <TextInput placeholder="Nama PIC..." />, false, { span: 2 })} {renderField("Penanganan Yang Telah Dilakukan", "penanganan_dilakukan", <Textarea rows={3} />, false, { span: 2 })}
            </Grid>
          </Card>

          {/* --- BAGIAN ANALISIS RESIDUAL --- */}
          <Card className="border border-red-200 shadow-sm">
            {/* ... field residual ... */}
            <div className="flex items-center gap-3 mb-4 border-b border-red-200 pb-2">
              <FiCheckCircle className="w-5 h-5 text-red-500" />
              <Title order={5} className="text-tremor-content-strong text-red-700">
                Analisis Risiko Residual
              </Title>
            </div>
            <Grid numItemsMd={2} className="gap-x-6 gap-y-4 items-end">
              {renderNumberField("Probabilitas (P)", "residual_probabilitas", false, { min: 1, max: 5, placeholder: "1-5" })}
              {renderNumberField("Dampak (I)", "residual_dampak", false, { min: 1, max: 5, placeholder: "1-5" })}
              <div>
                <label className="text-sm font-medium text-tremor-content">Skor Risiko</label>
                <TextInput
                  name="residual_skor_display"
                  value={residualSkor} // <-- Langsung gunakan variabel hasil useMemo
                  disabled
                  placeholder={templateScores.length > 0 ? "Otomatis" : "Pilih P & I"}
                  className="mt-1"
                />
              </div>
              {renderNumberField("Probabilitas Kualitatif (%)", "residual_prob_kualitatif", false, { icon: FiInfo, placeholder: "0 - 100", min: 0, max: 100 })}
              {renderRupiahField("Dampak Finansial (Rp)", "residual_dampak_finansial", { placeholder: "200.000" })}
              {renderField(
                "Nilai Bersih Risiko Residual",
                "residual_nilai_bersih_display",
                <TextInput icon={() => <span className="text-gray-500 text-sm">Rp</span>} value={formatRupiah(calculatedResidualNilaiBersih)} disabled placeholder="Hasil % x Rp" />
              )}
              {renderField("Tanggal Review", "tanggal_review", <TextInput type="date" />)}
            </Grid>
          </Card>
        </form>
        <div className="mt-8 pt-4 border-t flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} icon={FiX}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={isLoading} icon={FiSave}>
            {isEditMode ? "Update Risk Input" : "Simpan Risk Input"}
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

export default RiskInputFormModal;
