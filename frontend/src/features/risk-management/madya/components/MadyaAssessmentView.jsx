// frontend/src/features/risk-management/madya/components/MadyaAssessmentView.jsx
import React from "react";
import { Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Card, Grid, Badge } from "@tremor/react";
import StrukturOrganisasiTable from "./StrukturOrganisasiTable";
import RiskMapCard from "./RiskMapCard";
import apiClient from "../../../../api/api";

// Helper format (jika belum ada, salin dari BasicAssessmentView atau Form)
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

const getCellColor = (score) => {
  if (score === null || score === undefined) return "bg-gray-200 text-gray-500";
  if (score >= 20) return "bg-red-600 text-white";
  if (score >= 16) return "bg-orange-500 text-white";
  if (score >= 12) return "bg-yellow-400 text-black";
  if (score >= 6) return "bg-lime-400 text-black";
  if (score >= 1) return "bg-green-500 text-white";
  return "bg-gray-200 text-gray-500";
};

const riskLevelMapSimple = {
  R: "bg-green-500 text-white",
  L: "bg-lime-400 text-black",
  M: "bg-yellow-400 text-black",
  H: "bg-orange-500 text-white",
  E: "bg-red-600 text-white",
};

function MadyaAssessmentView({ assessmentData, templateData, riskInputEntries }) {
  if (!assessmentData) return <Text>Data asesmen tidak tersedia.</Text>;

  const API_BASE_URL_FOR_IMAGE = apiClient.defaults.baseURL; // Ambil baseURL (misal: http://127.0.0.1:5000/api)
  const imageUrlFull = assessmentData.structure_image_url
    ? `${API_BASE_URL_FOR_IMAGE.replace("/api", "")}${assessmentData.structure_image_url.startsWith("/") ? "" : "/"}${assessmentData.structure_image_url}` // Hapus /api, tambahkan path relatif
    : null;
  // const imageUrlFull = assessmentData.structure_image_url || null;

  return (
    <div className="space-y-6 m-1">
      <Card>
        <Title as="h2">Informasi Asesmen</Title>
        <Grid numItemsMd={2} className="gap-4 mt-4">
          <div>
            <Text>Nama Asesmen:</Text>
            <Text className="font-semibold">{assessmentData.nama_asesmen}</Text>
          </div>
          <div>
            <Text>ID Asesmen:</Text>
            <Text className="font-semibold">#{assessmentData.id}</Text>
          </div>
          <div>
            <Text>Dibuat Tanggal:</Text>
            <Text className="font-semibold">{new Date(assessmentData.created_at).toLocaleDateString("id-ID")}</Text>
          </div>
          <div>
            <Text>Template Peta Risiko:</Text>
            <Text className="font-semibold">{templateData?.name || "N/A"}</Text>
          </div>
          {assessmentData.filter_organisasi && (
            <div>
              <Text>Filter Organisasi:</Text>
              <Text className="font-semibold">{assessmentData.filter_organisasi}</Text>
            </div>
          )}
          {assessmentData.filter_direktorat && (
            <div>
              <Text>Filter Direktorat:</Text>
              <Text className="font-semibold">{assessmentData.filter_direktorat}</Text>
            </div>
          )}
          {assessmentData.filter_divisi && (
            <div>
              <Text>Filter Divisi:</Text>
              <Text className="font-semibold">{assessmentData.filter_divisi}</Text>
            </div>
          )}
          {assessmentData.filter_departemen && (
            <div>
              <Text>Filter Departemen:</Text>
              <Text className="font-semibold">{assessmentData.filter_departemen}</Text>
            </div>
          )}
        </Grid>
      </Card>

      {/* Card 1: Struktur Organisasi */}
      <Card>
        <Title as="h3">1. Struktur Organisasi</Title>
        {imageUrlFull && (
          <div className="mt-4">
            <img src={imageUrlFull} alt="Struktur Organisasi" className="max-w-xs max-h-48 object-contain rounded border mb-2" />
          </div>
        )}
        <div className="mt-4">
          <StrukturOrganisasiTable data={assessmentData.structure_entries || []} onEdit={null} onDelete={null} readOnly={true} />
        </div>
      </Card>

      <Card>
        <Title as="h3">3. Sasaran Organisasi / KPI dan Risk Appetite</Title>
        <Text>Sasaran/KPI yang didefinisikan dan toleransi risikonya.</Text>
        <Table className="mt-4">
          <TableHead>
            <TableRow className="bg-gray-100">
              <TableHeaderCell className="w-1/12 text-center">No</TableHeaderCell>
              <TableHeaderCell className="w-6/12">Sasaran Organisasi / KPI</TableHeaderCell>
              <TableHeaderCell className="w-1/12 text-center">Target</TableHeaderCell>
              <TableHeaderCell className="w-2/12 text-center">Risiko Inheren</TableHeaderCell>
              <TableHeaderCell className="w-2/12 text-center">Risiko Residual</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessmentData.sasaran_kpi_entries && assessmentData.sasaran_kpi_entries.length > 0 ? (
              assessmentData.sasaran_kpi_entries.map((item, index) => {
                // Ambil style warna berdasarkan skor
                const inherentStyle = getCellColor(item.inherent_risk_score);
                const residualStyle = getCellColor(item.residual_risk_score);
                const targetStyleClass = riskLevelMapSimple[item.target_level] || "bg-gray-200 text-gray-500";

                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="whitespace-normal">{item.sasaran_kpi}</TableCell>
                    <TableCell className={`text-center font-semibold ${targetStyleClass}`}>{item.target_level || "-"}</TableCell>
                    <TableCell className={`text-center font-semibold ${inherentStyle}`}>{item.inherent_risk_score ?? "#N/A"}</TableCell>
                    <TableCell className={`text-center font-semibold ${residualStyle}`}>{item.residual_risk_score ?? "#N/A"}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-5">
                  <Text>Belum ada Sasaran Organisasi / KPI yang ditambahkan.</Text>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Card 4: Risk Input (Read-only View) */}
      <Card>
        <Title as="h3">4. Risk Input</Title>
        <Text>Detail risiko yang diidentifikasi.</Text>
        <div className="overflow-x-auto mt-4">
          <Table className="min-w-[1600px]">
            <TableHead>
              <TableRow className="bg-gray-100 text-xs">
                <TableHeaderCell>No</TableHeaderCell>
                <TableHeaderCell>Kode</TableHeaderCell>
                <TableHeaderCell>Deskripsi Risiko</TableHeaderCell>
                <TableHeaderCell>Unit</TableHeaderCell>
                <TableHeaderCell>Kategori</TableHeaderCell>
                <TableHeaderCell>P(In)</TableHeaderCell>
                <TableHeaderCell>I(In)</TableHeaderCell>
                <TableHeaderCell>Skor(In)</TableHeaderCell>
                <TableHeaderCell>P(Res)</TableHeaderCell>
                <TableHeaderCell>I(Res)</TableHeaderCell>
                <TableHeaderCell>Skor(Res)</TableHeaderCell>
                <TableHeaderCell>Strategi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {riskInputEntries && riskInputEntries.length > 0 ? (
                riskInputEntries.map((r, i) => {
                  const inherentStyle = getCellColor(r.inherent_skor);
                  const residualStyle = getCellColor(r.residual_skor);
                  return (
                    <TableRow key={r.id} className="text-xs">
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{r.kode_risiko}</TableCell>
                      <TableCell className="whitespace-normal">{r.deskripsi_risiko}</TableCell>
                      <TableCell>{r.unit_kerja}</TableCell>
                      <TableCell>{r.kategori_risiko === "Lainnya" ? r.kategori_risiko_lainnya : r.kategori_risiko}</TableCell>
                      <TableCell className={`text-center ${inherentStyle}`}>{r.inherent_probabilitas}</TableCell>
                      <TableCell className={`text-center ${inherentStyle}`}>{r.inherent_dampak}</TableCell>
                      <TableCell className={`text-center font-semibold ${inherentStyle}`}>{r.inherent_skor ?? "N/A"}</TableCell>
                      <TableCell className={`text-center ${residualStyle}`}>{r.residual_probabilitas ?? "-"}</TableCell>
                      <TableCell className={`text-center ${residualStyle}`}>{r.residual_dampak ?? "-"}</TableCell>
                      <TableCell className={`text-center font-semibold ${residualStyle}`}>{r.residual_skor ?? "N/A"}</TableCell>
                      <TableCell>{r.strategi || "-"}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-5">
                    <Text>Belum ada data Risk Input.</Text>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Card 5: Peta Risiko */}
      <RiskMapCard risks={riskInputEntries || []} templateData={templateData} />
    </div>
  );
}

export default MadyaAssessmentView;
