// frontend/src/features/admin/components/rsca/CycleCard.jsx

import React from "react";
import { Card, Flex, Title, Badge, Icon, Button, Text } from "@tremor/react";
import { FiCalendar, FiBriefcase, FiEye, FiEdit, FiSettings } from "react-icons/fi";
import { formatDate } from "../../../../utils/formatters";

const CycleCard = ({ cycle, onViewResults, onEdit, onEditQuestions }) => {
  return (
    <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {/* Bagian Konten Utama */}
      <div className="p-4 flex-grow">
        <Flex>
          <Title className="mb-2">{cycle.nama_siklus}</Title>
          <Badge color={cycle.status === "Draft" ? "gray" : "blue"}>{cycle.status}</Badge>
        </Flex>

        {/* Metadata */}
        <div className="space-y-2 mt-2 text-tremor-content">
          <span className="flex items-center gap-2 text-sm">
            <Icon icon={FiCalendar} size="sm" />
            {formatDate(cycle.tanggal_mulai)} - {formatDate(cycle.tanggal_selesai)}
          </span>
          <span className="flex items-center gap-2 text-sm">
            <Icon icon={FiBriefcase} size="sm" />
            {cycle.departments?.map((dep) => dep.name).join(", ") || "Belum ada departemen"}
          </span>
        </div>
      </div>

      {/* Bagian Footer Aksi */}
      <div className="border-t p-2 flex justify-end gap-1 bg-tremor-background-muted">
        <Button icon={FiEye} variant="light" color="blue" onClick={() => onViewResults(cycle)} title="Lihat Hasil & Jawaban" />
        <Button icon={FiEdit} variant="light" color="gray" onClick={() => onEdit(cycle)} title="Edit Nama, Tanggal & Departemen" disabled={cycle.status !== "Draft"} />
        <Button icon={FiSettings} variant="light" color="gray" onClick={() => onEditQuestions(cycle)} title="Edit Pertanyaan & Kuesioner" disabled={cycle.status !== "Draft"} />
      </div>
    </Card>
  );
};

export default CycleCard;
