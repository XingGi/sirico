import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AssessmentStudio from "./pages/AssessmentStudio";
import RSCA from "./pages/RSCA";
import RscaQuestionnaireForm from "./pages/RscaQuestionnaireForm";
import BPR from "./pages/BPR";
import BIA from "./pages/BIA";
import Layout from "./components/Layout";
import AssessmentListPage from "./pages/AssessmentListPage";
import AssessmentDetailPage from "./pages/AssessmentDetailPage";
import LandingPage from "./pages/LandingPage";
import MasterDataPage from "./pages/admin/MasterDataPage";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute Terlindungi SEKARANG dibungkus oleh Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assessment-studio" element={<AssessmentStudio />} />
            <Route path="/rsca" element={<RSCA />} />
            <Route path="/rsca/cycle/:cycleId" element={<RscaQuestionnaireForm />} />
            <Route path="/bpr" element={<BPR />} />
            <Route path="/bia" element={<BIA />} />
            <Route path="/assessments" element={<AssessmentListPage />} />
            <Route path="/assessments/:assessmentId" element={<AssessmentDetailPage />} />
            <Route path="/admin/master-data" element={<MasterDataPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
