import React from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { ArchitectureNodeData } from '@contextflow/shared';
import { FileCode, Layers, ShieldCheck, Box, Database, Sparkles } from 'lucide-react';

export type CustomNodeType = Node<ArchitectureNodeData, 'custom'>;

export const CustomArchitectureNode: React.FC<NodeProps<CustomNodeType>> = ({ data, selected }) => {
  const getNodeTypeBadge = () => {
    switch (data.type) {
      case 'component':
        return { icon: Box, color: 'text-aurora-primary', bg: 'bg-aurora-primaryMuted' };
      case 'store':
        return { icon: Database, color: 'text-aurora-secondaryAccent', bg: 'bg-aurora-secondaryMuted' };
      case 'type':
        return { icon: Layers, color: 'text-aurora-warning', bg: 'bg-aurora-warningMuted' };
      default:
        return { icon: FileCode, color: 'text-aurora-textSecondary', bg: 'bg-aurora-card' };
    }
  };

  const badge = getNodeTypeBadge();
  const Icon = badge.icon;

  return (
    <div
      className={`relative px-3 py-2 rounded-lg bg-aurora-card border min-w-[160px] max-w-[220px] transition-all duration-200 select-none shadow-md ${
        selected
          ? 'border-aurora-primary ring-2 ring-aurora-primary/40 shadow-aurora-primary/10'
          : data.modified
          ? 'border-aurora-primary/70 ring-1 ring-aurora-primary/30'
          : 'border-aurora-border hover:border-aurora-textMuted'
      }`}
    >
      {/* Target and Source Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-aurora-border hover:!bg-aurora-primary border border-aurora-card"
      />

      {data.modified && (
        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aurora-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-aurora-primary"></span>
        </span>
      )}

      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1 rounded ${badge.bg} ${badge.color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-aurora-textPrimary truncate">
            {data.label}
          </div>
          <div className="text-[10px] text-aurora-textMuted truncate">
            {data.module}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-aurora-textMuted font-mono pt-1 border-t border-aurora-borderSubtle">
        <span>{data.imports.length} imports</span>
        <span>{data.exports.length} exports</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-aurora-border hover:!bg-aurora-primary border border-aurora-card"
      />
    </div>
  );
};
