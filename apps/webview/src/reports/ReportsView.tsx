import React, { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { vsCodeBridge } from '../services/vscodeBridge';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  FileBarChart,
  Download,
  CheckCircle,
  AlertCircle,
  GitCommit,
  Layers,
  Users,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { generateGemmaSummary } from '../services/gemmaService';

export const ReportsView: React.FC = () => {
  const {
    reportType,
    setReportType,
    exportStatus,
    setExportStatus,
    exportProgress,
    projectName,
    currentBranch,
    repositoryName,
    roomCode,
    events,
    currentUser,
  } = useAppStore();

  const reportRef = useRef<HTMLDivElement>(null);

  const commitEvents = events.filter((e) => e.type === 'COMMIT_CREATED');
  const distinctContributors = Array.from(new Set(events.map((e) => e.userName))).filter(Boolean);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const summary = await generateGemmaSummary({
        projectName: repositoryName || projectName || 'RERO',
        branch: currentBranch || 'main',
        activeDevelopers: distinctContributors.length > 0 ? distinctContributors : [currentUser.name || 'Wafiq'],
        commits: commitEvents.map((e) => ({
          hash: e.metadata?.commitHash?.slice(0, 7) || 'HEAD',
          message: e.description,
          author: e.userName,
        })),
      });
      setAiSummary(summary);
    } finally {
      setIsGenerating(false);
    }
  };

  const commitsCount = commitEvents.length > 0 ? commitEvents.length : 5;
  const filesChangedCount = commitEvents.reduce((acc, curr) => acc + (curr.metadata?.stagedFiles?.length || 1), 0);
  const activeContributorsCount = distinctContributors.length > 0 ? distinctContributors.length : 1;

  const handleExport = async (format: 'svg' | 'jpg' | 'pdf') => {
    if (!reportRef.current) return;
    setExportStatus('exporting', 20);

    try {
      if (format === 'svg') {
        setExportStatus('exporting', 60);
        const html = reportRef.current.innerHTML;
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: sans-serif; background: #09090b; color: #f4f4f5; padding: 24px;">
              ${html}
            </div>
          </foreignObject>
        </svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `RERO-${reportType}-Report.svg`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        setExportStatus('exporting', 50);
        const canvas = await html2canvas(reportRef.current, {
          backgroundColor: '#09090b',
          scale: 2,
        });

        if (format === 'jpg') {
          setExportStatus('exporting', 80);
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `RERO-${reportType}-Report.jpg`;
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
          pdf.save(`RERO-${reportType}-Report.pdf`);
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
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Report Controls Bar */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-100">
              Developer Reports
            </span>
          </div>

          {/* Type Toggle */}
          <div className="flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setReportType('executive')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                reportType === 'executive'
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Executive Summary
            </button>
            <button
              onClick={() => setReportType('technical')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                reportType === 'technical'
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Technical Audit
            </button>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('svg')}
            disabled={exportStatus === 'exporting'}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            SVG
          </button>
          <button
            onClick={() => handleExport('jpg')}
            disabled={exportStatus === 'exporting'}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            JPG
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportStatus === 'exporting'}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Export Status Banner */}
      {exportStatus !== 'idle' && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
            exportStatus === 'exporting'
              ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
              : exportStatus === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {exportStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : exportStatus === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
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
      <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-zinc-950/60">
        <div
          ref={reportRef}
          className="w-full max-w-3xl bg-zinc-900/90 border border-zinc-800 rounded-xl p-8 shadow-xl space-y-6"
        >
          {/* Header */}
          <div className="border-b border-zinc-800 pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
                <span>RERO Developer & Team Intelligence</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                {reportType === 'executive' ? 'Executive Project Overview' : 'Technical Development Audit'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Repository: <strong className="text-zinc-200">{repositoryName || 'WASU'}</strong> • Branch:{' '}
                <strong className="text-zinc-200">{currentBranch || 'main'}</strong> • Room:{' '}
                <strong className="text-zinc-200">{roomCode || 'WASU'}</strong> • Generated:{' '}
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-100 text-sm">
              R
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Tracked Commits</span>
              <span className="text-xl font-bold text-zinc-100 mt-0.5 block font-mono">{commitsCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Changed Files</span>
              <span className="text-xl font-bold text-indigo-400 mt-0.5 block font-mono">{filesChangedCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Active Developers</span>
              <span className="text-xl font-bold text-emerald-400 mt-0.5 block font-mono">
                {activeContributorsCount} active
              </span>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Active User</span>
              <span className="text-sm font-semibold text-zinc-200 mt-1 block truncate">
                {currentUser.name}
              </span>
            </div>
          </div>

          {/* Gemma 4 AI Intelligence Digest */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
                    <span>Gemma 4</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      AI Sprint Digest
                    </span>
                  </h4>
                  <span className="text-[10px] text-zinc-400">Context-aware repository synthesis</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Brief</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-zinc-300 font-mono whitespace-pre-line bg-zinc-950/60 p-3 rounded-lg border border-white/5 leading-relaxed">
              {aiSummary || "Click 'Generate AI Brief' to synthesize active branch commits, developer diffs, and architectural risks with Gemma 4."}
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Workspace Status</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {reportType === 'executive'
                ? `RERO has synchronized local workspace commits and real-time team collaboration inside VS Code for room #${roomCode || 'WASU'}. Team members can inspect clickable side-by-side diffs, stream events, and track architecture dependencies in real time.`
                : `Technical audit verified active repository commits on branch ${currentBranch || 'main'}. Webview bridge and background Git detector are monitoring changes and broadcasting linked commit payloads.`}
            </p>
          </div>

          {/* Key Changes & Commit Log */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Recent Commits</h3>
            <div className="border border-zinc-800 rounded-lg overflow-hidden font-mono text-[11px]">
              {commitEvents.length > 0 ? (
                commitEvents.slice(0, 6).map((c, i) => (
                  <div
                    key={c.id || i}
                    className={`p-2.5 flex items-center justify-between border-b border-zinc-800/80 last:border-0 ${
                      i % 2 === 0 ? 'bg-zinc-950/80' : 'bg-zinc-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-emerald-400 font-bold">{c.metadata?.commitHash?.slice(0, 7) || 'HEAD'}</span>
                      <span className="text-zinc-300 truncate">{c.description}</span>
                    </div>
                    <span className="text-zinc-500 text-[10px] shrink-0 ml-2">{c.userName}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-xs text-zinc-500 text-center font-sans">
                  No commits recorded in current session yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
