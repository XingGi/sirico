// frontend/src/components/AssessmentItem.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Text, Badge, Button, Switch } from "@tremor/react";
import { FiCalendar, FiHash, FiTag, FiEye } from "react-icons/fi";

function AssessmentItem({ assessment, isSelected, onSelect, industryName }) {
  const navigate = useNavigate();

  // Ambil hanya bagian tanggal dari 'tanggal_mulai'
  const dateOnly = assessment.tanggal_mulai.split("T")[0];

  return (
    <Card className="p-4 mb-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <Switch id={`select-${assessment.id}`} checked={isSelected} onChange={() => onSelect(assessment.id)} />

        {/* Konten Utama */}
        <div className="flex-grow">
          <p className="font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">{assessment.nama_asesmen}</p>
          <div className="flex items-center gap-4 mt-2 text-tremor-content">
            <span className="flex items-center gap-1.5 text-xs">
              <FiTag className="w-4 h-4" />
              {industryName || "No Industry"}
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <FiCalendar className="w-4 h-4" />
              {dateOnly}
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <FiHash className="w-4 h-4" />
              RA-{assessment.id.toString().padStart(4, "0")}
            </span>
          </div>
        </div>

        {/* Tombol Aksi */}
        <Button variant="secondary" icon={FiEye} onClick={() => navigate(`/assessments/${assessment.id}`)}>
          View
        </Button>
      </div>
    </Card>
  );
}

export default AssessmentItem;
