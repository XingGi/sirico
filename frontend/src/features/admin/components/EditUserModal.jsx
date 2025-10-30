// frontend/src/features/admin/components/EditUserModal.jsx

import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, Text, TextInput, Button, Grid, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, NumberInput, MultiSelect, MultiSelectItem, Subtitle, Card, Divider, Flex, Icon } from "@tremor/react";
import { FiUser, FiMail, FiPhone, FiHome, FiSave, FiX, FiInfo, FiKey, FiLoader, FiEdit } from "react-icons/fi";
import apiClient from "../../../api/api";

function EditUserModal({ isOpen, onClose, userId, allRoles, onSaveSuccess }) {
  const [userData, setUserData] = useState(null); // Mulai dari null
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  // Fetch data user saat modal dibuka atau userId berubah
  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      setError("");
      console.log("Fetching details for userId:", userId, typeof userId);

      if (typeof userId === "number" && !isNaN(userId)) {
        apiClient
          .get(`/admin/users/${userId}`) // Gunakan userId yang sudah divalidasi
          .then((response) => {
            const fetchedUser = response.data;
            const limits = fetchedUser.assessment_limits || {};
            for (const key in limits) {
              limits[key].limit = limits[key].limit !== null ? Number(limits[key].limit) : null;
            }
            setUserData({ ...fetchedUser, assessment_limits: limits });
            setSelectedRoleIds(fetchedUser.role_ids?.map(String) || []); // Set roles awal
          })
          .catch((err) => {
            console.error(`Gagal fetch user ${userId}:`, err);
            setError("Gagal memuat data pengguna.");
            setUserData(null); // Reset jika gagal
          })
          .finally(() => setIsLoading(false));
      } else {
        console.error("Invalid userId type received:", userId, typeof userId);
        setError("ID Pengguna tidak valid untuk diambil datanya.");
        setIsLoading(false);
        setUserData(null);
      }
    } else if (!isOpen) {
      // Reset saat modal ditutup
      setUserData(null);
      setSelectedRoleIds([]);
      setIsLoading(true);
    }
  }, [isOpen, userId]);

  const handleChange = (e) => {
    setUserData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLimitChange = (key, value) => {
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

  const handleRoleChange = (values) => {
    setSelectedRoleIds(values); // values adalah array of string IDs
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userData) return;

    setIsSaving(true);
    setError("");

    const payload = {
      nama_lengkap: userData.nama_lengkap,
      phone_number: userData.phone_number,
      institution: userData.institution,
      role_ids: selectedRoleIds.map(Number), // Kirim array of number IDs
      assessment_limits: userData.assessment_limits,
    };

    try {
      const response = await apiClient.put(`/admin/users/${userId}`, payload); // Panggil endpoint update admin
      onSaveSuccess(response.data.user); // Kirim data user yang sudah diupdate ke parent
      onClose(); // Tutup modal
    } catch (err) {
      console.error("Gagal menyimpan user:", err);
      setError(err.response?.data?.msg || "Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  let modalContent;
  if (isLoading) {
    modalContent = (
      <Flex justifyContent="center" alignItems="center" className="space-x-2 py-10">
        <Icon icon={FiLoader} className="animate-spin" size="md" />
        <Text>Memuat data pengguna...</Text>
      </Flex>
    );
  } else if (error) {
    modalContent = <Text className="my-6 text-red-600 text-center">{error}</Text>;
  } else if (userData && userData.id) {
    modalContent = (
      // === TAMBAHKAN ID DI SINI ===
      <form onSubmit={handleSave} id="edit-user-form">
        {/* === AKHIR TAMBAHAN === */}
        <Grid numItemsMd={2} className="gap-6 mt-6">
          {/* ... Isi Grid (Card Info, Card Roles, Card Limits) ... */}
          <div className="space-y-6">
            <Card decoration="left" decorationColor="blue">
              {/* ... Isi Card Info ... */}
              <Flex alignItems="center" className="space-x-2 mb-3">
                <Icon icon={FiUser} variant="light" color="blue" />
                <Subtitle>Informasi Pengguna</Subtitle>
              </Flex>
              <div className="space-y-4">
                <div>
                  <label className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Nama Lengkap *</label>
                  <TextInput name="nama_lengkap" value={userData.nama_lengkap ?? ""} onChange={handleChange} required className="mt-1" />
                </div>
                <div>
                  <label className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Email (tidak bisa diubah)</label>
                  <TextInput icon={FiMail} name="email" value={userData.email ?? ""} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Nomor Telepon</label>
                  <TextInput icon={FiPhone} name="phone_number" value={userData.phone_number ?? ""} onChange={handleChange} placeholder="08xxxxxxxxxx" className="mt-1" />
                </div>
                <div>
                  <label className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Institusi</label>
                  <TextInput icon={FiHome} name="institution" value={userData.institution ?? ""} onChange={handleChange} placeholder="Nama PT / Universitas..." className="mt-1" />
                </div>
              </div>
            </Card>
            <Card decoration="left" decorationColor="indigo">
              {/* ... Isi Card Roles ... */}
              <Flex alignItems="center" className="space-x-2 mb-3">
                <Icon icon={FiKey} variant="light" color="indigo" />
                <Subtitle>Roles</Subtitle>
              </Flex>
              <MultiSelect value={selectedRoleIds} onValueChange={handleRoleChange} placeholder="Pilih satu atau lebih role..." required>
                {allRoles.map((role) => (
                  <MultiSelectItem key={role.id} value={String(role.id)}>
                    {role.name} {role.description && <span className="text-xs text-tremor-content italic ml-1">{`(${role.description})`}</span>}
                  </MultiSelectItem>
                ))}
              </MultiSelect>
            </Card>
          </div>
          <Card decoration="left" decorationColor="amber">
            {/* ... Isi Card Limits ... */}
            <Flex alignItems="center" className="space-x-2 mb-3">
              <Icon icon={FiInfo} variant="light" color="amber" />
              <Subtitle>Batas Assessment</Subtitle>
            </Flex>
            <Table className="mt-2 [&>table]:table-fixed">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Tipe</TableHeaderCell>
                  <TableHeaderCell className="text-right w-1/4">Penggunaan</TableHeaderCell>
                  <TableHeaderCell className="text-right w-1/3">Batas Maksimum</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {["dasar", "madya", "ai"].map((key) => {
                  const value = userData.assessment_limits?.[key] || { count: 0, limit: null };
                  return (
                    <TableRow key={key}>
                      <TableCell className="capitalize font-medium text-tremor-content-strong">{key}</TableCell>
                      <TableCell className="text-right text-tremor-content">{value.count}</TableCell>
                      <TableCell className="text-right">
                        <NumberInput className="max-w-[100px] ml-auto [&_input]:text-right" value={value.limit ?? ""} onValueChange={(val) => handleLimitChange(key, val)} enableStepper={false} placeholder="∞" min={0} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Text className="mt-4 text-xs text-tremor-content-emphasis">Admin dapat mengubah Batas Maksimum. Kosongkan untuk tanpa batas (unlimited).</Text>
          </Card>
        </Grid>
        {/* Tombol Aksi TIDAK PERLU di dalam form ini lagi */}
      </form>
    );
  } else {
    modalContent = <Text className="my-6 text-center text-gray-500">Gagal memuat data pengguna atau pengguna tidak ditemukan.</Text>;
  }

  return (
    <Dialog open={isOpen} onClose={() => !isSaving && onClose()} static={true} className="z-50">
      <DialogPanel className="max-w-7xl p-0 overflow-hidden">
        <Flex alignItems="center" justifyContent="between" className="p-5 border-b border-tremor-border bg-tremor-background-muted dark:bg-dark-tremor-background-muted">
          <Flex alignItems="center" className="space-x-3">
            <Icon icon={FiEdit} size="md" variant="light" color="blue" />
            <Title>Edit User: {userData?.email || (isLoading ? "Memuat..." : "Error")}</Title>
          </Flex>
          <Button icon={FiX} variant="light" color="gray" onClick={onClose} disabled={isSaving} />
        </Flex>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{modalContent}</div>

        {/* --- Footer Modal (Tombol Aksi) --- */}
        {!isLoading &&
          userData &&
          userData.id && ( // Tampilkan footer hanya jika form tampil
            <div className="p-5 border-t border-tremor-border bg-tremor-background-muted dark:bg-dark-tremor-background-muted">
              <Flex justifyContent="end" className="gap-2">
                <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                  Batal
                </Button>
                {/* === TAMBAHKAN form="id-form" DI SINI === */}
                <Button type="submit" form="edit-user-form" loading={isSaving} disabled={isSaving || isLoading}>
                  Simpan Perubahan
                </Button>
                {/* === AKHIR TAMBAHAN === */}
              </Flex>
            </div>
          )}
      </DialogPanel>
    </Dialog>
  );
}

// Tambahkan id ke form agar tombol submit di luar form bisa trigger
EditUserModal.defaultProps = {
  allRoles: [], // Default props untuk allRoles
};

export default EditUserModal;
