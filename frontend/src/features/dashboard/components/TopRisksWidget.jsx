// frontend/src/components/TopRisksWidget.jsx
import React from "react";
import { Card, Title, Text, List, ListItem, Badge } from "@tremor/react";

function TopRisksWidget() {
  // Data statis untuk daftar risiko teratas
  const topRisks = [
    { name: "Critical Cyber Security Breach", level: "Very High", color: "red" },
    { name: "Complete System Infrastructure Failure", level: "Very High", color: "red" },
    { name: "Major Customer Data Privacy Breach", level: "Very High", color: "red" },
    { name: "Severe Financial Loss from Market Volatility", level: "High", color: "amber" },
    { name: "Critical Supply Chain Disruption", level: "High", color: "amber" },
  ];

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <Title>Top Risks</Title>
          <Text>Sample data Plan Starter</Text>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg">Upgrade</button>
      </div>

      <List className="mt-4">
        {topRisks.map((risk, index) => (
          <ListItem key={index}>
            <span>{risk.name}</span>
            <Badge color={risk.color}>{risk.level}</Badge>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}

export default TopRisksWidget;
