// frontend/src/components/QuickActionsWidget.jsx
import React from "react";
import { Card, Title, Text } from "@tremor/react";
import { FiPlusCircle, FiEye, FiShield } from "react-icons/fi";
import ClickableCard from "./ClickableCard";

function QuickActionsWidget() {
  return (
    <Card className="h-full flex flex-col">
      <Title>Quick Actions</Title>
      <Text>Common tasks to get you started</Text>
      <div className="mt-4 flex-grow flex flex-col justify-between">
        <ClickableCard to="/assessment-studio">
          <div className="flex items-center">
            <FiPlusCircle className="w-6 h-6 mr-3 text-blue-500" />
            <div>
              <p className="font-semibold text-tremor-content-emphasis">Create Risk Assessment</p>
              <p className="text-sm text-tremor-content">Start a new risk evaluation</p>
            </div>
          </div>
        </ClickableCard>

        <ClickableCard to="/assessments">
          <div className="flex items-center">
            <FiEye className="w-6 h-6 mr-3 text-blue-500" />
            <div>
              <p className="font-semibold text-tremor-content-emphasis">View All Assessments</p>
              <p className="text-sm text-tremor-content">Browse all risk assessments</p>
            </div>
          </div>
        </ClickableCard>

        <ClickableCard to="/risk-register">
          <div className="flex items-center">
            <FiShield className="w-6 h-6 mr-3 text-blue-500" />
            <div>
              <p className="font-semibold text-tremor-content-emphasis">View Risk Register</p>
              <p className="text-sm text-tremor-content">Manage your risk inventory</p>
            </div>
          </div>
        </ClickableCard>
      </div>
    </Card>
  );
}

export default QuickActionsWidget;
