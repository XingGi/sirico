import React, { useState, useEffect } from "react";
import { Card, Title, Text } from "@tremor/react";
import apiClient from "../api";

function HorizonScanWidget() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScanData = async () => {
      try {
        const response = await apiClient.get("/horizon-scan");
        setEntries(response.data);
      } catch (error) {
        console.error("Gagal memuat data horizon scan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScanData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Horizon Scanner</h3>
        <p>Memuat berita terbaru...</p>
      </div>
    );
  }

  return (
    <Card>
      <Title>Horizon Scanner: Berita Teratas</Title>
      {isLoading ? (
        <Text className="mt-4">Memuat berita terbaru...</Text>
      ) : entries.length > 0 ? (
        <div className="mt-4 space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-slate-50 p-4 rounded-md border">
              <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="text-tremor-content-emphasis font-semibold hover:text-blue-600">
                {entry.title}
              </a>
              {/* Kita gunakan div agar bisa memberi margin, bukan Text */}
              <div className="mt-2 text-tremor-content whitespace-pre-wrap">{entry.ai_summary}</div>
            </div>
          ))}
        </div>
      ) : (
        <Text className="mt-4">Belum ada data pindaian berita yang tersedia.</Text>
      )}
    </Card>
  );
}

export default HorizonScanWidget;
