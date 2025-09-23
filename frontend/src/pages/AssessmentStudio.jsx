import React from "react";
import CreateAssessmentForm from "../components/CreateAssessmentForm";

function AssessmentStudio() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow p-4">
        <h1 className="text-2xl font-bold text-gray-800">Assessment Studio</h1>
      </header>
      <main className="p-4 md:p-8">
        <CreateAssessmentForm />
      </main>
    </div>
  );
}

export default AssessmentStudio;
