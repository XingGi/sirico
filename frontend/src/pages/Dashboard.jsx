import React, { useState, useEffect } from "react";
import { Card, Grid, Col, Title, Text, Metric } from "@tremor/react";

import apiClient from "../api";
import KRICard from "../components/KRICard";
import HorizonScanWidget from "../components/HorizonScanWidget";
import AssessmentListWidget from "../components/AssessmentListWidget";
import QuickActionsWidget from "../components/QuickActionsWidget";
import RiskMatrixWidget from "../components/RiskMatrixWidget";
import TopRisksWidget from "../components/TopRisksWidget";

function Dashboard() {
  // 1. State ditambahkan untuk menampung data asesmen dan status loading/error
  const [kris, setKris] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. useEffect diubah untuk mengambil data KRI dan asesmen sekaligus
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kriResponse, assessmentResponse] = await Promise.all([apiClient.get("/kri"), apiClient.get("/assessments")]);
        setKris(kriResponse.data);
        setAssessments(assessmentResponse.data);
      } catch (err) {
        setError("Gagal memuat data dasbor.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 3. Logika untuk menghitung metrik dinamis
  const totalAssessments = assessments.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyAssessments = assessments.filter((assessment) => {
    const startDate = new Date(assessment.tanggal_mulai);
    return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
  }).length;

  // Menampilkan pesan loading atau error jika ada
  if (isLoading) return <div className="p-8">Memuat data dasbor...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6 sm:p-10">
        <Title>Dashboard</Title>
        <Text>Ringkasan asesmen risiko dan kepatuhan organisasi Anda.</Text>

        {/* 4. TATA LETAK BARU DI IMPLEMENTASIKAN DI SINI */}

        {/* BARIS PERTAMA: Total, Monthly, dan Plan */}
        <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
          <Card>
            <Text>Total Assessments</Text>
            <Metric>{totalAssessments}</Metric>
          </Card>
          <Card>
            <Text>Monthly Assessments</Text>
            <Metric>{monthlyAssessments} / 30</Metric>
          </Card>
          <Card>
            <Text>Plan</Text>
            <Metric>Free</Metric>
          </Card>
        </Grid>

        {/* BARIS KEDUA: Recent Assessments dan Quick Actions */}
        <Grid numItemsL={2} numItemsLg={3} className="gap-6 mt-6">
          <Col numColSpanMd={2} numColSpanLg={2}>
            <AssessmentListWidget />
          </Col>
          <Col>
            <QuickActionsWidget />
          </Col>
        </Grid>

        {/* BARIS KEEMPAT: Risk Matrix dan Top Risks */}
        <Grid numItemsLg={2} className="gap-6 mt-6">
          <RiskMatrixWidget />
          <TopRisksWidget />
        </Grid>

        <div className="mt-6">
          <HorizonScanWidget />
        </div>

        {/* BARIS KELIMA: Key Risk Indicators */}
        <div className="mt-6">
          <Card>
            <Title>Key Risk Indicators (KRI)</Title>
            {kris.length === 0 ? (
              <Text className="mt-4">Anda belum memiliki KRI.</Text>
            ) : (
              <Grid numItemsMd={2} className="mt-4 gap-6">
                {kris.map((kri) => (
                  <KRICard key={kri.id} kri={kri} />
                ))}
              </Grid>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
