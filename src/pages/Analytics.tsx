import React, { useState } from 'react';
import {
  BarChart2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Image as ImageIcon,
  Video,
  FileCheck,
  ChevronDown,
  Download
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { ToastType } from '../components/common/Toast';

interface AnalyticsProps {
  onShowToast?: (message: string, type?: ToastType) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onShowToast }) => {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const dateRangeOptions = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Year to Date'];

  const handleExport = () => {
    if (onShowToast) {
      onShowToast('Export queued: Real audit analytics will export as CSV when backend is connected.', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Analytics</h1>
            <p className="text-xs text-slate-400">
              Understand your brand compliance, audits, and improvement areas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export Report Action */}
          <Button variant="secondary" size="sm" onClick={handleExport} icon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>

          {/* Date range picker dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121727] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-1.5 w-40 bg-[#121727] border border-white/10 rounded-2xl shadow-2xl py-1 z-30 animate-fade-in">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setDateRange(opt);
                      setShowDateDropdown(false);
                      if (onShowToast) onShowToast(`Filtered analytics for ${opt}.`, 'info');
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                      dateRange === opt
                        ? 'bg-purple-600/30 text-purple-300 font-semibold'
                        : 'text-slate-300 hover:bg-[#1A2238] hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Audits */}
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 flex items-center gap-4 hover:border-purple-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Audits</p>
            <p className="text-2xl font-extrabold text-white">—</p>
          </div>
        </div>

        {/* Approved */}
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 flex items-center gap-4 hover:border-purple-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Approved</p>
            <p className="text-2xl font-extrabold text-white">—</p>
          </div>
        </div>

        {/* Needs Fix */}
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 flex items-center gap-4 hover:border-purple-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Needs Fix</p>
            <p className="text-2xl font-extrabold text-white">—</p>
          </div>
        </div>

        {/* Rejected */}
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 flex items-center gap-4 hover:border-purple-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Rejected</p>
            <p className="text-2xl font-extrabold text-white">—</p>
          </div>
        </div>
      </div>

      {/* Middle Row: Compliance Trend + Issue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Compliance Trend (lg:col-span-7) */}
        <div className="lg:col-span-7 rounded-3xl bg-[#121727] border border-white/5 p-6 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Compliance Trend</h2>
            </div>
            <p className="text-xs text-slate-400">Your brand compliance over time.</p>
          </div>

          {/* Chart area */}
          <div className="relative h-64 w-full flex flex-col justify-between py-2">
            {/* Axis gridlines */}
            {[100, 75, 50, 25, 0].map((val) => (
              <div key={val} className="flex items-center gap-3 w-full">
                <span className="text-[10px] text-slate-500 font-mono w-7 text-right">
                  {val}%
                </span>
                <div className="h-[1px] bg-white/5 flex-1 border-b border-dashed border-white/10" />
              </div>
            ))}

            {/* Empty state matching reference image verify analysis.png */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#0E1322] border border-white/5 flex items-center justify-center text-slate-500 mb-2">
                <BarChart2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white mb-1">No data yet</p>
              <p className="text-xs text-slate-400">
                Run your first audit to see compliance trends here.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
            Date
          </div>
        </div>

        {/* Issue Distribution (lg:col-span-5) */}
        <div className="lg:col-span-5 rounded-3xl bg-[#121727] border border-white/5 p-6 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Issue Distribution</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-auto py-2">
            {/* Donut ring container */}
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#1A2138"
                  strokeWidth="16"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <div className="w-7 h-7 rounded-lg bg-[#0E1322] flex items-center justify-center text-slate-500 mb-0.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  No data yet
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-2.5 text-xs">
              {[
                { name: 'Brand Consistency', color: 'bg-purple-500' },
                { name: 'Fact Check', color: 'bg-indigo-400' },
                { name: 'Design & Visuals', color: 'bg-pink-400' },
                { name: 'Claims & Compliance', color: 'bg-teal-400' },
                { name: 'Accessibility', color: 'bg-emerald-400' }
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-400">—</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[11px] text-slate-500">
            Categorized issue prevalence
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Issues + Content by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Issues (lg:col-span-6) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Top Issues</h2>
            <p className="text-xs text-slate-400">Most common issues found in your audits.</p>
          </div>

          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#0E1322] border border-white/5 flex items-center justify-center text-slate-500 mb-2">
              <FileCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white mb-1">No Issues found yet</p>
            <p className="text-xs text-slate-400">Issues from your audits will appear here.</p>
          </div>
        </div>

        {/* Content by Type (lg:col-span-6) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Content by Type</h2>
            <p className="text-xs text-slate-400">Types of content you have audited.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { label: 'Images', icon: ImageIcon },
              { label: 'Text', icon: FileText },
              { label: 'Video', icon: Video },
              { label: 'PDF', icon: FileCheck }
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="rounded-2xl bg-[#0E1322] border border-white/5 p-4 text-center space-y-2 hover:border-purple-500/20 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-300 mx-auto">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-slate-400">{c.label}</p>
                  <p className="text-lg font-bold text-white font-mono">—</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
