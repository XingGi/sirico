// frontend/src/components/MainRiskRegisterTable.jsx

import React from "react";
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Switch, Button, Text as TremorText } from "@tremor/react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

// Helper functions (pindahkan atau duplikat dari RiskRegisterPage)
const getLevelInfo = (likelihood, impact) => {
  const score = (likelihood || 0) * (impact || 0);
  if (score >= 15) return { text: "5 - High", color: "red" };
  if (score >= 8) return { text: "4 - Moderate to High", color: "orange" };
  if (score >= 4) return { text: "3 - Moderate", color: "yellow" };
  if (score >= 2) return { text: "2 - Low to Moderate", color: "lime" };
  if (score > 0) return { text: "1 - Low", color: "green" };
  return { text: "N/A", color: "slate" };
};

const RISK_TYPE_MAP = {
  RP: "Risiko Pasar",
  RK: "Risiko Kepatuhan",
  RO: "Risiko Operasional",
  RR: "Risiko Reputasi",
  "N/A": "Tidak Diketahui",
};

function MainRiskRegisterTable({ risks, selectedRisks, onSelectRow, onEdit, onDelete, isAllSelected, onSelectAll }) {
  return (
    <Table className="min-w-[3000px]">
      <TableHead>
        <TableRow className="bg-blue-900 text-white">
          <TableHeaderCell className="sticky left-0 bg-blue-900 z-20 w-16">
            <Switch id="selectAllSwitch" checked={isAllSelected} onChange={onSelectAll} />
          </TableHeaderCell>
          <TableHeaderCell className="sticky left-16 bg-blue-900 z-20 w-16">No</TableHeaderCell>
          <TableHeaderCell className="sticky left-32 bg-blue-900 z-20 min-w-[300px]">Title</TableHeaderCell>
          <TableHeaderCell>Risk Code</TableHeaderCell>
          <TableHeaderCell>Objective</TableHeaderCell>
          <TableHeaderCell>Risk Type</TableHeaderCell>
          <TableHeaderCell>Risk Description</TableHeaderCell>
          <TableHeaderCell>Potential Cause</TableHeaderCell>
          <TableHeaderCell>Potential Impact</TableHeaderCell>
          <TableHeaderCell>Existing Control</TableHeaderCell>
          <TableHeaderCell>Control Effectiveness</TableHeaderCell>
          <TableHeaderCell>Likelihood</TableHeaderCell>
          <TableHeaderCell>Impact</TableHeaderCell>
          <TableHeaderCell>Risk Level</TableHeaderCell>
          <TableHeaderCell>Treatment Option</TableHeaderCell>
          <TableHeaderCell>Mitigation Plan</TableHeaderCell>
          <TableHeaderCell>Residual Likelihood</TableHeaderCell>
          <TableHeaderCell>Residual Impact</TableHeaderCell>
          <TableHeaderCell>Residual Risk Level</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {risks.map((risk, index) => {
          const inherentRisk = getLevelInfo(risk.inherent_likelihood, risk.inherent_impact);
          const residualRisk = getLevelInfo(risk.residual_likelihood, risk.residual_impact);
          const riskTypeFullName = RISK_TYPE_MAP[risk.risk_type] || risk.risk_type;
          const isSelected = selectedRisks.includes(risk.id);

          return (
            <TableRow key={risk.id} className={isSelected ? "bg-blue-50" : ""}>
              <TableCell className="sticky left-0 bg-white z-10 w-16">
                <Switch checked={isSelected} onChange={() => onSelectRow(risk.id)} />
              </TableCell>
              <TableCell className="sticky left-16 bg-white z-10 w-16">{index + 1}</TableCell>
              <TableCell className="sticky left-32 bg-white z-10 min-w-[300px]">
                <TremorText className="font-semibold">{risk.title}</TremorText>
                <div className="flex gap-2 mt-1">
                  <Button variant="light" size="xs" icon={FiEdit2} onClick={() => onEdit(risk)}>
                    Edit
                  </Button>
                  <Button variant="light" size="xs" icon={FiTrash2} color="red" onClick={() => onDelete(risk.id)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
              <TableCell>{risk.kode_risiko}</TableCell>
              <TableCell className="max-w-xs truncate">{risk.objective}</TableCell>
              <TableCell>
                <Badge color="cyan">{riskTypeFullName}</Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">{risk.deskripsi_risiko}</TableCell>
              <TableCell className="max-w-xs truncate">{risk.risk_causes}</TableCell>
              <TableCell className="max-w-xs truncate">{risk.risk_impacts}</TableCell>
              <TableCell className="max-w-xs truncate">{risk.existing_controls}</TableCell>
              <TableCell>{risk.control_effectiveness}</TableCell>
              <TableCell className="text-center">{risk.inherent_likelihood}</TableCell>
              <TableCell className="text-center">{risk.inherent_impact}</TableCell>
              <TableCell>
                <Badge color={inherentRisk.color}>{inherentRisk.text}</Badge>
              </TableCell>
              <TableCell>{risk.treatment_option}</TableCell>
              <TableCell className="max-w-xs truncate">{risk.mitigation_plan}</TableCell>
              <TableCell className="text-center">{risk.residual_likelihood}</TableCell>
              <TableCell className="text-center">{risk.residual_impact}</TableCell>
              <TableCell>
                <Badge color={residualRisk.color}>{residualRisk.text}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default MainRiskRegisterTable;
