import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/api";

function RscaQuestionnaireForm() {
  const { cycleId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get(`/rsca-cycles/${cycleId}/questionnaire`)
      .then((response) => {
        setQuestions(response.data);
        setIsLoading(false);
      })
      .catch((error) => console.error("Gagal memuat kuesioner:", error));
  }, [cycleId]);

  const handleAnswerChange = (questionId, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedAnswers = Object.entries(answers).map(([questionId, answerData]) => ({
      questionnaire_id: parseInt(questionId),
      jawaban: answerData.jawaban || "",
      catatan: answerData.catatan || "",
    }));

    apiClient
      .post(`/rsca-cycles/${cycleId}/answers`, { answers: formattedAnswers })
      .then(() => {
        alert("Jawaban berhasil dikirim!");
        navigate("/rsca");
      })
      .catch((error) => alert("Gagal mengirim jawaban."));
  };

  if (isLoading) return <p>Memuat pertanyaan...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Kuesioner RSCA</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {questions.map((q, index) => (
          <div key={q.id}>
            <label className="block font-semibold text-gray-800">
              {index + 1}. {q.pertanyaan}
            </label>
            <p className="text-sm text-gray-500 mb-2">Kategori: {q.kategori}</p>
            <textarea placeholder="Jawaban Anda..." className="w-full p-2 border rounded mt-1" rows="3" onChange={(e) => handleAnswerChange(q.id, "jawaban", e.target.value)}></textarea>
            <textarea placeholder="Catatan (opsional)..." className="w-full p-2 border rounded mt-2" rows="2" onChange={(e) => handleAnswerChange(q.id, "catatan", e.target.value)}></textarea>
          </div>
        ))}
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
          Kirim Jawaban
        </button>
      </form>
    </div>
  );
}

export default RscaQuestionnaireForm;
