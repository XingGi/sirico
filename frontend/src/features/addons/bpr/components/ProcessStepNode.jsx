// frontend/src/features/bpr/components/ProcessStepNode.jsx
import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { FiAlertTriangle, FiShield } from "react-icons/fi";

// Memo agar tidak re-render berlebihan saat canvas digeser
const ProcessStepNode = memo(({ data }) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-white border-2 border-slate-200 min-w-[180px] text-center hover:border-blue-400 transition-colors cursor-pointer">
      {/* --- Titik Sambung (Handles) --- */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />

      {/* --- Konten Node --- */}
      <div className="font-bold text-slate-800 text-sm mb-2">{data.label}</div>

      {/* --- Badges (Risiko & Kontrol) --- */}
      <div className="flex justify-center gap-2">
        {data.riskCount > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
            <FiAlertTriangle size={10} /> {data.riskCount}
          </div>
        )}
        {data.controlCount > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
            <FiShield size={10} /> {data.controlCount}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
});

export default ProcessStepNode;
