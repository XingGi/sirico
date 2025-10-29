// frontend/src/components/QuickActionsWidget.jsx
import React from "react";
import { Card, Title, Text } from "@tremor/react";
import { FiPlusCircle, FiEye, FiShield } from "react-icons/fi";
import ClickableCard from "../../../components/common/ClickableCard";
import { useAuth } from "../../../context/AuthContext";

function QuickActionsWidget() {
  const { user } = useAuth();

  const hasPermission = (requiredPermission) => {
    if (!requiredPermission) return true; // Jika tidak butuh permission, tampilkan
    if (user?.role === "admin") return true; // Admin selalu punya akses
    if (!user?.permissions) return false; // User tidak punya array permissions
    return user.permissions.includes(requiredPermission);
  };

  return (
    <Card className="h-full flex flex-col">
      <Title>Quick Actions</Title>
      <Text>Common tasks to get you started</Text>
      <div className="mt-4 flex-grow flex flex-col justify-between space-y-3">
        {hasPermission("create_risk_assessment_ai") && (
          <ClickableCard to="/risk-ai/assessment-studio">
            <div className="flex items-center">
              <FiPlusCircle className="w-6 h-6 mr-3 text-blue-500" />
              <div>
                <p className="font-semibold text-tremor-content-emphasis">Create Risk Assessment</p>
                <p className="text-sm text-tremor-content">Start a new risk evaluation</p>
              </div>
            </div>
          </ClickableCard>
        )}

        {hasPermission("view_risk_assessment_ai") && (
          <ClickableCard to="/risk-ai/assessments">
            <div className="flex items-center">
              <FiEye className="w-6 h-6 mr-3 text-blue-500" />
              <div>
                <p className="font-semibold text-tremor-content-emphasis">View All Assessments</p>
                <p className="text-sm text-tremor-content">Browse all risk assessments</p>
              </div>
            </div>
          </ClickableCard>
        )}

        {hasPermission("view_risk_register_main") && (
          <ClickableCard to="/risk-ai/risk-register">
            <div className="flex items-center">
              <FiShield className="w-6 h-6 mr-3 text-blue-500" />
              <div>
                <p className="font-semibold text-tremor-content-emphasis">View Risk Register</p>
                <p className="text-sm text-tremor-content">Manage your risk inventory</p>
              </div>
            </div>
          </ClickableCard>
        )}

        {!hasPermission("create_risk_assessment_ai") &&
          !hasPermission("view_risk_assessment_ai") &&
          !hasPermission("view_risk_register_main") &&
          user?.role !== "admin" && ( // Hanya tampilkan jika bukan admin
            <div className="text-center text-gray-500 py-4">No quick actions available for your role.</div>
          )}
      </div>
    </Card>
  );
}

export default QuickActionsWidget;
