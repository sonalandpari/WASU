import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '../store/useAppStore';
import { CustomArchitectureNode } from './CustomArchitectureNode';
import { vsCodeBridge } from '../services/vscodeBridge';
import {
  Network,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  FileCode,
  Box,
  Share2,
} from 'lucide-react';

const nodeTypes = {
  custom: CustomArchitectureNode,
};

export const ArchitectureView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    graph,
    graphViewMode,
    setGraphViewMode,
    selectedNodeId,
    setSelectedNodeId,
    setGraph,
  } = useAppStore();

  const handleRefreshGraph = () => {
    vsCodeBridge.postMessage({ type: 'REFRESH_GRAPH' });
  };

  const handleOpenFile = (path: string) => {
    vsCodeBridge.postMessage({
      type: 'OPEN_FILE',
      payload: { path },
    });
  };

  const displayedNodes = useMemo(() => {
    if (!graph?.nodes) return [];
    if (!searchTerm.trim()) return graph.nodes as any[];
    const term = searchTerm.toLowerCase();
    return (graph.nodes as any[]).map((n: any) => ({
      ...n,
      selected: n.id === selectedNodeId || String(n.data?.label || '').toLowerCase().includes(term),
    }));
  }, [graph?.nodes, searchTerm, selectedNodeId]);

  const selectedNode = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    return (graph.nodes as any[]).find((n: any) => n.id === selectedNodeId);
  }, [graph, selectedNodeId]);

  // Executive view grouped modules
  const executiveModules = useMemo(() => {
    if (!graph) return [];
    const map = new Map<string, { files: string[]; modified: boolean }>();
    (graph.nodes as any[]).forEach((n: any) => {
      const data = n.data || {};
      const mod = String(data.module || 'Common');
      const existing = map.get(mod) || { files: [], modified: false };
      existing.files.push(String(data.label || n.id));
      if (data.modified) existing.modified = true;
      map.set(mod, existing);
    });
    return Array.from(map.entries()).map(([moduleName, details]) => ({
      moduleName,
      ...details,
    }));
  }, [graph]);

  return (
    <div className="flex-1 flex h-full bg-neu-bg overflow-hidden text-slate-800">
      {/* Central Graph Canvas & Controls */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Graph Controls Bar */}
        <div className="p-3 border-b border-white/70 flex items-center justify-between bg-neu-bg/95 z-10 select-none shadow-neu-flat-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg neu-surface-sm text-indigo-600 shadow-neu-flat-sm">
                <Network className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Architecture Graph
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-xl neu-input gap-0.5">
              <button
                onClick={() => setGraphViewMode('technical')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  graphViewMode === 'technical'
                    ? 'neu-btn-primary shadow-neu-primary'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Technical View
              </button>
              <button
                onClick={() => setGraphViewMode('executive')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  graphViewMode === 'executive'
                    ? 'neu-btn-primary shadow-neu-primary'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Executive View
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Nodes */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search nodes..."
                className="pl-8 pr-2.5 py-1.5 rounded-xl neu-input text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-40 transition-all font-sans"
              />
            </div>

            <span className="text-[11px] text-slate-500 font-mono tabular-nums px-2">
              {(graph as any)?.summary?.totalFiles || (graph as any)?.nodes?.length || 0} files • {(graph as any)?.summary?.totalDependencies || (graph as any)?.edges?.length || 0} imports
            </span>

            <button
              onClick={handleRefreshGraph}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn text-xs text-slate-700 hover:text-indigo-600 font-medium transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Scan Repo</span>
            </button>
          </div>
        </div>

        {/* Canvas or Executive Cards */}
        {graphViewMode === 'technical' ? (
          <div className="flex-1 w-full h-full relative bg-neu-bg">
            {graph ? (
              <ReactFlow
                nodes={displayedNodes}
                edges={graph.edges as any}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                fitView
              >
                <Background color="#cbd5e1" gap={18} size={1.2} />
                <Controls className="!m-4 !bg-neu-bg !rounded-xl !border-white/80 !shadow-neu-flat" />
              </ReactFlow>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Scanning repository architecture...
              </div>
            )}
          </div>
        ) : (
          /* Executive View: High-level Module Breakdown */
          <div className="flex-1 p-6 overflow-y-auto bg-neu-bg">
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="rounded-2xl p-5 neu-card">
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  High-Level Architecture Blueprint
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Simplified executive overview grouping project files into functional layers and operational domains.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {executiveModules.map((mod) => (
                  <div
                    key={mod.moduleName}
                    className="p-5 rounded-2xl neu-card hover:scale-[1.01] transition-all"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg neu-surface-sm text-indigo-600">
                          <Box className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">
                          {mod.moduleName}
                        </span>
                      </div>
                      {mod.modified && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold shadow-neu-badge">
                          Active Changes
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mb-3 font-medium">
                      Contains {mod.files.length} indexed source components
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.files.map((file) => (
                        <span
                          key={file}
                          className="px-2.5 py-1 rounded-lg neu-surface-sm text-[11px] font-mono text-slate-700 shadow-neu-flat-sm"
                        >
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && graphViewMode === 'technical' && (
        <div className="w-80 bg-neu-bg border-l border-white/70 flex flex-col h-full select-none shrink-0 shadow-neu-flat">
          <div className="p-3.5 border-b border-white/70 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Node Inspector</span>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-lg neu-btn cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto">
            {(() => {
              const nodeData = (selectedNode?.data || {}) as any;
              const imports = (nodeData.imports || []) as string[];
              const exports = (nodeData.exports || []) as string[];
              return (
                <>
                  <div className="p-3.5 rounded-xl neu-card">
                    <div className="text-sm font-bold text-slate-800">{nodeData.label || selectedNode?.id}</div>
                    <button
                      onClick={() => handleOpenFile(nodeData.path)}
                      className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-600 hover:underline mt-1.5"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span className="truncate">{nodeData.path}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl neu-surface-sm">
                      <span className="text-[10px] text-slate-500 block font-medium">Module</span>
                      <span className="font-bold text-slate-800">{nodeData.module || 'Default'}</span>
                    </div>
                    <div className="p-3 rounded-xl neu-surface-sm">
                      <span className="text-[10px] text-slate-500 block font-medium">Type</span>
                      <span className="font-bold text-slate-800 capitalize">{nodeData.type || 'file'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Imports ({imports.length})
                    </span>
                    <div className="space-y-1.5">
                      {imports.map((imp: string, idx: number) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg neu-surface-sm font-mono text-xs text-slate-600 shadow-neu-flat-sm truncate"
                        >
                          {imp}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Exports ({exports.length})
                    </span>
                    <div className="space-y-1.5">
                      {exports.map((exp: string, idx: number) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg neu-surface-sm font-mono text-xs text-indigo-600 font-medium shadow-neu-flat-sm truncate"
                        >
                          {exp}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
