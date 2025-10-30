// frontend/src/features/account/AccountSettingPage.jsx

import React, { useState, useEffect } from "react";
import { Card, Title, Text, TextInput, Button, Grid, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Metric, NumberInput } from "@tremor/react";
import { FiUser, FiMail, FiPhone, FiHome, FiSave, FiEdit3, FiInfo } from "react-icons/fi";
import apiClient from "../../api/api";
import { useAuth } from "../../context/AuthContext"; // Import useAuth

function AccountSettingPage() {
  const { user } = useAuth(); // Ambil data user dari context (terutama role)
  const [userData, setUserData] = useState({
    nama_lengkap: "",
    email: "",
    phone_number: "",
    institution: "",
    assessment_limits: {
      dasar: { count: 0, limit: 0 },
      madya: { count: 0, limit: 0 },
      ai: { count: 0, limit: 0 },
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get("/account/details")
      .then((response) => {
        // Pastikan limit adalah angka atau null saat di-set ke state
        const limits = response.data.assessment_limits || {};
        for (const key in limits) {
          limits[key].limit = limits[key].limit !== null ? Number(limits[key].limit) : null;
        }
        setUserData({ ...response.data, assessment_limits: limits });
        setError("");
      })
      .catch((err) => {
        console.error("Gagal memuat detail akun:", err);
        setError("Gagal memuat data akun. Coba refresh halaman.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleLimitChange = (key, value) => {
    // Konversi ke angka atau null
    const numericValue = value === "" || value === null ? null : Number(value);
    setUserData((prev) => ({
      ...prev,
      assessment_limits: {
        ...prev.assessment_limits,
        [key]: {
          ...prev.assessment_limits[key],
          limit: numericValue,
        },
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    // Siapkan payload hanya dengan field yang bisa diubah
    const payload = {
      nama_lengkap: userData.nama_lengkap,
      phone_number: userData.phone_number,
      institution: userData.institution,
    };

    const isAdmin = user?.role === "admin";
    if (isAdmin) {
      payload.assessment_limits = userData.assessment_limits; // Kirim seluruh objek limits
    }

    try {
      await apiClient.put("/account/update", payload);
      alert("Profil berhasil disimpan!");
      // Opsional: fetch ulang data jika perlu, tapi biasanya state sudah update
    } catch (err) {
      console.error("Gagal menyimpan profil:", err);
      setError(err.response?.data?.msg || "Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 sm:p-10">
        <Title>Account Settings</Title>
        <Text>Memuat data Anda...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-10">
        <Title>Account Settings</Title>
        <Text className="text-red-600">{error}</Text>
      </div>
    );
  }

  // Cek apakah user adalah admin (berdasarkan data dari context/token)
  const isAdmin = user?.role === "admin";

  return (
    <div className="p-6 sm:p-10">
      <Title>Account Settings</Title>
      <Text>Lihat dan kelola informasi profil Anda.</Text>

      <form onSubmit={handleSave}>
        <Grid numItemsMd={2} className="gap-6 mt-6">
          {/* Kolom Kiri: Info Dasar */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <FiUser className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-tremor-content-strong">Informasi Pengguna</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label>Nama Lengkap *</label>
                <TextInput name="nama_lengkap" value={userData.nama_lengkap || ""} onChange={handleChange} required />
              </div>
              <div>
                <label>Email (tidak bisa diubah)</label>
                <TextInput
                  icon={FiMail}
                  name="email"
                  value={userData.email || ""}
                  disabled // Email tidak bisa diubah
                  className="mt-1"
                />
              </div>
              <div>
                <label>Nomor Telepon</label>
                <TextInput icon={FiPhone} name="phone_number" value={userData.phone_number || ""} onChange={handleChange} placeholder="08xxxxxxxxxx" />
              </div>
              <div>
                <label>Institusi</label>
                <TextInput
                  icon={FiHome}
                  name="institution"
                  value={userData.institution || ""}
                  onChange={handleChange}
                  placeholder="Nama PT / Universitas..." // Placeholder ditambahkan
                />
              </div>
            </div>
          </Card>

          {/* Kolom Kanan: Batas Assessment */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <FiInfo className="w-5 h-5 text-gray-500" /> {/* Ganti ikon */}
              <h3 className="text-lg font-medium text-tremor-content-strong">Batas Penggunaan Assessment</h3>
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Tipe Assessment</TableHeaderCell>
                  <TableHeaderCell className="text-right">Penggunaan</TableHeaderCell>
                  <TableHeaderCell className="text-right">Batas Maksimum</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(userData.assessment_limits || {}).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="capitalize font-medium">{key}</TableCell>
                    <TableCell className="text-right">{value.count}</TableCell>
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <NumberInput
                          className="max-w-[100px] ml-auto" // Atur lebar dan posisi
                          value={value.limit ?? ""} // Gunakan state userData, handle null/undefined
                          onValueChange={(val) => handleLimitChange(key, val)} // Gunakan handler baru
                          enableStepper={false}
                          placeholder="Batas"
                          min={0} // Batas minimal 0
                        />
                      ) : (
                        value.limit ?? "N/A" // Tampilkan 'N/A' jika null/undefined
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-xs text-gray-500">
              <p>Format: (Jumlah Dibuat) / (Batas Maksimum)</p>
              {isAdmin && <p className="text-blue-600">Admin dapat mengubah Batas Maksimum.</p>}
              {!isAdmin && <p>Hubungi admin untuk mengubah Batas Maksimum.</p>}
            </div>
          </Card>
        </Grid>

        {/* Tombol Simpan */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" icon={FiSave} loading={isSaving} disabled={isSaving || isLoading}>
            Simpan Perubahan Profil
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AccountSettingPage;
