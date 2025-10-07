import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Grid, Col, Badge, Button } from "@tremor/react";
import { FiDownload, FiFileText } from "react-icons/fi";
import apiClient from "../api";
import RiskCriteriaReference from "../components/RiskCriteriaReference";
import RiskResultsTable from "../components/RiskResultsTable";
// import { useAuth } from "../context/AuthContext";

function AssessmentDetailPage() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [assetOptions, setAssetOptions] = useState([]); // State untuk menyimpan pilihan asset
  const [industryOptions, setIndustryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ambil data asesmen dan data master aset secara bersamaan
        const [assessmentRes, assetsRes, industryRes] = await Promise.all([apiClient.get(`/assessments/${assessmentId}`), apiClient.get("/master-data?category=COMPANY_ASSETS"), apiClient.get("/master-data?category=INDUSTRY")]);
        setAssessment(assessmentRes.data);
        setAssetOptions(assetsRes.data);
        setIndustryOptions(industryRes.data);
      } catch (error) {
        console.error("Gagal memuat detail asesmen:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [assessmentId]);

  if (isLoading) return <div className="p-10">Memuat Laporan Asesmen Risiko...</div>;
  if (!assessment) return <div className="p-10">Gagal memuat data asesmen.</div>;

  const formatNumber = (num) => (num ? new Intl.NumberFormat("id-ID").format(num) : "-");

  // Cari nilai 'value' yang sesuai untuk 'key' yang tersimpan di database
  const assetValueDisplay = assetOptions.find((opt) => opt.key === assessment.company_assets)?.value || assessment.company_assets;
  const industryDisplay = industryOptions.find((opt) => opt.key === assessment.company_industry)?.value || assessment.company_industry || "-";

  return (
    <div className="p-6 sm:p-10 bg-slate-50 min-h-full">
      <Title>Risk Assessment Results</Title>
      <Text>AI-powered comprehensive risk analysis and recommendations</Text>

      <Card className="mt-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <Title>Risk Assessment Summary</Title>
            <Text>Assessment overview and key information</Text>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={FiDownload} disabled>
              Download Excel
            </Button>
            <Button variant="secondary" icon={FiFileText} disabled>
              Download PDF
            </Button>
          </div>
        </div>

        <Grid numItemsLg={2} className="gap-x-12 gap-y-6 mt-6 border-t pt-6">
          {/* --- Kolom Kiri --- */}
          <Col>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Assessment Info</h3>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div>
                    <Text>ID</Text>
                    <Text className="font-medium text-gray-800">RA-{assessment.id.toString().padStart(5, "0")}</Text>
                  </div>
                  <div>
                    <Text>Date</Text>
                    <Text className="font-medium text-gray-800">{assessment.tanggal_mulai}</Text>
                  </div>
                  <div>
                    <Text>Created by</Text>
                    <Text className="font-medium text-gray-800">{assessment.created_by_user_name || "N/A"}</Text>
                    <Text className="text-xs text-gray-500">{assessment.created_by_user_email || ""}</Text>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Project Context</h3>
                <div className="mt-2 grid grid-cols-1 gap-4">
                  <div>
                    <Text>Objective</Text>
                    <Text className="font-medium text-gray-800">{assessment.project_objective || "-"}</Text>
                  </div>
                  <div>
                    <Text>Involved Units</Text>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {assessment.involved_departments?.split(",").map((unit) => (
                        <Badge key={unit} color="green">
                          {unit.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* --- Kolom Kanan --- */}
          <Col>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Company Info</h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <Text>Type</Text>
                    <Badge color="blue">{assessment.company_type || "-"}</Badge>
                  </div>
                  <div>
                    <Text>Industry</Text>
                    <Badge color="blue">{industryDisplay}</Badge>
                  </div>
                  <div>
                    <Text>Asset Value</Text>
                    <Badge color="blue">{assetValueDisplay || "-"}</Badge>
                  </div>
                  <div>
                    <Text>Risk Limit</Text>
                    <Text className="font-medium text-gray-800">Rp {formatNumber(assessment.risk_limit)}</Text>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Project Context</h3>
                <div className="mt-2 grid grid-cols-1 gap-4">
                  <div>
                    <Text>Regulations</Text>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {assessment.relevant_regulations?.split(",").map((reg) => (
                        <Badge key={reg} color="amber">
                          {reg.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Text>Actions Taken</Text>
                    <Text className="font-medium text-gray-800">{assessment.completed_actions || "-"}</Text>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Grid>

        <div className="mt-6 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Risk Types</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {assessment.risk_categories?.split(",").map((cat) => (
              <Badge key={cat} color="rose">
                {cat.trim()}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <RiskCriteriaReference riskLimit={assessment.risk_limit} />
      </div>

      <Card className="mt-6 rounded-xl shadow-lg">
        <Title>Risk Assessment Results</Title>
        <Text>Detailed analysis of identified risks. Total: {assessment.risks?.length || 0} risks.</Text>
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <RiskResultsTable risks={assessment.risks} />
        </div>
      </Card>

      {/* Placeholder untuk bagian selanjutnya */}
      <div className="mt-6 p-6 border-2 border-dashed rounded-xl text-center">
        <Text className="text-gray-500">Bagian 4: Risk Matrix akan dibangun di sini.</Text>
      </div>
    </div>
  );
}

export default AssessmentDetailPage;
