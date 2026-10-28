import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  UploadCloud,
  Sparkles,
  Info,
  FileImage,
  RefreshCcw,
  Maximize2,
  X,
  Layers,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ToastType } from '../components/common/Toast';
import { DESIGN_BLUEPRINT_REFERENCE } from '../data/mockData';
import { AuditItem } from '../types';

interface NewAuditProps {
  onShowToast?: (message: string, type?: ToastType) => void;
  selectedAudit?: AuditItem | null;
}

interface UploadedLocalFile {
  file: File;
  previewUrl: string;
  sizeFormatted: string;
  type: string;
  name: string;
  lastModifiedDate: string;
}

export const NewAudit: React.FC<NewAuditProps> = ({ onShowToast, selectedAudit }) => {
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'blueprint'>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedLocalFile | null>(null);
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Activate blueprint tab if an audit was selected
  useEffect(() => {
    if (selectedAudit) {
      setActiveTab('blueprint');
    }
  }, [selectedAudit]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (uploadedFile?.previewUrl) {
        URL.revokeObjectURL(uploadedFile.previewUrl);
      }
    };
  }, [uploadedFile]);

  const processFile = (file: File) => {
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeFormatted = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKb} KB`;

    setUploadedFile({
      file,
      previewUrl,
      sizeFormatted,
      type: file.type || 'Document',
      name: file.name,
      lastModifiedDate: new Date(file.lastModified).toLocaleDateString()
    });

    setActiveTab('upload');
    if (onShowToast) {
      onShowToast(`Loaded "${file.name}" for local inspection.`, 'info');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">New Audit</h1>
            <p className="text-xs text-slate-400">
              Inspect your local content, verify assets, and prepare for brand compliance evaluation.
            </p>
          </div>
        </div>

        {/* View Switcher: Local Upload vs Design Blueprint Reference */}
        <div className="flex items-center gap-2 bg-[#121727] p-1 rounded-2xl border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Audit Workspace {uploadedFile ? '• (1 File)' : ''}</span>
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'blueprint'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Design Blueprint Spec</span>
          </button>
        </div>
      </div>

      {activeTab === 'upload' && !uploadedFile ? (
        /* Empty Upload Dropzone */
        <div className="rounded-3xl bg-[#121727] border border-white/10 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-10 transition-all ${
              dragOver
                ? 'border-purple-400 bg-purple-500/10'
                : 'border-white/10 hover:border-purple-500/40 bg-[#0E1322]'
            }`}
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Select or Drop Content to Audit
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              Supports high-resolution PNG, JPG, PDF, TXT, and MP4 creatives up to 100 MB.
            </p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all">
              <UploadCloud className="w-4 h-4" />
              Choose Local File
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf,.txt"
                onChange={handleFileInputChange}
              />
            </label>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E1322] border border-white/5 flex items-start gap-3 text-left">
            <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">Local Inspection Mode</p>
              <p>
                Files selected here are processed strictly in your local browser sandbox. To calculate compliance scores, substantiate clinical claims, or apply AI auto-fixes, connect an active backend service.
              </p>
            </div>
          </div>
        </div>
      ) : activeTab === 'upload' && uploadedFile ? (
        /* Local Uploaded File Preview & Honest Inspection State */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Local File Creative Preview */}
          <div className="lg:col-span-5 rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">Local File Preview</span>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1A2238] text-slate-300 border border-white/5">
                {uploadedFile.type}
              </span>
            </div>

            {uploadedFile.previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-[#0A0D18] border border-white/10 group">
                <img
                  src={uploadedFile.previewUrl}
                  alt={uploadedFile.name}
                  className="w-full h-auto max-h-[460px] object-contain mx-auto"
                />
                <button
                  onClick={() => setShowImageZoom(true)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Expand preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="h-64 rounded-2xl bg-[#0E1322] border border-white/5 flex flex-col items-center justify-center text-center p-6">
                <UploadCloud className="w-12 h-12 text-purple-400 mb-2" />
                <p className="text-sm font-bold text-white">{uploadedFile.name}</p>
                <p className="text-xs text-slate-400">{uploadedFile.sizeFormatted}</p>
              </div>
            )}

            {/* Metadata list */}
            <div className="p-4 rounded-2xl bg-[#0E1322] border border-white/5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">File Name:</span>
                <span className="text-white font-semibold truncate max-w-[200px]">
                  {uploadedFile.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Size:</span>
                <span className="text-slate-300">{uploadedFile.sizeFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MIME Format:</span>
                <span className="text-slate-300">{uploadedFile.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected:</span>
                <span className="text-slate-300">{uploadedFile.lastModifiedDate}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <Button variant="secondary" size="sm" className="w-full">
                  <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Replace File
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,.pdf,.txt"
                    onChange={handleFileInputChange}
                  />
                </Button>
              </label>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setUploadedFile(null)}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Column 2: Honest Validation Readiness Panel */}
          <div className="lg:col-span-7 rounded-3xl bg-[#121727] border border-white/5 p-8 space-y-6">
            <div className="p-5 rounded-2xl bg-[#0E1322] border border-indigo-500/30 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Local File Loaded • Pending AI Validation
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your creative asset is loaded locally in your browser session. In accordance with data integrity guidelines, automated compliance scores, authenticity metrics, and approval verdicts are not fabricated without an active backend validation engine.
                </p>
              </div>
            </div>

            {/* Verification Status Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Automated Verification Checklist (Awaiting Engine)
              </h4>
              <div className="space-y-3">
                {[
                  {
                    title: 'Brand Consistency Verification',
                    status: 'Awaiting Backend Engine',
                    desc: 'Evaluates colors, typography hierarchy, logo clearance, and aspect ratios against workspace guidelines.'
                  },
                  {
                    title: 'Fact Checking & Claim Substantiation',
                    status: 'Awaiting Backend Engine',
                    desc: 'Cross-checks marketing superlatives and clinical claims against regulatory data.'
                  },
                  {
                    title: 'Accessibility & Contrast Evaluation',
                    status: 'Awaiting Backend Engine',
                    desc: 'Measures WCAG 2.1 AA text-to-background contrast ratios and touch-target clearance.'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#0E1322] border border-white/5 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{item.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={() => setShowBackendModal(true)}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Execute AI Audit (Requires Backend Engine)
              </Button>
              <Button
                variant="secondary"
                onClick={() => setActiveTab('blueprint')}
              >
                View Design Blueprint Reference
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Static Design Blueprint Reference (Reference Spec Only) */
        <div className="space-y-6">
          {/* Reference Blueprint Banner */}
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                <strong>Design Reference Blueprint:</strong> The 3-column layout below illustrates the reference specifications sourced from <code className="bg-purple-900/60 px-1 py-0.5 rounded text-purple-200">resources/verify audit.png</code>. It is a static design mockup, not active customer data.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('upload')}
              className="text-xs text-purple-300 hover:text-white underline ml-4 flex-shrink-0 flex items-center gap-1"
            >
              Back to Audit Workspace <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column 1: Blueprint Creative */}
            <div className="lg:col-span-4 rounded-3xl bg-[#121727] border border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Reference Creative Spec</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                  Static Blueprint
                </span>
              </div>

              {/* Artwork Card */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#F3F0FF] to-[#E9E4FF] text-slate-900 p-6 shadow-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-purple-700 flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold tracking-tight text-purple-900 leading-none">
                      {DESIGN_BLUEPRINT_REFERENCE.artwork.clinicName}
                    </h4>
                    <p className="text-[9px] text-purple-700 tracking-wider font-medium">
                      {DESIGN_BLUEPRINT_REFERENCE.artwork.clinicSubtitle}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-2xl font-black text-purple-950 tracking-tight leading-tight">
                    {DESIGN_BLUEPRINT_REFERENCE.artwork.treatment}
                  </h3>
                  <p className="text-xs font-semibold text-purple-800">
                    {DESIGN_BLUEPRINT_REFERENCE.artwork.treatmentSub}
                  </p>
                </div>

                <div className="space-y-1.5 mb-5 text-[11px] font-medium text-purple-950">
                  {DESIGN_BLUEPRINT_REFERENCE.artwork.bulletPoints.map((pt, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-700" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-3.5 mb-4 shadow-md">
                  <p className="text-[10px] font-medium text-purple-200 uppercase tracking-wider">
                    Special Package
                  </p>
                  <p className="text-xl font-bold tracking-tight">
                    {DESIGN_BLUEPRINT_REFERENCE.artwork.packagePrice}
                  </p>
                </div>

                <div className="text-[9px] text-purple-900/80 border-t border-purple-300/60 pt-2.5">
                  <p>{DESIGN_BLUEPRINT_REFERENCE.artwork.address}</p>
                  <p>{DESIGN_BLUEPRINT_REFERENCE.artwork.phone}</p>
                </div>
              </div>
            </div>

            {/* Column 2: Blueprint Results */}
            <div className="lg:col-span-4 rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Blueprint AI Results Spec</span>
                <span className="text-[10px] text-slate-400">Target Output Schema</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1322] border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">Target Score Representation</span>
                  <span className="font-mono text-purple-300">{DESIGN_BLUEPRINT_REFERENCE.specComplianceScore}%</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Example calculation showing high guideline compliance against target visual identity.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Documented Issue Types (Reference Only)
                </h4>
                {DESIGN_BLUEPRINT_REFERENCE.specIssues.map((iss, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[#0E1322] border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">{iss.category}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold">
                        {iss.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{iss.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Blueprint Suggested Fixes */}
            <div className="lg:col-span-4 rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Blueprint Remediations</span>
                <span className="text-[10px] text-slate-400">Target Fix Schema</span>
              </div>

              <div className="space-y-3">
                {DESIGN_BLUEPRINT_REFERENCE.specFixes.map((fix, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[#0E1322] border border-white/5 text-xs text-slate-300 space-y-1">
                    <p className="text-[10px] text-purple-400 font-semibold uppercase">Suggestion #{i + 1}</p>
                    <p className="leading-relaxed">{fix}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 text-xs text-slate-400 text-center">
                <p className="font-semibold text-slate-200 mb-1">Production AI Execution</p>
                <p>
                  In live deployments, clicking &ldquo;Apply Fixes&rdquo; calls the backend AI API to generate corrected vector assets and copy revisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backend Required Modal */}
      <Modal
        isOpen={showBackendModal}
        onClose={() => setShowBackendModal(false)}
        title="Backend AI Service Connection Required"
        description="The live AI auditing engine evaluates multi-modal models that execute on server infrastructure."
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-[#0E1322] border border-white/5 space-y-2">
            <p className="font-semibold text-white">How it works:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>Deploy the Veryfi AI microservice API.</li>
              <li>Provide your endpoint in <strong className="text-purple-300">Settings &gt; API</strong>.</li>
              <li>New audits will automatically run OCR, claim validation, and compliance scoring.</li>
            </ol>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBackendModal(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Zoom Modal */}
      {showImageZoom && uploadedFile?.previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-purple-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={uploadedFile.previewUrl}
              alt={uploadedFile.name}
              className="max-h-[85vh] w-auto rounded-2xl object-contain border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};
