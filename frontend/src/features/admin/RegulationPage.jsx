// frontend/src/pages/admin/RegulationPage.jsx

import React, { useState, useEffect } from "react";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Button, TextInput, Textarea, Subtitle } from "@tremor/react";
import apiClient from "../../api/api";
import { FiTrash2, FiPlus, FiEye } from "react-icons/fi";

function RegulationPage() {
  const [regulations, setRegulations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk form tambah baru
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFile, setNewFile] = useState(null);

  const fetchData = () => {
    setIsLoading(true);
    apiClient
      .get("/admin/regulations")
      .then((response) => setRegulations(response.data))
      .catch((error) => console.error("Gagal memuat data regulasi", error))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    setNewFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newName);
    formData.append("description", newDescription);
    formData.append("file", newFile);

    apiClient
      .post("/admin/regulations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        alert("Regulasi berhasil ditambahkan.");
        // Reset form
        setNewName("");
        setNewDescription("");
        setNewFile(null);
        document.getElementById("file-input").value = ""; // Reset input file
        fetchData(); // Muat ulang data
      })
      .catch((error) => alert("Gagal menambah regulasi: " + (error.response?.data?.msg || "Error")));
  };

  const handleDelete = (id) => {
    if (window.confirm("Anda yakin ingin menghapus regulasi ini?")) {
      apiClient.delete(`/admin/regulations/${id}`).then(() => fetchData());
    }
  };

  const handlePreview = (filename) => {
    // URL ke folder uploads di backend Flask
    const fileUrl = `http://127.0.0.1:5000/uploads/${filename}`;
    window.open(fileUrl, "_blank");
  };

  return (
    <div className="p-6 sm:p-10">
      <Title>Manage Master Regulasi</Title>
      <Text>Unggah, lihat, dan hapus dokumen regulasi.</Text>

      <Card className="mt-6 rounded-xl shadow-lg">
        <Subtitle>Unggah Regulasi Baru</Subtitle>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label>Nama Regulasi *</label>
            <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <div>
            <label>Deskripsi</label>
            <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
          </div>
          <div>
            <label>File Dokumen (PDF, DOCX, dll) *</label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" icon={FiPlus}>
              Simpan Regulasi
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-6 rounded-xl shadow-lg">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nama Regulasi</TableHeaderCell>
              <TableHeaderCell>Deskripsi</TableHeaderCell>
              <TableHeaderCell>File</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Memuat...
                </TableCell>
              </TableRow>
            ) : (
              regulations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{reg.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{reg.description}</TableCell>
                  <TableCell>{reg.filename}</TableCell>
                  <TableCell className="text-right">
                    <Button icon={FiEye} variant="light" color="gray" onClick={() => handlePreview(reg.filename)} disabled={!reg.filename} />
                    <Button icon={FiTrash2} variant="light" color="red" onClick={() => handleDelete(reg.id)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default RegulationPage;
