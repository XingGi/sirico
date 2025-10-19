// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// --- PERUBAHAN: Mengimpor komponen dari lokasi baru ---
import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";

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

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<LandingPage />} />

        {/* Rute Terlindungi */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* --- PERUBAHAN: Menyesuaikan path URL untuk Risk Management AI --- */}
            <Route path="/risk-ai/assessment-studio" element={<AssessmentStudio />} />
            <Route path="/risk-ai/assessments" element={<AssessmentListPage />} />
            <Route path="/risk-ai/assessments/:assessmentId" element={<AssessmentDetailPage />} />
            <Route path="/risk-ai/risk-register" element={<RiskRegisterPage />} />

            {/* --- PERUBAHAN: Menyesuaikan path URL untuk Risk Management Levels --- */}
            <Route path="/risk-management/dasar" element={<BasicAssessmentListPage />} />
            <Route path="/risk-management/dasar/new" element={<BasicAssessmentFormPage />} />
            <Route path="/risk-management/dasar/edit/:assessmentId" element={<BasicAssessmentFormPage />} />
            <Route path="/risk-management/templates" element={<TemplateListPage />} />
            <Route path="/risk-management/templates/new" element={<TemplateEditorPage />} />
            <Route path="/risk-management/templates/edit/:templateId" element={<TemplateEditorPage />} />

            {/* Modul Lain */}
            <Route path="/rsca" element={<RSCAPage />} />
            <Route path="/rsca/cycle/:cycleId" element={<RscaQuestionnaireForm />} />
            <Route path="/bpr" element={<BPRPage />} />
            <Route path="/bia" element={<BIAPage />} />

            {/* Admin */}
            <Route path="/admin/master-data" element={<MasterDataPage />} />
            <Route path="/admin/regulations" element={<RegulationPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
