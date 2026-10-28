import React, { useState } from 'react';
import {
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  FileText,
  Info,
  Layers,
  ChevronLeft,
  RotateCcw
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { INITIAL_AUDITS } from '../data/mockData';
import { AuditItem } from '../types';

interface AuditHistoryProps {
  onOpenAudit: (audit: AuditItem) => void;
}

export const AuditHistory: React.FC<AuditHistoryProps> = ({ onOpenAudit }) => {
  const [audits] = useState<AuditItem[]>(INITIAL_AUDITS);
  const [selectedAudit, setSelectedAudit] = useState<AuditItem | null>(audits[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentFilter, setContentFilter] = useState('All Content');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [detailTab, setDetailTab] = useState<'summary' | 'issues' | 'analysis'>('summary');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const filteredAudits = audits
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summaryText.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesContent = contentFilter === 'All Content' || item.type === contentFilter;
      return matchesSearch && matchesContent;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return b.id.localeCompare(a.id);
      return a.id.localeCompare(b.id);
    });

  const totalPages = Math.max(1, Math.ceil(filteredAudits.length / itemsPerPage));
  const paginatedAudits = filteredAudits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setContentFilter('All Content');
    setTimeFilter('All Time');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Audit History</h1>
            <p className="text-xs text-slate-400">
              A complete record of all your content audits, results, and AI actions.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Content Type Filter */}
          <div className="relative">
            <select
              value={contentFilter}
              onChange={(e) => {
                setContentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-[#121727] border border-white/10 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="All Content">All Content</option>
              <option value="Ad Design">Ad Design</option>
              <option value="Marketing Copy">Marketing Copy</option>
              <option value="Guideline">Guideline</option>
              <option value="Banner">Banner</option>
              <option value="Design">Design</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Time Filter */}
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-[#121727] border border-white/10 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search audits..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#121727] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Empty state if no audits, or 2-column layout */}
      {audits.length === 0 ? (
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-12 sm:p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0E1322] border border-white/5 mx-auto flex items-center justify-center text-slate-500">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">No Audits Recorded</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Audit history will automatically appear here once creative assets have been evaluated through the brand compliance engine.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: All Audits List (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-white">
                All Audits ({filteredAudits.length})
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Sort:</span>
                <button
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="font-semibold text-slate-200 hover:text-purple-300 flex items-center gap-1"
                >
                  {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {filteredAudits.length === 0 ? (
              <div className="rounded-3xl bg-[#121727] border border-white/5 p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0E1322] border border-white/5 mx-auto flex items-center justify-center text-slate-500">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">No matching audits</h3>
                  <p className="text-xs text-slate-400">
                    Try adjusting your search query or filter criteria.
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={handleResetFilters} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedAudits.map((item) => {
                  const isSelected = selectedAudit?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAudit(item)}
                      className={`flex items-center justify-between p-3.5 rounded-3xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#151C30] border-2 border-purple-500/60 shadow-lg shadow-purple-900/30'
                          : 'bg-[#121727] border border-white/5 hover:border-purple-500/30 hover:bg-[#161D32]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-purple-900/30 border border-purple-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center text-purple-300 font-semibold text-xs">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{item.type.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                          <p className="text-xs text-slate-400">
                            {item.type} • {item.relativeTime}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge status={item.status} size="sm" />
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected ? 'text-purple-400 translate-x-0.5' : 'text-slate-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dynamic pagination bar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-xl bg-[#121727] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                        currentPage === pageNum
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                          : 'bg-[#121727] border border-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-xl bg-[#121727] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Audit Details Panel (lg:col-span-5) */}
          <div className="lg:col-span-5 rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-6 sticky top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Audit Details</h2>
              <button
                onClick={() => selectedAudit && onOpenAudit(selectedAudit)}
                disabled={!selectedAudit}
                className="p-1.5 rounded-xl bg-[#182035] text-slate-400 hover:text-white hover:bg-purple-600/20 border border-white/5 transition-colors disabled:opacity-40"
                title="Inspect Full Audit in New Audit screen"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {selectedAudit ? (
              <>
                {/* Selected Item Hero Header */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#0E1322] border border-white/5">
                  <div className="w-16 h-16 rounded-2xl bg-purple-950/40 border border-purple-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center text-purple-300">
                    {selectedAudit.thumbnailUrl ? (
                      <img
                        src={selectedAudit.thumbnailUrl}
                        alt={selectedAudit.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-8 h-8" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-white truncate">{selectedAudit.title}</h3>
                    <p className="text-xs text-slate-400">
                      {selectedAudit.type} • {selectedAudit.relativeTime}
                    </p>
                    <div className="pt-1">
                      <Badge status={selectedAudit.status} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Detail Tabs */}
                <div className="flex border-b border-white/10" role="tablist">
                  <button
                    onClick={() => setDetailTab('summary')}
                    role="tab"
                    aria-selected={detailTab === 'summary'}
                    className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 -mb-[1px] ${
                      detailTab === 'summary'
                        ? 'border-purple-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Audit Summary
                  </button>
                  <button
                    onClick={() => setDetailTab('issues')}
                    role="tab"
                    aria-selected={detailTab === 'issues'}
                    className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 -mb-[1px] ${
                      detailTab === 'issues'
                        ? 'border-purple-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Issues &amp; Fixes ({selectedAudit.issues.length})
                  </button>
                  <button
                    onClick={() => setDetailTab('analysis')}
                    role="tab"
                    aria-selected={detailTab === 'analysis'}
                    className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 -mb-[1px] ${
                      detailTab === 'analysis'
                        ? 'border-purple-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Analysis
                  </button>
                </div>

                {/* Tab Content */}
                {detailTab === 'summary' && (
                  <div className="space-y-4">
                    {/* Decision & Status Banner */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-[#0E1322] border border-white/5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">AI Decision</p>
                          <p className="text-sm font-bold text-emerald-400">{selectedAudit.status}</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#0E1322] border border-white/5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Score</p>
                          <p className="text-sm font-bold text-purple-300 font-mono">
                            {selectedAudit.complianceScore !== undefined
                              ? `${selectedAudit.complianceScore}%`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary Text */}
                    <div className="p-4 rounded-2xl bg-[#0E1322] border border-white/5 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Info className="w-3.5 h-3.5 text-purple-400" />
                        <span>Executive Summary</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedAudit.summaryText}
                      </p>
                    </div>
                  </div>
                )}

                {detailTab === 'issues' && (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {selectedAudit.issues.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No issues detected. Asset satisfies all compliance criteria.
                      </div>
                    ) : (
                      selectedAudit.issues.map((iss) => (
                        <div key={iss.id} className="p-3.5 rounded-2xl bg-[#0E1322] border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{iss.category}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                iss.severity === 'High'
                                  ? 'bg-red-500/15 text-red-400'
                                  : iss.severity === 'Medium'
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-blue-500/15 text-blue-400'
                              }`}
                            >
                              {iss.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{iss.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === 'analysis' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-[#0E1322] border border-white/5 space-y-2">
                      <span className="text-xs font-bold text-white">Pipeline Telemetry</span>
                      <div className="space-y-1.5 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Evaluation ID:</span>
                          <span className="font-mono text-purple-300">{selectedAudit.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rules Tested:</span>
                          <span className="text-slate-200">Brand, Fact, Claims, A11y</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onOpenAudit(selectedAudit)}
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Inspect in Detailed Audit View
                </Button>
              </>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                Select an audit from the list to inspect details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
