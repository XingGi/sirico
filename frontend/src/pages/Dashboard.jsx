import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
import { Card, Grid, Col, Title, Text, Metric } from "@tremor/react";

import apiClient from "../api";
import KRICard from "../components/KRICard";
import HorizonScanWidget from "../components/HorizonScanWidget";
import AssessmentListWidget from "../components/AssessmentListWidget";
import QuickActionsWidget from "../components/QuickActionsWidget";
import RiskMatrixWidget from "../components/RiskMatrixWidget";
import TopRisksWidget from "../components/TopRisksWidget";

function Dashboard() {
  const [kris, setKris] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKRI = async () => {
      try {
        const response = await apiClient.get("/kri");
        setKris(response.data);
      } catch (err) {
        setError("Gagal memuat data KRI.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKRI();
  }, []);

  // if (isLoading) return <div className="p-8">Memuat data...</div>;
  // if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6 sm:p-10">
        <Title>Dashboard</Title>
        <Text>Ringkasan asesmen risiko dan kepatuhan organisasi Anda.</Text>

        <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
          <Card>
            <Text>Total Assessments</Text>
            <Metric>1</Metric>
          </Card>
          <Card>
            <Text>Monthly Assessments</Text>
            <Metric>0 / 30</Metric>
          </Card>
          <Col numColSpan={1} numColSpanMd={2} numColSpanLg={1}>
            <QuickActionsWidget />
          </Col>
        </Grid>

        <div className="mt-6">
          <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
            <Col numColSpanMd={2} numColSpanLg={2}>
              <AssessmentListWidget />
            </Col>
            <Col>
              <HorizonScanWidget />
            </Col>
          </Grid>
        </div>

        {/* ↓↓↓ PERUBAHAN UTAMA DI SINI ↓↓↓ */}
        <Grid numItemsLg={2} className="gap-6 mt-6">
          <RiskMatrixWidget />
          <TopRisksWidget />
        </Grid>

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
