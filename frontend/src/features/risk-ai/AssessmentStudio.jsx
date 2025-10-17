import React from "react";
import { Title, Text } from "@tremor/react";
import CreateAssessmentForm from "./components/CreateAssessmentForm";

function AssessmentStudio() {
  return (
    <div className="p-6 sm:p-10">
      <Title>Assessment Studio</Title>
      <Text>Mulai evaluasi risiko baru untuk organisasi Anda.</Text>

      <div className="mt-6">
        <CreateAssessmentForm />
      </div>
    </div>
  );
}

export default AssessmentStudio;
