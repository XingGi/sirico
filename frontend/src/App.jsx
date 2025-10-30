// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// --- PERUBAHAN: Mengimpor komponen dari lokasi baru ---
import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import UnauthorizedPage from "./components/common/UnauthorizedPage";

// --- PERUBAHAN: Mengimpor semua halaman dari folder /features ---
import LandingPage from "./features/landing/LandingPage";
import Dashboard from "./features/dashboard/Dashboard";
import AssessmentStudio from "./features/risk-ai/AssessmentStudio";
import AssessmentListPage from "./features/risk-ai/AssessmentListPage";
import AssessmentDetailPage from "./features/risk-ai/AssessmentDetailPage";
import RiskRegisterPage from "./features/risk-ai/RiskRegisterPage";
import RSCAPage from "./features/rsca/RSCAPage";
import RscaQuestionnaireForm from "./features/rsca/RscaQuestionnaireForm";
import BPRPage from "./features/bpr/BPRPage";
import BIAPage from "./features/bia/BIAPage";
import BasicAssessmentListPage from "./features/risk-management/basic/BasicAssessmentListPage";
import BasicAssessmentFormPage from "./features/risk-management/basic/BasicAssessmentFormPage";
import TemplateListPage from "./features/risk-management/templates/TemplateListPage";
import TemplateEditorPage from "./features/risk-management/templates/TemplateEditorPage";
import MasterDataPage from "./features/admin/MasterDataPage";
import RegulationPage from "./features/admin/RegulationPage";
import MadyaAssessmentListPage from "./features/risk-management/madya/MadyaAssessmentListPage";
import MadyaAssessmentFormPage from "./features/risk-management/madya/MadyaAssessmentFormPage";
import RolePermissionPage from "./features/admin/RolePermissionPage";
import MemberPage from "./features/admin/MemberPage";
import AccountSettingPage from "./features/account/AccountSettingPage";
import PasswordSettingPage from "./features/account/PasswordSettingPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<LandingPage />} />
        {/* Rute Terlindungi */}
        <Route element={<ProtectedRoute />}>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route element={<Layout />}>
            {/* Dashboard: Hanya perlu login */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/account-setting" element={<AccountSettingPage />} />
            <Route path="/password-setting" element={<PasswordSettingPage />} />
            <Route element={<ProtectedRoute requiredPermission="create_risk_assessment_ai" />}>
              <Route path="/risk-ai/assessment-studio" element={<AssessmentStudio />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="view_risk_assessment_ai" />}>
              <Route path="/risk-ai/assessments" element={<AssessmentListPage />} />
              <Route path="/risk-ai/assessments/:assessmentId" element={<AssessmentDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="view_risk_register_main" />}>
              <Route path="/risk-ai/risk-register" element={<RiskRegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="view_risk_dasar" />}>
              <Route path="/risk-management/dasar" element={<BasicAssessmentListPage />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="manage_risk_dasar" />}>
              <Route path="/risk-management/dasar/new" element={<BasicAssessmentFormPage />} />
              <Route path="/risk-management/dasar/edit/:assessmentId" element={<BasicAssessmentFormPage />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="view_risk_madya" />}>
              <Route path="/risk-management/madya" element={<MadyaAssessmentListPage />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="manage_risk_madya" />}>
              <Route path="/risk-management/madya/form/:assessmentId" element={<MadyaAssessmentFormPage />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="view_risk_templates" />}>
              <Route path="/risk-management/templates" element={<TemplateListPage />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="manage_risk_templates" />}>
              <Route path="/risk-management/templates/new" element={<TemplateEditorPage />} />
              <Route path="/risk-management/templates/edit/:templateId" element={<TemplateEditorPage />} />
            </Route>

            {/* Modul Lain */}
            <Route element={<ProtectedRoute requiredPermission="view_rsca" />}>
              <Route path="/rsca" element={<RSCAPage />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="submit_rsca" />}>
              <Route path="/rsca/cycle/:cycleId" element={<RscaQuestionnaireForm />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="view_bpr" />}>
              <Route path="/bpr" element={<BPRPage />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="view_bia" />}>
              <Route path="/bia" element={<BIAPage />} />
            </Route>

            {/* Admin (semua route di dalamnya butuh role admin atau permission spesifik) */}
            <Route element={<ProtectedRoute requiredPermission="view_admin_area" />}>
              <Route path="/admin/master-data" element={<MasterDataPage />} />
              <Route path="/admin/regulations" element={<RegulationPage />} />
              <Route path="/admin/roles" element={<RolePermissionPage />} />
              <Route path="/admin/members" element={<MemberPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
