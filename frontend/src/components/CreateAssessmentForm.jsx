// frontend/src/components/CreateAssessmentForm.jsx

import React, { useState, useEffect } from "react";
import apiClient from "../api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, Title, Text, Button, TextInput, Textarea, Select, SearchSelect, SelectItem, SearchSelectItem, ProgressBar } from "@tremor/react";
import { FiCpu, FiArchive, FiBriefcase, FiFlag, FiCheckSquare, FiPlusSquare, FiHome, FiShield, FiDollarSign, FiTarget, FiBookOpen, FiUsers, FiClipboard } from "react-icons/fi";

// Data untuk kategori risiko (sekarang dengan deskripsi singkat)
const RISK_CATEGORIES = [
  { name: "Credit Risk", desc: "Default, concentration, counterparty" },
  { name: "Market Risk", desc: "Price, volatility, liquidity risks" },
  { name: "Liquidity Risk", desc: "Funding and cash flow risks" },
  { name: "Operational Risk", desc: "Process, people, system risks" },
  { name: "Strategic Risk", desc: "Business model and competitive" },
  { name: "Legal Risk", desc: "Contract, regulatory, litigation" },
  { name: "Compliance Risk", desc: "Regulatory and policy violations" },
  { name: "Reputation Risk", desc: "Brand and stakeholder perception" },
  { name: "Insurance Risk", desc: "Coverage gaps and claims risks" },
  { name: "Intra Group Risk", desc: "Internal group transaction risks" },
];

const requiredFields = ["nama_asesmen", "project_objective", "involved_departments", "additional_risk_context", "risk_categories"];

function CreateAssessmentForm() {
  const [formData, setFormData] = useState({
    nama_asesmen: "",
    company_industry: "",
    company_type: "",
    company_assets: "",
    currency: "IDR",
    risk_limit: null,
    risk_categories: [],
    project_objective: "",
    relevant_regulations: "",
    involved_departments: "",
    completed_actions: "",
    additional_risk_context: "",
  });

  const [displayRiskLimit, setDisplayRiskLimit] = useState("");
  const [outputLanguage, setOutputLanguage] = useState("ID");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let completed = 0;
    requiredFields.forEach((field) => {
      if (field === "risk_categories") {
        if (formData[field].length > 0) completed++;
      } else {
        if (formData[field]) completed++;
      }
    });
    setProgress(Math.round((completed / requiredFields.length) * 100));
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value, name) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleRiskLimitChange = (event) => {
    const rawValue = event.target.value.replace(/,/g, "");
    if (!isNaN(rawValue) && rawValue !== "") {
      const numValue = parseInt(rawValue, 10);
      setFormData({ ...formData, risk_limit: numValue });
      setDisplayRiskLimit(numValue.toLocaleString("en-US"));
    } else if (rawValue === "") {
      setFormData({ ...formData, risk_limit: null });
      setDisplayRiskLimit("");
    }
  };

  const handleCategoryChange = (categoryName) => {
    const currentCategories = formData.risk_categories;
    const newCategories = currentCategories.includes(categoryName) ? currentCategories.filter((c) => c !== categoryName) : [...currentCategories, categoryName];
    setFormData({ ...formData, risk_categories: newCategories });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.risk_categories.length === 0) {
      alert("Harap pilih minimal satu kategori risiko.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.post("/assessments", formData);
      alert("Asesmen berhasil dibuat!");
      navigate(`/assessments/${response.data.assessment_id}`);
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || "Gagal membuat asesmen."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-xl shadow-lg">
        <div className="flex items-center gap-2">
          <FiArchive className="w-6 h-6 text-gray-500" />
          <Title>Project Name *</Title>
        </div>
        <TextInput name="nama_asesmen" value={formData.nama_asesmen} onChange={handleChange} placeholder="e.g., Digital Banking Platform Security Assessment" required className="mt-2" />
      </Card>

      <Card className="p-0 overflow-hidden rounded-xl shadow-lg">
        <div className="bg-blue-50 p-5">
          <div className="flex items-center gap-2">
            <FiBriefcase className="w-6 h-6 text-blue-600" />
            <Title className="text-blue-900">Company Information</Title>
          </div>
          <Text className="text-blue-800">Tell us about your organization and business context</Text>
        </div>
        <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* === PERUBAHAN 3: Menambahkan Ikon & Menggunakan SearchSelect === */}
          <div>
            <div className="flex items-center gap-x-2 mb-1">
              <FiHome className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Industry *</label>
            </div>
            <SearchSelect onValueChange={(v) => handleSelectChange(v, "company_industry")} placeholder="e.g., Banking, Insurance, Technology">
              <SearchSelectItem value="Banking">Banking</SearchSelectItem>
              <SearchSelectItem value="Technology">Technology</SearchSelectItem>
              <SearchSelectItem value="Insurance">Insurance</SearchSelectItem>
            </SearchSelect>
          </div>
          <div>
            <div className="flex items-center gap-x-2 mb-1">
              <FiShield className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Company Type *</label>
            </div>
            <SearchSelect onValueChange={(v) => handleSelectChange(v, "company_type")} placeholder="e.g., Public Company, Private Company, Startup">
              <SearchSelectItem value="Public">Public Company</SearchSelectItem>
              <SearchSelectItem value="Private">Private Company</SearchSelectItem>
              <SearchSelectItem value="Startup">Startup</SearchSelectItem>
            </SearchSelect>
          </div>
          <div>
            <div className="flex items-center gap-x-2 mb-1">
              <FiDollarSign className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Company Assets *</label>
            </div>
            <SearchSelect onValueChange={(v) => handleSelectChange(v, "company_assets")} placeholder="e.g., $1M - $10M, $10M - $50M">
              <SearchSelectItem value="<1M">$0 - $1M</SearchSelectItem>
              <SearchSelectItem value="1M-10M">$1M - $10M</SearchSelectItem>
              <SearchSelectItem value="10M-100M">$10M - $100M</SearchSelectItem>
              <SearchSelectItem value=">100M">$100M+</SearchSelectItem>
            </SearchSelect>
          </div>
          <div className="flex gap-2">
            <div className="w-1/3">
              <div className="mb-1">
                <label className="text-sm font-medium text-gray-700">Currency</label>
              </div>
              <SearchSelect defaultValue="IDR" onValueChange={(v) => handleSelectChange(v, "currency")}>
                <SearchSelectItem value="IDR">IDR</SearchSelectItem>
                <SearchSelectItem value="USD">USD</SearchSelectItem>
              </SearchSelect>
            </div>
            <div className="w-2/3">
              <div className="mb-1">
                <label className="text-sm font-medium text-gray-700">Risk Limit</label>
              </div>
              <TextInput name="risk_limit" value={displayRiskLimit} onChange={handleRiskLimitChange} placeholder="e.g. 5,000,000" />
            </div>
          </div>
        </div>
      </Card>

      {/* === PERUBAHAN UTAMA DI SINI === */}
      <Card className="p-0 overflow-hidden rounded-xl shadow-lg">
        <div className="bg-orange-50 p-5">
          <div className="flex items-center gap-2">
            <FiFlag className="w-6 h-6 text-orange-600" />
            <Title className="text-orange-900">Risk Categories *</Title>
          </div>
          <Text className="text-orange-800">
            Select risk types relevant to your assessment. <span className="font-semibold bg-orange-200 text-orange-900 px-2 py-1 rounded-md">Select at least 1.</span>
          </Text>
        </div>
        <div className="p-5 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {RISK_CATEGORIES.map((category) => (
              <motion.div
                key={category.name}
                onClick={() => handleCategoryChange(category.name)}
                whileTap={{ scale: 0.97 }}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-start ${
                  formData.risk_categories.includes(category.name) ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "bg-white hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div>
                  <p className="font-semibold text-gray-800">{category.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{category.desc}</p>
                </div>
                <div className={`w-5 h-5 border-2 rounded flex-shrink-0 mt-1 ${formData.risk_categories.includes(category.name) ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                  {formData.risk_categories.includes(category.name) && (
                    <svg className="w-full h-full text-white fill-current" viewBox="0 0 24 24">
                      <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                    </svg>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden rounded-xl shadow-lg">
        <div className="bg-green-50 p-5">
          <div className="flex items-center gap-2">
            <FiCheckSquare className="w-6 h-6 text-green-600" />
            <Title className="text-green-900">Project Context</Title>
          </div>
          <Text className="text-green-800">Provide detailed context for comprehensive risk analysis.</Text>
        </div>
        <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* === PERUBAHAN 4: Menambahkan Ikon & Placeholder di Project Context === */}
          <div>
            <div className="flex items-center gap-x-2 mb-1">
              <FiTarget className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Project Objective *</label>
            </div>
            <Textarea name="project_objective" value={formData.project_objective} onChange={handleChange} required placeholder="e.g., Implement new digital banking platform to enhance customer experience and operational efficiency..." />
          </div>
          <div>
            <div className="flex items-center gap-x-2 mb-1">
              <FiBookOpen className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Relevant Regulations</label>
            </div>
            <Textarea name="relevant_regulations" value={formData.relevant_regulations} onChange={handleChange} placeholder="Type regulations separated by commas. (e.g., GDPR, ISO 27001, POJK)..." />
          </div>
          <div>
            <div className="flex items-center gap-x-2 mb-1">
              <FiUsers className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Involved Departments *</label>
            </div>
            <Textarea name="involved_departments" value={formData.involved_departments} onChange={handleChange} required placeholder="e.g., IT Department, Risk Management, Legal & Compliance, Operations, Customer Service..." />
          </div>
          <div>
            <div className="flex items-center gap-x-2 mb-1">
              <FiClipboard className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Completed Actions</label>
            </div>
            <Textarea name="completed_actions" value={formData.completed_actions} onChange={handleChange} placeholder="e.g., Initial security assessment completed, vendor due diligence performed, pilot testing with 100 users..." />
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden rounded-xl shadow-lg">
        <div className="bg-purple-50 p-5">
          <div className="flex items-center gap-2">
            <FiPlusSquare className="w-6 h-6 text-purple-600" />
            <Title className="text-purple-900">Additional Context</Title>
          </div>
        </div>
        <div className="p-5 bg-white">
          <label className="text-sm font-medium text-gray-700">Additional Risk Context *</label>
          <Textarea
            name="additional_risk_context"
            value={formData.additional_risk_context}
            onChange={handleChange}
            required
            className="mt-1"
            rows={4}
            placeholder="e.g., We are particularly concerned about data privacy during the migration process, tight time constraints, third-party integrations..."
          />
        </div>
      </Card>

      <Card className="rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="w-1/4">
            <Text>{progress}% complete</Text>
            <ProgressBar value={progress} color="blue" className="mt-1" />
          </div>
          <div className="flex items-center gap-4">
            <Text>Output Language</Text>
            <div className="flex rounded-lg border p-1">
              <button type="button" onClick={() => setOutputLanguage("ID")} className={`px-3 py-1 text-sm rounded-md transition-colors ${outputLanguage === "ID" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}>
                ID
              </button>
              <button type="button" onClick={() => setOutputLanguage("EN")} className={`px-3 py-1 text-sm rounded-md transition-colors ${outputLanguage === "EN" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}>
                EN
              </button>
            </div>
            <Button type="submit" icon={FiCpu} size="lg" loading={isLoading} disabled={isLoading || progress < 100}>
              Start AI Risk Analysis
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}

export default CreateAssessmentForm;
