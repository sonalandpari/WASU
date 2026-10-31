import React from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { ArchitectureNodeData } from '@contextflow/shared';
import { FileCode, Layers, ShieldCheck, Box, Database, Sparkles } from 'lucide-react';

export type CustomNodeType = Node<ArchitectureNodeData, 'custom'>;

export const CustomArchitectureNode: React.FC<NodeProps<CustomNodeType>> = ({ data, selected }) => {
  const getNodeTypeBadge = () => {
    switch (data.type) {
      case 'component':
        return { icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' };
      case 'store':
        return { icon: Database, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' };
      case 'type':
        return { icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
      default:
        return { icon: FileCode, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' };
    }
  };

  const badge = getNodeTypeBadge();
  const Icon = badge.icon;

  return (
    <div
      className={`relative px-3.5 py-2.5 rounded-xl bg-neu-bg min-w-[170px] max-w-[230px] transition-all duration-200 select-none ${
        selected
          ? 'shadow-neu-inset ring-2 ring-indigo-500/60 border border-indigo-400'
          : data.modified
          ? 'shadow-neu-flat ring-1 ring-emerald-500/50 border border-emerald-400'
          : 'shadow-neu-flat border border-white/80 hover:shadow-neu-flat-lg'
      }`}
    >
      {/* Target and Source Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-indigo-500 border-2 !border-white rounded-full shadow-sm"
      />

      {data.modified && (
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
        </span>
      )}

      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg border ${badge.bg} ${badge.color} shadow-neu-badge`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-800 truncate">
            {data.label}
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate">
            {data.module}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-200/80 tabular-nums">
        <span>{data.imports.length} imports</span>
        <span>{data.exports.length} exports</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-indigo-500 border-2 !border-white rounded-full shadow-sm"
      />
    </div>
  );
};
