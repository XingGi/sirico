import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

function RSCA() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/my-rsca-tasks")
      .then((response) => {
        setTasks(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Gagal memuat tugas RSCA:", error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <p>Memuat tugas...</p>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Tugas RSCA Anda</h1>
      <div className="bg-white shadow rounded-lg">
        <ul className="divide-y divide-gray-200">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <li key={task.id} className="p-4 hover:bg-gray-50">
                <Link to={`/rsca/cycle/${task.id}`} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-blue-600">{task.nama_siklus}</p>
                    <p className="text-sm text-gray-500">Mulai: {task.tanggal_mulai}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-gray-500 rounded-full">{task.status}</span>
                </Link>
              </li>
            ))
          ) : (
            <p className="p-4">Tidak ada tugas RSCA yang ditugaskan kepada Anda.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default RSCA;
