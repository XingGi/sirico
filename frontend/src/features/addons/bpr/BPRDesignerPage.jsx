// frontend/src/features/bpr/BPRDesignerPage.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, useNodesState, useEdgesState, addEdge, Background, Controls, MiniMap, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button, Title, Text, Badge } from "@tremor/react";
import { FiPlus, FiSave, FiArrowLeft, FiSend, FiCheckSquare } from "react-icons/fi";
import { toast } from "sonner";
import apiClient from "../../../api/api";
import ProcessStepNode from "./components/ProcessStepNode";
import NodeRiskSidebar from "./components/NodeRiskSidebar";
import ConfirmationDialog from "../../../components/common/ConfirmationDialog";
import { useAuth } from "../../../context/AuthContext";

// Daftarkan tipe node
const nodeTypes = {
  processStep: ProcessStepNode,
};

const initialNodes = [{ id: "1", type: "processStep", position: { x: 250, y: 5 }, data: { label: "Mulai Proses" } }];

function BPRDesignerPage() {
  const { user } = useAuth();
  const { docId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [docInfo, setDocInfo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const [statusConfirm, setStatusConfirm] = useState({
    isOpen: false,
    newStatus: null,
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const canApprove = user?.permissions?.includes("approve_bpr") || user?.role === "admin";

  // Fetch Data
  const fetchDiagram = async () => {
    try {
      const res = await apiClient.get(`/bpr/documents/${docId}`);
      setDocInfo(res.data);

      if (res.data.nodes && res.data.nodes.length > 0) {
        setNodes(res.data.nodes);
        setEdges(res.data.edges);
      } else {
        setNodes(initialNodes);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat diagram.");
    }
  };

  useEffect(() => {
    fetchDiagram();
  }, [docId]);

  // Handler: Koneksi antar node
  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true, type: "smoothstep" }, eds)), [setEdges]);

  const onAddNode = () => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      type: "processStep",
      position: { x: 250, y: 200 },
      data: { label: `Langkah Baru`, riskCount: 0 }, // Default riskCount 0
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeLabelChange = useCallback(
    (nodeId, newLabel) => {
      // Update state nodes React Flow
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, label: newLabel } };
          }
          return node;
        })
      );

      // Update juga state selectedNode agar sidebar sinkron
      setSelectedNode((prev) => {
        if (prev && prev.id === nodeId) {
          return { ...prev, data: { ...prev.data, label: newLabel } };
        }
        return prev;
      });
    },
    [setNodes, setSelectedNode]
  );

  const onNodeClick = (event, node) => {
    // Cek apakah node sudah disimpan (punya db_id)
    if (!node.db_id) {
      toast.warning("Langkah ini belum disimpan.", {
        description: "Simpan diagram terlebih dahulu untuk menambahkan risiko.",
      });
      // Kita tetap buka sidebar, tapi di dalam sidebar ada pesan peringatan (lihat kode Sidebar di atas)
    }
    setSelectedNode(node);
    setIsSidebarOpen(true);
  };

  // Handler: Simpan ke Database
  const onSave = async () => {
    setIsSaving(true);
    try {
      const payload = { nodes, edges };
      await apiClient.post(`/bpr/documents/${docId}/save-diagram`, payload);
      toast.success("Diagram berhasil disimpan!");

      const res = await apiClient.get(`/bpr/documents/${docId}`);
      // Update db_id di node lokal tanpa me-reset posisi/label
      if (res.data.nodes) {
        setNodes((currentNodes) =>
          currentNodes.map((n) => {
            const savedNode = res.data.nodes.find((sn) => sn.id === n.id);
            return savedNode ? { ...n, db_id: savedNode.db_id } : n;
          })
        );
      }
    } catch (error) {
      toast.error("Gagal menyimpan diagram.");
    } finally {
      setIsSaving(false);
    }
  };

  const openStatusConfirm = (newStatus) => {
    setStatusConfirm({ isOpen: true, newStatus });
  };

  // 🔽 Handler Eksekusi Update Status (Dipanggil Modal) 🔽
  const handleConfirmStatus = async () => {
    const { newStatus } = statusConfirm;
    if (!newStatus) return;

    setIsUpdatingStatus(true);
    try {
      await apiClient.put(`/bpr/documents/${docId}/status`, { status: newStatus });
      toast.success(`Status diubah menjadi ${newStatus}`);
      const res = await apiClient.get(`/bpr/documents/${docId}`);
      setDocInfo(res.data);
      setStatusConfirm({ isOpen: false, newStatus: null }); // Tutup modal
    } catch (error) {
      toast.error("Gagal mengubah status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!docInfo) return <div className="p-10">Memuat Kanvas...</div>;

  const isReadOnly = docInfo.status === "Final" || docInfo.status === "Archived";

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header Toolbar */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="light" icon={FiArrowLeft} onClick={() => navigate("/addons/bpr")} />
          <div>
            <div className="flex items-center gap-2">
              <Title>{docInfo.name}</Title>
              <Badge color={docInfo.status === "Final" ? "emerald" : "orange"}>{docInfo.status}</Badge>
            </div>
            <Text className="text-xs text-gray-500">
              Versi {docInfo.version || 1} • {nodes.length} Langkah
            </Text>
          </div>
        </div>

        <div className="flex gap-2">
          {!isReadOnly && (
            <>
              <Button variant="secondary" icon={FiPlus} onClick={onAddNode}>
                Langkah
              </Button>
              <Button variant="secondary" icon={FiSave} loading={isSaving} onClick={onSave}>
                Simpan
              </Button>
            </>
          )}

          {/* Workflow Buttons */}
          {docInfo.status === "Draft" && (
            <Button icon={FiSend} onClick={() => openStatusConfirm("In Review")}>
              Submit Review
            </Button>
          )}
          {docInfo.status === "In Review" && canApprove && (
            <Button icon={FiCheckSquare} className="text-emerald-400" color="emerald" onClick={() => openStatusConfirm("Final")}>
              Approve & Finalize
            </Button>
          )}
        </div>
      </div>

      {/* Area Kanvas */}
      <div className="flex-grow relative flex">
        <div className="flex-grow h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick} // <-- Event Klik Node
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={!isReadOnly}
            nodesConnectable={!isReadOnly}
            elementsSelectable={!isReadOnly}
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
            <Panel position="top-right" className="bg-white/80 p-2 rounded shadow backdrop-blur text-xs text-slate-500">
              Klik Node untuk edit risiko. Tarik garis untuk menghubungkan.
            </Panel>
          </ReactFlow>
        </div>

        {/* Sidebar Component */}
        <NodeRiskSidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            setSelectedNode(null);
          }}
          selectedNode={selectedNode}
          onDataChange={fetchDiagram}
          onLabelChange={onNodeLabelChange}
        />
      </div>
      <ConfirmationDialog
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ ...statusConfirm, isOpen: false })}
        onConfirm={handleConfirmStatus}
        title="Konfirmasi Perubahan Status"
        message={`Apakah Anda yakin ingin mengubah status dokumen ini menjadi "${statusConfirm.newStatus}"?`}
        confirmButtonText={statusConfirm.newStatus === "Final" ? "Approve & Finalize" : "Ya, Lanjutkan"}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
}

export default BPRDesignerPage;
