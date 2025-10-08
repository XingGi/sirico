// frontend/src/components/RiskSummary.jsx

import React from "react";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, DonutChart, BarChart } from "@tremor/react";
import { FiAlertTriangle, FiBarChart2, FiPieChart, FiType } from "react-icons/fi";
import { BarChart as RechartsBarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Konfigurasi ini sudah benar
const RISK_LEVELS_CONFIG = {
  High: { name: "5 - High", hex: "#ef4444", bgColor: "bg-red-500", textColor: "text-white" },
  "Moderate to High": { name: "4 - Moderate to High", hex: "#f97316", bgColor: "bg-orange-500", textColor: "text-white" },
  Moderate: { name: "3 - Moderate", hex: "#facc15", bgColor: "bg-yellow-400", textColor: "text-black" },
  "Low to Moderate": { name: "2 - Low to Moderate", hex: "#a3e635", bgColor: "bg-lime-400", textColor: "text-black" },
  Low: { name: "1 - Low", hex: "#22c55e", bgColor: "bg-green-500", textColor: "text-white" },
};

const LEVEL_ORDER = ["Low", "Low to Moderate", "Moderate", "Moderate to High", "High"];
const RISK_TYPE_HEX_COLORS = ["#3b82f6", "#22d3ee", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899"];

const RISK_TYPE_MAP = {
  RP: "Risiko Pasar",
  RK: "Risiko Kepatuhan",
  RO: "Risiko Operasional",
  RR: "Risiko Reputasi",
  "N/A": "Tidak Diketahui",
};

const getLevelKeyByScore = (likelihood, impact) => {
  const score = (likelihood || 0) * (impact || 0);
  if (score >= 15) return "High";
  if (score >= 8) return "Moderate to High";
  if (score >= 4) return "Moderate";
  if (score >= 2) return "Low to Moderate";
  if (score > 0) return "Low";
  return null;
};

const valueFormatter = (number) => `${new Intl.NumberFormat("us").format(number).toString()}`;

function RiskSummary({ risks = [] }) {
  const riskTypeCounts = risks.reduce((acc, risk) => {
    const abbreviation = risk.risk_type || "N/A";
    const fullName = RISK_TYPE_MAP[abbreviation] || abbreviation;
    acc[fullName] = (acc[fullName] || 0) + 1;
    return acc;
  }, {});

  const riskTypeData = Object.keys(riskTypeCounts)
    .map((type) => ({
      name: type,
      value: riskTypeCounts[type],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const riskLevelCounts = { High: 0, "Moderate to High": 0, Moderate: 0, "Low to Moderate": 0, Low: 0 };
  let highestLevelScore = 0;

  risks.forEach((risk) => {
    const levelScore = (risk.inherent_likelihood || 0) * (risk.inherent_impact || 0);
    const inherentLevelKey = getLevelKeyByScore(risk.inherent_likelihood, risk.inherent_impact);
    if (inherentLevelKey && riskLevelCounts.hasOwnProperty(inherentLevelKey)) {
      riskLevelCounts[inherentLevelKey]++;
    }
    if (levelScore > highestLevelScore) {
      highestLevelScore = levelScore;
    }
  });

  const riskLevelTableData = LEVEL_ORDER.map((levelKey) => {
    const config = RISK_LEVELS_CONFIG[levelKey];
    if (!config) return null;
    return {
      name: config.name,
      count: riskLevelCounts[levelKey] || 0,
      bgColor: config.bgColor,
      textColor: config.textColor,
    };
  })
    .filter(Boolean)
    .reverse();

  const riskLevelChartData = LEVEL_ORDER.map((levelName) => ({
    name: levelName,
    "Number of Risks": riskLevelCounts[levelName] || 0,
    fill: RISK_LEVELS_CONFIG[levelName]?.hex || "#8884d8",
  }));

  const totalRisks = risks.length;
  let mostCommonLevel = "N/A";
  if (totalRisks > 0) {
    mostCommonLevel = Object.keys(riskLevelCounts).reduce((a, b) => (riskLevelCounts[a] > riskLevelCounts[b] ? a : b));
  }
  const highestLevelInfo = RISK_LEVELS_CONFIG[getLevelKeyByScore(5, Math.ceil(highestLevelScore / 5))] || { name: "N/A" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <Title icon={FiType}>Risk Type Table</Title>
        <Text>Comprehensive list of all risk types</Text>
        <Table className="mt-4">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Risk Type</TableHeaderCell>
              <TableHeaderCell className="text-right">Count</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {riskTypeData.map((item, index) => (
              <TableRow key={item.name}>
                <TableCell className="flex items-center space-x-2">
                  <span style={{ backgroundColor: RISK_TYPE_HEX_COLORS[index % RISK_TYPE_HEX_COLORS.length] }} className="w-2.5 h-2.5 rounded-full"></span>
                  <span>{item.name}</span>
                </TableCell>
                <TableCell className="text-right">{item.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card>
        <Title icon={FiPieChart}>Risk Type Distribution</Title>
        <Text>Visual distribution analysis of risk types</Text>
        {riskTypeData.length > 0 ? (
          <div className="mt-6 h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="70%" outerRadius="100%">
                  {riskTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_TYPE_HEX_COLORS[index % RISK_TYPE_HEX_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Total</p>
              <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">{totalRisks}</p>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col justify-center items-center text-center text-gray-500">
            <FiPieChart className="w-12 h-12 mb-2" />
            <Text>No Risk Data Available</Text>
            <Text className="text-xs">Risk type distribution will appear when risks are identified.</Text>
          </div>
        )}
      </Card>

      {/* === KOLOM KANAN === */}
      <Card>
        <Title icon={FiAlertTriangle}>Risk Level Table</Title>
        <Text>Breakdown of risk levels by count</Text>
        <Table className="mt-4">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Risk Level</TableHeaderCell>
              <TableHeaderCell className="text-right">Count</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {riskLevelTableData.map((item) => (
              <TableRow key={item.name}>
                <TableCell className={`${item.bgColor} ${item.textColor}`}>{item.name}</TableCell>
                <TableCell className="text-right">{item.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card>
        <Title icon={FiBarChart2}>Risk Level Distribution</Title>
        <Text>Visual representation of risk level spread</Text>
        <div className="mt-6 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={riskLevelChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: "rgba(200, 200, 200, 0.1)" }} />
              <Bar dataKey="Number of Risks" radius={[4, 4, 0, 0]}>
                {riskLevelChartData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 border-t pt-4 text-center">
          <div>
            <Text>Total Risks</Text>
            <Text className="font-bold">{totalRisks}</Text>
          </div>
          <div>
            <Text>Highest Level</Text>
            <Text className="font-bold">{highestLevelInfo.name}</Text>
          </div>
          <div>
            <Text>Most Common</Text>
            <Text className="font-bold">{mostCommonLevel}</Text>
          </div>
          <div>
            <Text className="text-red-500">High Risks</Text>
            <Text className="font-bold text-red-500">{riskLevelCounts.High + riskLevelCounts["Moderate to High"]}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default RiskSummary;
