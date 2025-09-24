import React, { useState } from "react";
import apiClient from "../api";
import { useNavigate } from "react-router-dom";
import { Card, Title, Text, Button, TextInput, Textarea, ProgressBar } from "@tremor/react";

function CreateAssessmentForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama_asesmen: "",
    deskripsi: "",
    ruang_lingkup: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/assessments", formData);
      alert("Asesmen berhasil dibuat!");
      // Arahkan ke halaman detail asesmen atau kembali ke daftar
      navigate("/dashboard"); // Untuk sementara kembali ke dasbor
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || "Gagal membuat asesmen."));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Langkah 1: Informasi Dasar</h3>
            <div className="mb-4">
              <label htmlFor="nama_asesmen" className="block text-sm font-bold mb-2">
                Nama Asesmen
              </label>
              <input type="text" name="nama_asesmen" value={formData.nama_asesmen} onChange={handleChange} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-4">
              <label htmlFor="deskripsi" className="block text-sm font-bold mb-2">
                Deskripsi Singkat
              </label>
              <textarea name="deskripsi" value={formData.deskripsi} onChange={handleChange} className="w-full p-2 border rounded" rows="3"></textarea>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Langkah 2: Ruang Lingkup & Jadwal</h3>
            <div className="mb-4">
              <label htmlFor="ruang_lingkup" className="block text-sm font-bold mb-2">
                Ruang Lingkup
              </label>
              <textarea name="ruang_lingkup" value={formData.ruang_lingkup} onChange={handleChange} className="w-full p-2 border rounded" rows="3"></textarea>
            </div>
            <div className="flex space-x-4">
              <div className="w-1/2">
                <label htmlFor="tanggal_mulai" className="block text-sm font-bold mb-2">
                  Tanggal Mulai
                </label>
                <input type="date" name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleChange} className="w-full p-2 border rounded" required />
              </div>
              <div className="w-1/2">
                <label htmlFor="tanggal_selesai" className="block text-sm font-bold mb-2">
                  Tanggal Selesai (Opsional)
                </label>
                <input type="date" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Langkah 3: Konfirmasi</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Nama:</strong> {formData.nama_asesmen}
              </li>
              <li>
                <strong>Deskripsi:</strong> {formData.deskripsi}
              </li>
              <li>
                <strong>Ruang Lingkup:</strong> {formData.ruang_lingkup}
              </li>
              <li>
                <strong>Mulai:</strong> {formData.tanggal_mulai}
              </li>
              <li>
                <strong>Selesai:</strong> {formData.tanggal_selesai || "-"}
              </li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-white shadow-md rounded-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2">Buat Asesmen Risiko Baru</h2>
      <p className="text-center text-gray-500 mb-6">Langkah {step} dari 3</p>
      <form onSubmit={handleSubmit}>
        {renderStep()}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Kembali
            </button>
          )}
          {step < 3 && (
            <button type="button" onClick={nextStep} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto">
              Lanjut
            </button>
          )}
          {step === 3 && (
            <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-auto">
              Simpan Asesmen
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}

export default CreateAssessmentForm;
