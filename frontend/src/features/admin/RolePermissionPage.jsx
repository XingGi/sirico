// frontend/src/features/admin/RolePermissionPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Title,
  Text,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  Dialog,
  DialogPanel,
  TextInput,
  Textarea,
  MultiSelect,
  MultiSelectItem,
  Badge,
  Accordion,
  AccordionHeader,
  AccordionBody, // Tambahkan Accordion
} from "@tremor/react";
import apiClient from "../../api/api";
import { FiPlus, FiEdit2, FiTrash2, FiKey, FiLock, FiShield, FiAlertTriangle, FiChevronDown, FiLoader } from "react-icons/fi"; // Tambahkan ikon

// --- Komponen Baru: Confirmation Dialog ---
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, isLoading = false }) => (
  <Dialog open={isOpen} onClose={() => !isLoading && onClose()} static={true}>
    <DialogPanel>
      <div className="text-center">
        <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <Title>{title}</Title>
        <Text className="mt-2">{message}</Text>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Batal
        </Button>
        <Button color="red" onClick={onConfirm} loading={isLoading} disabled={isLoading}>
          Hapus
        </Button>
      </div>
    </DialogPanel>
  </Dialog>
);
// --- Akhir Komponen Baru ---

// --- Helper untuk Mengelompokkan Permissions ---
const groupPermissions = (permissions) => {
  const groups = {
    Dashboard: [],
    "Risk Management AI": [],
    "Risk Management Levels": [],
    "Modul RSCA": [],
    "Modul BPR": [],
    "Modul BIA": [],
    "Admin Area": [],
    Lainnya: [], // Fallback
  };

  const categoryMap = {
    dashboard: "Dashboard",
    risk_assessment_ai: "Risk Management AI",
    risk_register_main: "Risk Management AI",
    risk_dasar: "Risk Management Levels",
    risk_madya: "Risk Management Levels",
    risk_templates: "Risk Management Levels",
    rsca: "Modul RSCA",
    bpr: "Modul BPR",
    bia: "Modul BIA",
    critical_assets: "Modul BIA", // Kaitkan dengan BIA
    admin_area: "Admin Area",
    users: "Admin Area",
    roles: "Admin Area",
    master_data: "Admin Area",
    regulations: "Admin Area",
    rsca_cycles: "Admin Area", // Admin task for RSCA
  };

  permissions.forEach((perm) => {
    let assigned = false;
    for (const key in categoryMap) {
      // Cek jika nama permission mengandung keyword kategori
      if (perm.name.includes(key)) {
        groups[categoryMap[key]].push(perm);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      groups["Lainnya"].push(perm);
    }
  });

  // Hapus grup kosong
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    } else {
      // Urutkan permission dalam grup berdasarkan nama
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  return groups;
};
// --- Akhir Helper ---

function RolePermissionPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading data awal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", permission_ids: [] });
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading untuk submit modal
  const [deletingRoleId, setDeletingRoleId] = useState(null); // Loading untuk tombol hapus per baris
  const [confirmation, setConfirmation] = useState({ isOpen: false, roleId: null, roleName: "" }); // State untuk confirmation dialog

  const fetchData = async () => {
    // setIsLoading(true); // Tidak perlu set true lagi jika hanya refresh
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        apiClient.get("/admin/roles"), // Pastikan URL benar
        apiClient.get("/admin/permissions"), // Pastikan URL benar
      ]);
      setRoles(rolesRes.data);
      setPermissions(permissionsRes.data);
    } catch (error) {
      console.error("Gagal memuat data roles/permissions:", error);
      alert("Gagal memuat data. Coba refresh halaman."); // Beri tahu user
    } finally {
      setIsLoading(false); // Selalu set false di akhir
      setDeletingRoleId(null); // Reset loading delete
    }
  };

  useEffect(() => {
    setIsLoading(true); // Set loading true hanya saat load awal
    fetchData();
  }, []);

  // Kelompokkan permissions menggunakan useMemo
  const groupedPermissions = useMemo(() => groupPermissions(permissions), [permissions]);

  const handleOpenModal = (role = null) => {
    setModalError("");
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || "",
        permission_ids: role.permission_ids.map(String),
      });
    } else {
      setEditingRole(null);
      setFormData({ name: "", description: "", permission_ids: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return; // Jangan tutup jika sedang submit
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({ name: "", description: "", permission_ids: [] });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (values) => {
    setFormData((prev) => ({ ...prev, permission_ids: values }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    setIsSubmitting(true); // Aktifkan loading submit

    const payload = {
      ...formData,
      permission_ids: formData.permission_ids.map(Number),
    };

    try {
      if (editingRole) {
        await apiClient.put(`/admin/roles/${editingRole.id}`, payload); // Pastikan URL benar
      } else {
        await apiClient.post("/admin/roles", payload); // Pastikan URL benar
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      setModalError(error.response?.data?.msg || `Gagal ${editingRole ? "memperbarui" : "menyimpan"} role.`);
    } finally {
      setIsSubmitting(false); // Matikan loading submit
    }
  };

  // --- Modifikasi: Buka Confirmation Dialog ---
  const handleDeleteRole = (roleId, roleName) => {
    setConfirmation({ isOpen: true, roleId, roleName });
  };

  // --- Modifikasi: Aksi saat konfirmasi ---
  const confirmDeleteRole = async () => {
    if (!confirmation.roleId) return;
    setDeletingRoleId(confirmation.roleId); // Aktifkan loading delete
    setConfirmation((prev) => ({ ...prev, isOpen: false })); // Tutup dialog dulu

    try {
      await apiClient.delete(`/admin/roles/${confirmation.roleId}`); // Pastikan URL benar
      fetchData(); // Refresh data (akan mematikan loading delete di fetchData)
    } catch (error) {
      alert(error.response?.data?.msg || "Gagal menghapus role.");
      setDeletingRoleId(null); // Matikan loading jika gagal
    } finally {
      // Reset confirmation state
      setConfirmation({ isOpen: false, roleId: null, roleName: "" });
    }
  };
  // --- Akhir Modifikasi ---

  if (isLoading) {
    // Tampilkan loading hanya saat fetch data awal
    return <Text className="p-6">Memuat Roles & Permissions...</Text>;
  }

  return (
    <>
      {" "}
      {/* Tambah Fragment */}
      <div className="p-6 sm:p-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FiKey className="w-7 h-7 text-gray-500" /> {/* Ikon Judul */}
            <Title>Role & Permission Management</Title>
          </div>
          <Button icon={FiPlus} onClick={() => handleOpenModal()}>
            Tambah Role Baru
          </Button>
        </div>
        <Text className="mt-2 ml-10">
          {" "}
          {/* Tambah margin kiri */}
          Kelola peran pengguna dan hak akses spesifik untuk setiap fitur dalam aplikasi.
        </Text>

        <Card className="mt-6">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Nama Role</TableHeaderCell>
                <TableHeaderCell>Deskripsi</TableHeaderCell>
                <TableHeaderCell>Permissions</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => {
                const isAdminRole = role.name.toLowerCase() === "admin";
                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      {role.name}
                      {isAdminRole && (
                        <Badge color="red" icon={FiShield} className="ml-2">
                          Admin
                        </Badge>
                      )}{" "}
                      {/* Badge Admin */}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{role.description || "-"}</TableCell>
                    <TableCell>
                      <Badge color={isAdminRole ? "red" : "blue"} size="sm">
                        {isAdminRole ? "All" : `${role.permission_ids.length}`} permissions
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="xs" // Perkecil tombol
                        icon={FiEdit2}
                        variant="light"
                        color="blue"
                        onClick={() => handleOpenModal(role)}
                        disabled={isAdminRole} // Disable edit untuk Admin
                        tooltip="Edit Role" // Tooltip
                      />
                      <Button
                        size="xs" // Perkecil tombol
                        icon={FiTrash2}
                        variant="light"
                        color="red"
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        disabled={isAdminRole || deletingRoleId === role.id} // Disable delete untuk Admin & saat loading
                        loading={deletingRoleId === role.id} // Loading spesifik
                        tooltip="Hapus Role" // Tooltip
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* --- Modal Tambah/Edit dengan Accordion --- */}
        <Dialog open={isModalOpen} onClose={handleCloseModal} static={true}>
          <DialogPanel className="max-w-3xl s">
            {" "}
            {/* Perbesar modal sedikit */}
            <Title>{editingRole ? `Edit Role: ${editingRole.name}` : "Tambah Role Baru"}</Title>
            {modalError && <Text className="text-red-500 mt-2">{modalError}</Text>}
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2 pl-2">
              <div>
                <label>Nama Role *</label>
                <TextInput name="name" value={formData.name} onChange={handleFormChange} required disabled={editingRole && editingRole.name.toLowerCase() === "admin"} placeholder="e.g., Risk Officer, Auditor" />
              </div>
              <div>
                <label>Deskripsi</label>
                <Textarea name="description" value={formData.description} onChange={handleFormChange} rows={2} placeholder="Penjelasan singkat tentang role ini" />
              </div>
              <div className="pt-2">
                <label className="font-medium text-tremor-content-strong">Permissions *</label>
                <Text className="mb-2">Pilih hak akses yang akan diberikan untuk role ini.</Text>
                {/* Accordion untuk mengelompokkan permission */}
                <div className="border rounded-md">
                  {Object.entries(groupedPermissions).map(([groupName, perms]) => (
                    <Accordion key={groupName}>
                      <AccordionHeader className="text-sm font-medium">
                        <div className="flex justify-between w-full items-center">
                          <span>
                            {groupName} ({perms.length})
                          </span>
                          {/* Indikator jumlah terpilih per grup (Opsional) */}
                          <Badge size="xs" color="gray">
                            {formData.permission_ids.filter((id) => perms.some((p) => String(p.id) === id)).length} selected
                          </Badge>
                        </div>
                      </AccordionHeader>
                      <AccordionBody className="pl-4 pr-2 py-2">
                        {/* Tetap pakai MultiSelect di dalam, tapi hanya untuk grup ini */}
                        <MultiSelect
                          value={formData.permission_ids.filter((id) => perms.some((p) => String(p.id) === id))} // Hanya tampilkan yg terpilih di grup ini
                          onValueChange={(selectedInGroup) => {
                            // Gabungkan yang terpilih di grup ini dengan yang sudah terpilih di grup lain
                            const otherGroupIds = formData.permission_ids.filter((id) => !perms.some((p) => String(p.id) === id));
                            handlePermissionChange([...otherGroupIds, ...selectedInGroup]);
                          }}
                        >
                          {perms.map((perm) => (
                            <MultiSelectItem key={perm.id} value={String(perm.id)}>
                              {perm.name}
                              {perm.description && <span className="block text-xs text-gray-500">{perm.description}</span>}
                            </MultiSelectItem>
                          ))}
                        </MultiSelect>
                      </AccordionBody>
                    </Accordion>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                {" "}
                {/* Beri border atas */}
                <Button variant="secondary" onClick={handleCloseModal} type="button" disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                  {editingRole ? "Update Role" : "Simpan Role"}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </Dialog>
        {/* --- Akhir Modal --- */}
      </div>
      {/* --- Confirmation Dialog --- */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, roleId: null, roleName: "" })}
        onConfirm={confirmDeleteRole}
        title="Konfirmasi Hapus Role"
        message={`Apakah Anda yakin ingin menghapus role "${confirmation.roleName}"?`}
        isLoading={deletingRoleId === confirmation.roleId}
      />
      {/* --- Akhir Confirmation Dialog --- */}
    </>
  );
}

export default RolePermissionPage;
