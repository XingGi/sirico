// frontend/src/features/admin/components/AddUserModal.jsx

import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, Text, TextInput, Button, Grid, Subtitle, MultiSelect, MultiSelectItem, Flex, Icon, Divider, Select, SelectItem } from "@tremor/react";
import { FiUser, FiMail, FiPhone, FiHome, FiSave, FiX, FiKey, FiLock, FiBriefcase } from "react-icons/fi";
import apiClient from "../../../api/api";
import { toast } from "sonner";

const fetchDepartmentsByInstitution = async (institution, setDepartments, setIsLoading) => {
  if (!institution) {
    setDepartments([]);
    return;
  }
  setIsLoading(true);
  try {
    const { data } = await apiClient.get(`/admin/departments-list?institution=${encodeURIComponent(institution)}`);
    setDepartments(data);
  } catch (err) {
    console.error("Gagal mengambil departemen:", err);
    toast.error("Gagal mengambil daftar departemen.");
    setDepartments([]);
  }
  setIsLoading(false);
};

function AddUserModal({ isOpen, onClose, allRoles, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
    institution: "",
    department_id: "",
  });
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

  useEffect(() => {
    fetchDepartmentsByInstitution(formData.institution, setDepartments, setIsLoadingDepts);
  }, [formData.institution, isOpen]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (value, name) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (values) => {
    setSelectedRoleIds(values);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (selectedRoleIds.length === 0) {
      setError("Minimal satu role harus dipilih.");
      return;
    }

    setIsSaving(true);

    const payload = {
      nama_lengkap: formData.nama_lengkap,
      email: formData.email,
      password: formData.password,
      phone_number: formData.phone_number || null,
      institution: formData.institution || null,
      role_ids: selectedRoleIds.map(Number),
      department_id: formData.department_id ? Number(formData.department_id) : null,
      // Limit akan menggunakan default di backend
    };

    try {
      const response = await apiClient.post("/admin/users", payload); // Panggil endpoint POST baru
      onSaveSuccess(response.data.user); // Kirim data user baru ke parent
      handleClose(); // Tutup dan reset
    } catch (err) {
      console.error("Gagal menambah user:", err);
      setError(err.response?.data?.msg || "Gagal menyimpan user.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form saat ditutup
    setFormData({
      nama_lengkap: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone_number: "",
      institution: "",
      department_id: "",
    });
    setSelectedRoleIds([]);
    setDepartments([]);
    setError("");
  };

  return (
    <Dialog open={isOpen} onClose={() => !isSaving && handleClose()} static={true} className="z-50">
      <DialogPanel className="max-w-2xl p-0 overflow-hidden">
        {/* Header Modal */}
        <Flex alignItems="center" justifyContent="between" className="p-5 border-b border-tremor-border bg-tremor-background-muted">
          <Flex alignItems="center" className="space-x-3">
            <Icon icon={FiUser} size="md" variant="light" color="blue" />
            <Title>Tambah User Baru</Title>
          </Flex>
          <Button icon={FiX} variant="light" color="gray" onClick={handleClose} disabled={isSaving} />
        </Flex>

        {/* Konten Form */}
        <form onSubmit={handleSave} id="add-user-form">
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {error && <Text className="text-red-600 text-center">{error}</Text>}

            {/* Info Pengguna */}
            <div className="space-y-4">
              <Subtitle>Informasi Pengguna</Subtitle>
              <Grid numItemsMd={2} className="gap-4">
                <div>
                  <label>Nama Lengkap *</label>
                  <TextInput name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} required />
                </div>
                <div>
                  <label>Email *</label>
                  <TextInput icon={FiMail} name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div>
                  <label>Nomor Telepon</label>
                  <TextInput icon={FiPhone} name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <label>Institusi</label>
                  <TextInput icon={FiHome} name="institution" value={formData.institution} onChange={handleChange} placeholder="Nama PT / Universitas..." />
                </div>
                <div>
                  <label>Departemen</label>
                  <Select icon={FiBriefcase} value={formData.department_id} onValueChange={(value) => handleSelectChange(value, "department_id")} placeholder="Pilih Departemen..." disabled={!formData.institution || isLoadingDepts}>
                    {isLoadingDepts && (
                      <SelectItem value="" disabled>
                        Memuat...
                      </SelectItem>
                    )}
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </Grid>
            </div>

            <Divider />

            {/* Password */}
            <div className="space-y-4">
              <Subtitle>Password</Subtitle>
              <Grid numItemsMd={2} className="gap-4">
                <div>
                  <label>Password Baru *</label>
                  <TextInput icon={FiLock} name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Minimal 8 karakter" />
                </div>
                <div>
                  <label>Konfirmasi Password Baru *</label>
                  <TextInput
                    icon={FiLock}
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Ketik ulang password"
                    error={formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword}
                    errorMessage="Password tidak cocok"
                  />
                </div>
              </Grid>
            </div>

            <Divider />

            {/* Roles */}
            <div className="space-y-2">
              <Flex alignItems="center" className="space-x-2 w-fit">
                <Icon icon={FiKey} variant="light" color="gray" size="sm" />
                <Subtitle>Roles *</Subtitle>
              </Flex>
              <MultiSelect value={selectedRoleIds} onValueChange={handleRoleChange} placeholder="Pilih satu atau lebih role..." required>
                {allRoles.map((role) => (
                  <MultiSelectItem key={role.id} value={String(role.id)}>
                    {role.name} {role.description && `(${role.description})`}
                  </MultiSelectItem>
                ))}
              </MultiSelect>
            </div>
          </div>

          {/* Footer Modal (Tombol Aksi) */}
          <div className="p-5 border-t border-tremor-border bg-tremor-background-muted">
            <Flex justifyContent="end" className="gap-2">
              <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
                Batal
              </Button>
              <Button type="submit" form="add-user-form" loading={isSaving} disabled={isSaving}>
                Simpan User
              </Button>
            </Flex>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}

export default AddUserModal;
