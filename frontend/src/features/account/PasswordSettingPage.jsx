// frontend/src/features/account/PasswordSettingPage.jsx

import React, { useState } from "react";
import {
  Card,
  Title,
  Text,
  TextInput,
  Button,
  Flex, // Untuk layout tombol
  Icon, // Untuk ikon di Title
} from "@tremor/react";
import { FiLock, FiSave, FiAlertCircle } from "react-icons/fi"; // Tambahkan FiAlertCircle
import apiClient from "../../api/api";

function PasswordSettingPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validasi frontend sederhana
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Semua field wajib diisi.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi tidak cocok.");
      return;
    }
    if (newPassword.length < 8) {
      // Contoh validasi panjang
      setError("Password baru minimal 8 karakter.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await apiClient.put("/account/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      setSuccessMessage(response.data.msg || "Password berhasil diperbarui!");
      // Kosongkan form setelah berhasil
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Gagal ganti password:", err);
      setError(err.response?.data?.msg || "Gagal memperbarui password. Cek kembali password lama Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-10">
      {/* Header Halaman */}
      <Flex alignItems="center" className="space-x-3 mb-6">
        <Icon icon={FiLock} size="lg" variant="light" color="gray" />
        <div>
          <Title>Password Setting</Title>
          <Text>Ubah password akun Anda secara berkala untuk keamanan.</Text>
        </div>
      </Flex>

      <Card className="max-w-2xl mx-auto">
        {" "}
        {/* Batasi lebar card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tampilkan pesan error jika ada */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center space-x-2" role="alert">
              <Icon icon={FiAlertCircle} color="red" size="sm" />
              <Text color="red">{error}</Text>
            </div>
          )}
          {/* Tampilkan pesan sukses jika ada */}
          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
              <Text color="emerald">{successMessage}</Text>
            </div>
          )}

          <div>
            <label htmlFor="oldPassword">Old Password *</label>
            <TextInput id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter your old password" required className="mt-1" />
          </div>

          <div>
            <label htmlFor="newPassword">New Password *</label>
            <TextInput id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter a new password (min. 8 characters)" required className="mt-1" />
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm New Password *</label>
            <TextInput
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              className="mt-1"
              // Tambahkan style error jika tidak cocok (opsional)
              error={newPassword && confirmPassword && newPassword !== confirmPassword}
              errorMessage={newPassword && confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : ""}
            />
          </div>

          <Flex justifyContent="end">
            {" "}
            {/* Rata kanan tombol */}
            <Button
              type="submit"
              icon={FiSave}
              loading={isSaving}
              disabled={isSaving}
              size="lg" // Buat tombol lebih besar
            >
              Update Password
            </Button>
          </Flex>
        </form>
      </Card>
    </div>
  );
}

export default PasswordSettingPage;
