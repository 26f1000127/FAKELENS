import React from 'react';
import {
  UploadCloud,
  Layers,
  ShieldCheck,
  Wand2,
  Zap,
  Info,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  FileSearch,
  Plus
} from 'lucide-react';
import { CircularProgress } from '../components/common/CircularProgress';
import { Badge } from '../components/common/Badge';
import { PageId } from '../components/layout/Sidebar';
import { AuditItem } from '../types';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
  onSelectAudit: (audit: AuditItem) => void;
  audits?: AuditItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectAudit, audits = [] }) => {
  const handleUploadClick = () => {
    onNavigate('new-audit');
  };

  const handleAuditClick = (audit: AuditItem) => {
    onSelectAudit(audit);
    onNavigate('new-audit');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#121829] via-[#0E1322] to-[#0A0D18] border border-white/10 p-6 sm:p-10 overflow-hidden shadow-2xl">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-2">
                Brand Governance With AI
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Verify. Align.{' '}
                <span className="relative inline-block text-purple-400">
                  Approve.
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-purple-500/70"
                    viewBox="0 0 160 12"
                    fill="none"
                  >
                    <path
                      d="M2 9C50 2 110 2 158 9"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </div>

            <p className="text-base text-slate-300 max-w-xl leading-relaxed">
              Check your content, ad designs, and claims against your brand guidelines — and get an instant AI decision.
            </p>

            {/* Upload Drag & Drop Trigger Card */}
            <div
              onClick={handleUploadClick}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-indigo-500/30 hover:border-purple-400/60 bg-[#141B30]/60 hover:bg-[#161F38]/80 p-6 sm:p-8 text-center transition-all duration-300 transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleUploadClick();
                }
              }}
            >
              <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform mb-3">
                <UploadCloud className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Upload or drag &amp; drop your content
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Ad design • Image • Text • PDF • Video
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Content
              </button>
            </div>
          </div>

          {/* Right Hero Visual Illustration */}
          <div className="lg:col-span-5 relative flex justify-center items-center py-4">
            <div className="relative w-full max-w-sm h-72 sm:h-80 flex items-center justify-center">
              {/* Back Card layer */}
              <div className="absolute w-52 h-64 rounded-3xl bg-gradient-to-br from-indigo-700/30 to-purple-800/20 border border-indigo-500/30 backdrop-blur-md transform -rotate-12 translate-x-4 shadow-2xl" />

              {/* Front Glowing Card */}
              <div className="absolute w-56 h-68 rounded-3xl bg-gradient-to-br from-purple-900/60 via-indigo-950/70 to-slate-900/80 border border-purple-400/40 backdrop-blur-lg transform -rotate-6 shadow-2xl p-5 flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs text-purple-300">
                  <span className="font-mono text-[10px]">VERIFY-AI-CHECK</span>
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                </div>
                <div className="my-auto flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-white shadow-inner">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="w-3/4 h-2 bg-purple-500/30 rounded" />
                  <div className="w-1/2 h-2 bg-indigo-500/20 rounded" />
                </div>
              </div>

              {/* Verification Pills */}
              <div className="absolute top-4 -right-2 z-20 space-y-2">
                <div className="flex items-center gap-2 bg-[#121829]/95 border border-white/10 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Brand Match</span>
                </div>
                <div className="flex items-center gap-2 bg-[#121829]/95 border border-white/10 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Fact Check</span>
                </div>
                <div className="flex items-center gap-2 bg-[#121829]/95 border border-white/10 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Design Check</span>
                </div>
              </div>

              {/* Glowing Green "AI Approved" Badge */}
              <div className="absolute -bottom-2 -right-1 z-30 transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 text-white shadow-[0_0_35px_rgba(16,185,129,0.5)] backdrop-blur-xl">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[#0A0D18]">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="font-bold text-sm sm:text-base tracking-wide text-white">AI Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Feature 1 */}
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 hover:border-purple-500/30 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1.5">Brand Consistency</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Checks logo, colours, fonts, layout, and overall design.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 hover:border-purple-500/30 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1.5">Fact Checking</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Verifies claims and identifies unsupported or outdated information.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 hover:border-purple-500/30 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3">
            <Wand2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1.5">AI Auto-Fix</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Suggests or automatically applies corrections while keeping your intent.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 hover:border-purple-500/30 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1.5">Instant Decision</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get a final AI verdict — Approved or Needs Fix.
          </p>
        </div>
      </div>

      {/* Bottom Section: Honest Brand Health + Honest Recent Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Brand Health Card — Honest Initial State */}
        <div className="lg:col-span-5 rounded-3xl bg-[#121727] border border-white/5 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Brand Health</h2>
              <span title="Aggregated brand compliance score across processed audits">
                <Info className="w-4 h-4 text-slate-400 hover:text-slate-200 cursor-pointer" />
              </span>
            </div>
          </div>

          <div className="my-auto py-6 flex flex-col sm:flex-row items-center gap-6">
            {/* Empty state gauge: 0% / dashed track */}
            <div className="relative inline-flex items-center justify-center flex-shrink-0 w-28 h-28">
              <CircularProgress percentage={0} size={112} strokeWidth={9} strokeColor="#334155" showPercentageText={false} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-500 tracking-tight">—</span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-base font-bold text-white">Compliance Score</span>
              </div>
              <div>
                <span className="inline-flex items-center rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2.5 py-1 font-medium">
                  Awaiting First Audit
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                No content audits have been conducted yet. Upload content to establish your initial compliance score.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Benchmark: No telemetry yet</span>
            <span>0 active evaluations</span>
          </div>
        </div>

        {/* Recent Audits Card — Honest Empty State */}
        <div className="lg:col-span-7 rounded-3xl bg-[#121727] border border-white/5 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Recent Audits</h2>
            {audits.length > 0 && (
              <button
                onClick={() => onNavigate('audit-history')}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400 rounded"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {audits.length === 0 ? (
            <div className="my-auto py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0E1322] border border-white/5 mx-auto flex items-center justify-center text-slate-500">
                <FileSearch className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">No Audits Recorded</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  Uploaded content and compliance decisions will appear here once processed.
                </p>
              </div>
              <button
                type="button"
                onClick={handleUploadClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Start First Audit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {audits.slice(0, 3).map((audit) => (
                <div
                  key={audit.id}
                  onClick={() => handleAuditClick(audit)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAuditClick(audit);
                    }
                  }}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#0E1322] border border-white/5 hover:border-purple-500/30 hover:bg-[#141B30] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-purple-900/30 border border-purple-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center text-purple-300 font-semibold text-xs">
                      {audit.thumbnailUrl ? (
                        <img
                          src={audit.thumbnailUrl}
                          alt={audit.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span>{audit.type.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                        {audit.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {audit.type} • {audit.relativeTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge status={audit.status} size="sm" />
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-white/5 text-[11px] text-slate-500 flex justify-between">
            <span>Audit Pipeline Status</span>
            <span className="text-purple-400">Ready for Content</span>
          </div>
        </div>
      </div>
    </div>
  );
};
