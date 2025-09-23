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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assessment-studio" element={<AssessmentStudio />} />
        <Route path="/rsca" element={<RSCA />} />
        <Route path="/rsca/cycle/:cycleId" element={<RscaQuestionnaireForm />} />
        <Route path="/bpr" element={<BPR />} />
        <Route path="/bia" element={<BIA />} />
      </Routes>
    </Router>
  );
}

export default App;
