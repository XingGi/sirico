import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, Button, TextInput } from "@tremor/react";

function AddEditDepartmentModal({ isOpen, onClose, onSave, department, isLoading }) {
  const [name, setName] = useState("");

  // Efek untuk mengisi form saat mode 'Edit'
  useEffect(() => {
    if (department) {
      setName(department.name);
    } else {
      setName(""); // Reset saat mode 'Tambah'
    }
  }, [department, isOpen]); // Reset saat modal dibuka

  const handleSubmit = () => {
    const data = { name };
    if (department) {
      data.id = department.id; // Sertakan ID untuk update
    }
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <DialogPanel>
        <Title className="mb-4">{department ? "Edit Departemen" : "Tambah Departemen Baru"}</Title>
        <TextInput placeholder="Nama Departemen (cth: Keuangan, IT)" value={name} onValueChange={setName} disabled={isLoading} />
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            {department ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

export default AddEditDepartmentModal;
