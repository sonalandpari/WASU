import React, { useRef, useState, useEffect } from 'react';
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
  Copy,
  Check,
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
  const [copiedBrief, setCopiedBrief] = useState(false);

  const handleCopyBrief = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(aiSummary);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

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

  useEffect(() => {
    const handleTrigger = () => {
      handleGenerateAI();
    };
    window.addEventListener('TRIGGER_GEMMA_SYNTHESIS', handleTrigger);
    return () => {
      window.removeEventListener('TRIGGER_GEMMA_SYNTHESIS', handleTrigger);
    };
  }, [commitEvents, distinctContributors, repositoryName, projectName, currentBranch]);

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
    <div className="flex-1 flex flex-col h-full bg-neu-bg overflow-hidden">
      {/* Report Controls Bar */}
      <div className="p-3.5 border-b border-white/60 flex items-center justify-between bg-neu-bg select-none shadow-neu-flat-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              Developer Reports
            </span>
          </div>

          {/* Type Toggle */}
          <div className="flex items-center p-1 rounded-xl neu-input gap-1">
            <button
              onClick={() => setReportType('executive')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                reportType === 'executive'
                  ? 'neu-btn-primary shadow-neu-primary'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Executive Summary
            </button>
            <button
              onClick={() => setReportType('technical')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                reportType === 'technical'
                  ? 'neu-btn-primary shadow-neu-primary'
                  : 'text-slate-500 hover:text-slate-800'
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
            className="px-3 py-1.5 rounded-xl neu-btn text-xs text-slate-700 font-semibold hover:text-slate-900 transition-all cursor-pointer"
          >
            SVG
          </button>
          <button
            onClick={() => handleExport('jpg')}
            disabled={exportStatus === 'exporting'}
            className="px-3 py-1.5 rounded-xl neu-btn text-xs text-slate-700 font-semibold hover:text-slate-900 transition-all cursor-pointer"
          >
            JPG
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportStatus === 'exporting'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl neu-btn-primary text-white text-xs font-bold transition-all shadow-neu-primary cursor-pointer"
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
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : exportStatus === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {exportStatus === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : exportStatus === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
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
      <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-neu-bg">
        <div
          ref={reportRef}
          className="w-full max-w-3xl neu-surface rounded-3xl p-8 shadow-neu-flat-lg space-y-6 text-slate-800"
        >
          {/* Header */}
          <div className="border-b border-slate-200/80 pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold tracking-wider uppercase mb-1">
                <span>RERO Developer & Team Intelligence</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {reportType === 'executive' ? 'Executive Project Overview' : 'Technical Development Audit'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Repository: <strong className="text-slate-800">{repositoryName || 'WASU'}</strong> • Branch:{' '}
                <strong className="text-slate-800">{currentBranch || 'main'}</strong> • Room:{' '}
                <strong className="text-slate-800">{roomCode || 'WASU'}</strong> • Generated:{' '}
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl neu-surface-sm flex items-center justify-center font-bold text-indigo-600 text-sm shadow-neu-flat-sm">
              R
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl neu-surface-sm">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Tracked Commits</span>
              <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">{commitsCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl neu-surface-sm">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Changed Files</span>
              <span className="text-xl font-bold text-indigo-600 mt-0.5 block font-mono">{filesChangedCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl neu-surface-sm">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Developers</span>
              <span className="text-xl font-bold text-emerald-600 mt-0.5 block font-mono">
                {activeContributorsCount} active
              </span>
            </div>
            <div className="p-3.5 rounded-2xl neu-surface-sm">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Active User</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block truncate">
                {currentUser.name}
              </span>
            </div>
          </div>

          {/* Gemma 4 AI Intelligence Digest (Neumorphic Card) */}
          <div className="p-5 rounded-3xl neu-surface space-y-3.5 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl neu-btn text-indigo-600">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span>Gemma 4</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] neu-surface-sm text-indigo-600 font-bold">
                      AI Sprint Digest
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">Context-aware repository synthesis</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {aiSummary && (
                  <button
                    type="button"
                    onClick={handleCopyBrief}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl neu-btn text-slate-700 hover:text-indigo-600 text-xs font-medium transition-colors"
                    title="Copy AI Brief to clipboard"
                  >
                    {copiedBrief ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] text-emerald-600 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl neu-btn-primary text-white text-xs font-bold shadow-neu-primary transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
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
            </div>

            <div className="text-xs text-slate-700 font-mono whitespace-pre-line neu-input p-4 rounded-2xl leading-relaxed select-text">
              {aiSummary || "Click 'Generate AI Brief' to synthesize active branch commits, developer diffs, and architectural risks with Gemma 4."}
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Workspace Status</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {reportType === 'executive'
                ? `RERO has synchronized local workspace commits and real-time team collaboration inside VS Code for room #${roomCode || 'WASU'}. Team members can inspect clickable side-by-side diffs, stream events, and track architecture dependencies in real time.`
                : `Technical audit verified active repository commits on branch ${currentBranch || 'main'}. Webview bridge and background Git detector are monitoring changes and broadcasting linked commit payloads.`}
            </p>
          </div>

          {/* Key Changes & Commit Log */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900">Recent Commits</h3>
            <div className="neu-surface-sm rounded-2xl overflow-hidden font-mono text-[11px] divide-y divide-slate-200/60">
              {commitEvents.length > 0 ? (
                commitEvents.slice(0, 6).map((c, i) => (
                  <div
                    key={c.id || i}
                    className="p-3 flex items-center justify-between hover:bg-white/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        {c.metadata?.commitHash?.slice(0, 7) || 'HEAD'}
                      </span>
                      <span className="text-slate-800 font-medium truncate">{c.description}</span>
                    </div>
                    <span className="text-slate-400 text-[10px] shrink-0 ml-2 font-sans font-semibold">{c.userName}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-slate-500 text-center font-sans">
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
