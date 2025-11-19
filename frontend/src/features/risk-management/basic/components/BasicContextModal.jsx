import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, Textarea, Button } from "@tremor/react";

export default function BasicContextModal({ isOpen, onClose, onSave, initialData }) {
  const [contextData, setContextData] = useState({ external: "", internal: "" });

  useEffect(() => {
    if (isOpen) {
      // Jika ada initialData (mode edit), pakai itu. Jika tidak, reset.
      setContextData(initialData || { external: "", internal: "" });
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    setContextData({ ...contextData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!contextData.external || !contextData.internal) {
      alert("Konteks tidak boleh kosong.");
      return;
    }
    onSave(contextData);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <DialogPanel>
        <Title>{initialData ? "Edit" : "Tambah"} Konteks Organisasi</Title>
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Konteks Eksternal</label>
            <Textarea name="external" value={contextData.external} onChange={handleChange} rows={4} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Konteks Internal</label>
            <Textarea name="internal" value={contextData.internal} onChange={handleChange} rows={4} className="mt-1" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSave}>OK</Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
