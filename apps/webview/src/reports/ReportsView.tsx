import React, { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { vsCodeBridge } from '../services/vscodeBridge';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  FileBarChart,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  GitCommit,
  Layers,
  Users,
  Code2,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    reportType,
    setReportType,
    exportStatus,
    setExportStatus,
    exportProgress,
    projectName,
    currentBranch,
  } = useAppStore();

  const reportRef = useRef<HTMLDivElement>(null);
  const [downloadFormat, setDownloadFormat] = useState<'svg' | 'jpg' | 'pdf'>('pdf');

  const handleExport = async (format: 'svg' | 'jpg' | 'pdf') => {
    if (!reportRef.current) return;
    setExportStatus('exporting', 20);

    try {
      if (format === 'svg') {
        setExportStatus('exporting', 60);
        // Serialize HTML container to SVG foreignObject
        const html = reportRef.current.innerHTML;
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: sans-serif; background: #0B0F14; color: #E8F0F6; padding: 24px;">
              ${html}
            </div>
          </foreignObject>
        </svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ContextFlow-${reportType}-Report.svg`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        setExportStatus('exporting', 50);
        const canvas = await html2canvas(reportRef.current, {
          backgroundColor: '#0B0F14',
          scale: 2,
        });

        if (format === 'jpg') {
          setExportStatus('exporting', 80);
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `ContextFlow-${reportType}-Report.jpg`;
          link.click();
        } else if (format === 'pdf') {
          setExportStatus('exporting', 85);
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width / 2, canvas.height / 2],
          });
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
          pdf.save(`ContextFlow-${reportType}-Report.pdf`);
        }
      }

      setExportStatus('success', 100);
      vsCodeBridge.postMessage({
        type: 'EXPORT_REPORT',
        payload: { format, reportId: `rep-${Date.now()}` },
      });

      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setExportStatus('error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-aurora-bg overflow-hidden">
      {/* Report Controls Bar */}
      <div className="p-3 border-b border-aurora-border flex items-center justify-between bg-aurora-secondary/60 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-aurora-primary" />
            <span className="text-xs font-semibold text-aurora-textPrimary">
              Stakeholder Reports
            </span>
          </div>

          {/* Type Toggle */}
          <div className="flex items-center p-0.5 rounded-md bg-aurora-card border border-aurora-border">
            <button
              onClick={() => setReportType('executive')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                reportType === 'executive'
                  ? 'bg-aurora-primary text-aurora-bg font-semibold'
                  : 'text-aurora-textSecondary hover:text-aurora-textPrimary'
              }`}
            >
              Executive Report
            </button>
            <button
              onClick={() => setReportType('technical')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                reportType === 'technical'
                  ? 'bg-aurora-primary text-aurora-bg font-semibold'
                  : 'text-aurora-textSecondary hover:text-aurora-textPrimary'
              }`}
            >
              Technical Report
            </button>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('svg')}
            disabled={exportStatus === 'exporting'}
            className="px-2.5 py-1 rounded bg-aurora-card border border-aurora-border text-xs text-aurora-textSecondary hover:text-aurora-primary hover:border-aurora-primary transition-colors"
          >
            SVG
          </button>
          <button
            onClick={() => handleExport('jpg')}
            disabled={exportStatus === 'exporting'}
            className="px-2.5 py-1 rounded bg-aurora-card border border-aurora-border text-xs text-aurora-textSecondary hover:text-aurora-primary hover:border-aurora-primary transition-colors"
          >
            JPG
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportStatus === 'exporting'}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-aurora-primary text-aurora-bg text-xs font-semibold hover:bg-aurora-primary/90 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Export Status Feedback Banner */}
      {exportStatus !== 'idle' && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
            exportStatus === 'exporting'
              ? 'bg-aurora-primaryMuted text-aurora-primary border-aurora-primary/30'
              : exportStatus === 'success'
              ? 'bg-aurora-successMuted text-aurora-success border-aurora-success/30'
              : 'bg-aurora-errorMuted text-aurora-error border-aurora-error/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {exportStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : exportStatus === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-aurora-primary border-t-transparent animate-spin" />
            )}
            <span>
              {exportStatus === 'exporting'
                ? `Rendering high-res document (${exportProgress}%)...`
                : exportStatus === 'success'
                ? 'Report downloaded successfully!'
                : 'Failed to generate report export.'}
            </span>
          </div>
        </div>
      )}

      {/* Report Preview Document */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-aurora-secondary/30">
        <div
          ref={reportRef}
          className="w-full max-w-3xl bg-aurora-card border border-aurora-border rounded-xl p-8 shadow-xl space-y-6"
        >
          {/* Header */}
          <div className="border-b border-aurora-border pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-aurora-primary text-xs font-semibold tracking-wider uppercase mb-1">
                <span>ContextFlow Stakeholder Intelligence</span>
              </div>
              <h1 className="text-2xl font-bold text-aurora-textPrimary tracking-tight">
                {reportType === 'executive' ? 'Executive Project Overview' : 'Technical Development Audit'}
              </h1>
              <p className="text-xs text-aurora-textSecondary mt-1">
                Project: <strong className="text-aurora-textPrimary">{projectName}</strong> • Branch:{' '}
                <strong className="text-aurora-textPrimary">{currentBranch}</strong> • Generated:{' '}
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-aurora-primaryMuted border border-aurora-primary/30 flex items-center justify-center font-bold text-aurora-primary">
              CF
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-aurora-secondary border border-aurora-border">
              <span className="text-[10px] text-aurora-textMuted uppercase font-semibold block">Commits</span>
              <span className="text-xl font-bold text-aurora-textPrimary mt-0.5 block">14</span>
            </div>
            <div className="p-3 rounded-lg bg-aurora-secondary border border-aurora-border">
              <span className="text-[10px] text-aurora-textMuted uppercase font-semibold block">Files Changed</span>
              <span className="text-xl font-bold text-aurora-primary mt-0.5 block">24</span>
            </div>
            <div className="p-3 rounded-lg bg-aurora-secondary border border-aurora-border">
              <span className="text-[10px] text-aurora-textMuted uppercase font-semibold block">Net Additions</span>
              <span className="text-xl font-bold text-aurora-success mt-0.5 block">+1,420</span>
            </div>
            <div className="p-3 rounded-lg bg-aurora-secondary border border-aurora-border">
              <span className="text-[10px] text-aurora-textMuted uppercase font-semibold block">Contributors</span>
              <span className="text-xl font-bold text-aurora-secondaryAccent mt-0.5 block">4 active</span>
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-aurora-textPrimary">Executive Summary</h3>
            <p className="text-xs text-aurora-textSecondary leading-relaxed">
              {reportType === 'executive'
                ? 'During this development cycle, the team successfully unified workspace communication and code changes directly inside VS Code. The Arctic Aurora design system was deployed, linking code diffs to developer discussions and synchronizing architecture dependencies in real time.'
                : 'Architectural AST scanner verified 24 source modules and 46 dependency relationships. Realtime gateway was updated with Socket.IO room management, and Git deep-linking now tracks selected line numbers through the VS Code Webview bridge.'}
            </p>
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-aurora-textPrimary">Milestone Deliverables</h3>
            <ul className="space-y-1.5 text-xs text-aurora-textSecondary list-disc list-inside">
              <li>Integrated React Flow technical dependency graph and modular executive overview.</li>
              <li>Enabled line-level code discussion links with VS Code Editor navigation.</li>
              <li>Configured real-time presence indicators and file-save grouping.</li>
              <li>Added client-side multi-format stakeholder exports (PDF, SVG, JPG).</li>
            </ul>
          </div>

          {/* Changelog */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-aurora-textPrimary">Key Changes & Commit Log</h3>
            <div className="border border-aurora-border rounded-lg overflow-hidden font-mono text-[11px]">
              <div className="p-2 bg-aurora-secondary border-b border-aurora-border flex items-center justify-between">
                <span>feat(api): implement Socket.IO project room sync</span>
                <span className="text-aurora-success">+142 / -18</span>
              </div>
              <div className="p-2 bg-aurora-secondary/50 border-b border-aurora-border flex items-center justify-between">
                <span>feat(ui): complete Arctic Aurora responsive webview layout</span>
                <span className="text-aurora-success">+380 / -0</span>
              </div>
              <div className="p-2 bg-aurora-secondary/30 flex items-center justify-between">
                <span>feat(graph): incremental AST dependency scanner</span>
                <span className="text-aurora-success">+210 / -12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
