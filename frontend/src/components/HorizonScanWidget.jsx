import React, { useState, useEffect } from "react";
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
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Horizon Scanner: Berita Teratas</h3>
      <div className="space-y-4">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div key={entry.id} className="border-b pb-2">
              <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
                {entry.title}
              </a>
              <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{entry.ai_summary}</div>
            </div>
          ))
        ) : (
          <p>Belum ada data pindaian berita yang tersedia.</p>
        )}
      </div>
    </div>
  );
}

export default HorizonScanWidget;
