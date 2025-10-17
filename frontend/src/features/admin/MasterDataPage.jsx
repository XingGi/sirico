import React, { useState, useEffect } from "react";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Button, TextInput, Dialog, DialogPanel, Subtitle, Select, SelectItem } from "@tremor/react";
import apiClient from "../../api/api";
import { FiTrash2, FiPlus, FiEdit2 } from "react-icons/fi";

// Komponen Form untuk Tambah Item Baru (tidak berubah)
function AddItemForm({ category, onSave }) {
  const [item, setItem] = useState({ key: "", value: "" });
  const handleInputChange = (e) => setItem({ ...item, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(category, item);
    setItem({ key: "", value: "" });
  };
  return (
    <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2">
      <div className="flex-grow">
        <label className="text-xs text-gray-500">Key</label>
        <TextInput name="key" value={item.key} onChange={handleInputChange} required />
      </div>
      <div className="flex-grow">
        <label className="text-xs text-gray-500">Value</label>
        <TextInput name="value" value={item.value} onChange={handleInputChange} required />
      </div>
      <Button type="submit" icon={FiPlus} size="sm">
        Tambah
      </Button>
    </form>
  );
}

function MasterDataPage() {
  const [masterData, setMasterData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // === PERUBAHAN 1: Definisikan urutan yang diinginkan ===
  const categoryOrder = ["INDUSTRY", "COMPANY_TYPE", "COMPANY_ASSETS", "CURRENCY"];

  const fetchData = () => {
    setIsLoading(true);
    apiClient
      .get("/admin/master-data")
      .then((response) => setMasterData(response.data))
      .catch((error) => console.error("Gagal memuat master data", error))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ... (Semua fungsi handler tidak ada perubahan)
  const handleDelete = (id) => {
    if (window.confirm("Anda yakin?")) {
      apiClient.delete(`/admin/master-data/${id}`).then(fetchData);
    }
  };
  const handleAddItem = (category, newItem) => {
    apiClient.post("/admin/master-data", { ...newItem, category }).then(fetchData);
  };
  const handleOpenEditModal = (item) => {
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };
  const handleUpdateItem = (e) => {
    e.preventDefault();
    apiClient.put(`/admin/master-data/${editingItem.id}`, editingItem).then(() => {
      setIsEditModalOpen(false);
      setEditingItem(null);
      fetchData();
    });
  };

  if (isLoading) return <Text className="p-6">Memuat data...</Text>;

  return (
    <div className="p-6 sm:p-10">
      <Title>Manage Master Data</Title>
      <Text>Kelola pilihan untuk dropdown di seluruh aplikasi.</Text>

      {/* Kita tidak akan membuat form tambah terpisah lagi, agar lebih rapi */}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* === PERUBAHAN 2: Gunakan array 'categoryOrder' untuk me-render Card === */}
        {categoryOrder.map(
          (category) =>
            // Pastikan kategori tersebut ada di data sebelum me-render Card-nya
            masterData[category] && (
              <Card key={category} className="rounded-xl shadow-lg">
                <Title>{category}</Title>
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Key</TableHeaderCell>
                      <TableHeaderCell>Value</TableHeaderCell>
                      <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {masterData[category].map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.key}</TableCell>
                        <TableCell>{item.value}</TableCell>
                        <TableCell className="text-right">
                          <Button icon={FiEdit2} variant="light" size="sm" color="blue" onClick={() => handleOpenEditModal(item)} />
                          <Button icon={FiTrash2} variant="light" size="sm" color="red" onClick={() => handleDelete(item.id)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-6 border-t pt-4">
                  <AddItemForm category={category} onSave={handleAddItem} />
                </div>
              </Card>
            )
        )}
      </div>

      {/* Modal untuk Edit Item (Tidak Berubah) */}
      {editingItem && (
        <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} static={true}>
          <DialogPanel>
            <Title>Edit Item</Title>
            <form onSubmit={handleUpdateItem} className="mt-4 space-y-4">
              <div>
                <label>Key</label>
                <TextInput name="key" value={editingItem.key} onChange={(e) => setEditingItem({ ...editingItem, key: e.target.value })} required />
              </div>
              <div>
                <label>Value</label>
                <TextInput name="value" value={editingItem.value} onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </DialogPanel>
        </Dialog>
      )}
    </div>
  );
}

export default MasterDataPage;
