import React, { useMemo, useCallback } from 'react';
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
    <div className="flex-1 flex h-full bg-aurora-bg overflow-hidden">
      {/* Central Graph Canvas & Controls */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Graph Controls Bar */}
        <div className="p-3 border-b border-aurora-border flex items-center justify-between bg-aurora-secondary/70 z-10 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-aurora-primary" />
              <span className="text-xs font-semibold text-aurora-textPrimary">
                Architecture Graph
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-md bg-aurora-card border border-aurora-border">
              <button
                onClick={() => setGraphViewMode('technical')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  graphViewMode === 'technical'
                    ? 'bg-aurora-primary text-aurora-bg shadow-sm font-semibold'
                    : 'text-aurora-textSecondary hover:text-aurora-textPrimary'
                }`}
              >
                Technical View
              </button>
              <button
                onClick={() => setGraphViewMode('executive')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  graphViewMode === 'executive'
                    ? 'bg-aurora-primary text-aurora-bg shadow-sm font-semibold'
                    : 'text-aurora-textSecondary hover:text-aurora-textPrimary'
                }`}
              >
                Executive View
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-aurora-textMuted font-mono">
              {(graph as any)?.summary?.totalFiles || (graph as any)?.nodes?.length || 0} files • {(graph as any)?.summary?.totalDependencies || (graph as any)?.edges?.length || 0} imports
            </span>

            <button
              onClick={handleRefreshGraph}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-aurora-card border border-aurora-border text-xs text-aurora-textSecondary hover:text-aurora-primary hover:border-aurora-primary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Scan Repo</span>
            </button>
          </div>
        </div>

        {/* Canvas or Executive Cards */}
        {graphViewMode === 'technical' ? (
          <div className="flex-1 w-full h-full relative">
            {graph ? (
              <ReactFlow
                nodes={graph.nodes as any}
                edges={graph.edges as any}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                fitView
              >
                <Background color="#27272a" gap={16} size={1} />
                <Controls className="!m-4" />
              </ReactFlow>
            ) : (
              <div className="flex items-center justify-center h-full text-aurora-textMuted text-xs">
                Scanning repository architecture...
              </div>
            )}
          </div>
        ) : (
          /* Executive View: High-level Module Breakdown */
          <div className="flex-1 p-6 overflow-y-auto bg-aurora-bg">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="border border-aurora-border rounded-lg p-4 bg-aurora-card/50">
                <h3 className="text-sm font-semibold text-aurora-textPrimary mb-1">
                  High-Level Architecture Blueprint
                </h3>
                <p className="text-xs text-aurora-textSecondary">
                  Simplified executive overview grouping project files into functional layers and operational domains.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {executiveModules.map((mod) => (
                  <div
                    key={mod.moduleName}
                    className="p-4 rounded-lg bg-aurora-card border border-aurora-border hover:border-aurora-primary/50 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-aurora-primary" />
                        <span className="text-sm font-semibold text-aurora-textPrimary">
                          {mod.moduleName}
                        </span>
                      </div>
                      {mod.modified && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-aurora-primaryMuted text-aurora-primary font-medium">
                          Active Changes
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-aurora-textSecondary mb-3">
                      Contains {mod.files.length} indexed source components
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.files.map((file) => (
                        <span
                          key={file}
                          className="px-2 py-0.5 rounded bg-aurora-secondary border border-aurora-border text-[11px] font-mono text-aurora-textPrimary"
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
        <div className="w-80 bg-aurora-secondary border-l border-aurora-border flex flex-col h-full select-none shrink-0">
          <div className="p-3 border-b border-aurora-border flex items-center justify-between">
            <span className="text-xs font-semibold text-aurora-textPrimary">Node Inspector</span>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-xs text-aurora-textMuted hover:text-aurora-textPrimary"
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
                  <div>
                    <div className="text-sm font-semibold text-aurora-textPrimary">{nodeData.label || selectedNode?.id}</div>
                    <button
                      onClick={() => handleOpenFile(nodeData.path)}
                      className="flex items-center gap-1 text-[11px] font-mono text-aurora-primary hover:underline mt-1"
                    >
                      <FileCode className="w-3 h-3" />
                      <span className="truncate">{nodeData.path}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-aurora-card border border-aurora-border">
                      <span className="text-[10px] text-aurora-textMuted block">Module</span>
                      <span className="font-semibold text-aurora-textPrimary">{nodeData.module || 'Default'}</span>
                    </div>
                    <div className="p-2 rounded bg-aurora-card border border-aurora-border">
                      <span className="text-[10px] text-aurora-textMuted block">Type</span>
                      <span className="font-semibold text-aurora-textPrimary capitalize">{nodeData.type || 'file'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-aurora-textSecondary block mb-1.5">
                      Imports ({imports.length})
                    </span>
                    <div className="space-y-1">
                      {imports.map((imp: string, idx: number) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded bg-aurora-card border border-aurora-border font-mono text-xs text-aurora-textSecondary"
                        >
                          {imp}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-aurora-textSecondary block mb-1.5">
                      Exports ({exports.length})
                    </span>
                    <div className="space-y-1">
                      {exports.map((exp: string, idx: number) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded bg-aurora-card border border-aurora-border font-mono text-xs text-aurora-primary"
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
