import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  ChevronRight,
  ShieldCheck,
  HardDrive,
  Sparkles,
  Edit2,
  UploadCloud,
  Check,
  Image as ImageIcon,
  FileText,
  Layers,
  Info
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { DEFAULT_BRAND_COLORS, DEFAULT_TYPOGRAPHY } from '../data/mockData';
import { ToastType } from '../components/common/Toast';
import { BrandColor, TypographySpec } from '../types';

interface BrandAssetsProps {
  onShowToast?: (message: string, type?: ToastType) => void;
}

interface CustomAsset {
  id: string;
  name: string;
  category: string;
  fileDetails?: string;
  sizeKb?: number;
}

export const BrandAssets: React.FC<BrandAssetsProps> = ({ onShowToast }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All Assets');
  const [colors, setColors] = useState<BrandColor[]>(DEFAULT_BRAND_COLORS);
  const [typography, setTypography] = useState<TypographySpec[]>(DEFAULT_TYPOGRAPHY);
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([]);
  const [showDesignSpec, setShowDesignSpec] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showTypographyModal, setShowTypographyModal] = useState(false);

  // Form states
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('Logos');
  const [assetFormError, setAssetFormError] = useState('');

  // Edit Colors form state
  const [editingColors, setEditingColors] = useState<BrandColor[]>(DEFAULT_BRAND_COLORS);

  // Edit Typography form state
  const [headingFont, setHeadingFont] = useState(DEFAULT_TYPOGRAPHY[0]?.fontFamily || 'Inter');
  const [bodyFont, setBodyFont] = useState(DEFAULT_TYPOGRAPHY[1]?.fontFamily || 'Inter');

  const categories = [
    'All Assets',
    'Logos',
    'Colors',
    'Fonts',
    'Templates',
    'Imagery',
    'Documents'
  ];

  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) {
      setAssetFormError('Please enter an asset title');
      return;
    }

    const newAsset: CustomAsset = {
      id: `asset-${Date.now()}`,
      name: newAssetName.trim(),
      category: newAssetCategory,
      fileDetails: 'Uploaded client asset',
      sizeKb: 120
    };

    setCustomAssets((prev) => [newAsset, ...prev]);
    setShowAddModal(false);
    setNewAssetName('');
    setAssetFormError('');

    if (onShowToast) {
      onShowToast(`Added asset "${newAsset.name}" to ${newAsset.category}.`, 'success');
    }
  };

  const handleSaveColors = () => {
    setColors(editingColors);
    setShowColorModal(false);
    if (onShowToast) {
      onShowToast('Brand color tokens updated.', 'success');
    }
  };

  const handleSaveTypography = () => {
    setTypography([
      { fontFamily: headingFont, weight: 'SemiBold (600)', usage: 'Headings & Display Typography' },
      { fontFamily: bodyFont, weight: 'Regular (400)', usage: 'Body, Paragraphs & Interface Labels' }
    ]);
    setShowTypographyModal(false);
    if (onShowToast) {
      onShowToast('Typography hierarchy updated.', 'success');
    }
  };

  const filteredCustomAssets = customAssets.filter(
    (item) => activeCategory === 'All Assets' || item.category === activeCategory
  );

  const customLogos = customAssets.filter((a) => a.category === 'Logos');
  const customTemplates = customAssets.filter((a) => a.category === 'Templates');

  // Calculate honest storage usage from client assets
  const totalKb = customAssets.reduce((acc, curr) => acc + (curr.sizeKb || 100), 0);
  const usedFormatted = totalKb > 1024 ? `${(totalKb / 1024).toFixed(1)} MB` : `${totalKb} KB`;
  const storagePercentage = Math.min(100, Math.round((totalKb / (100 * 1024)) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Brand Assets</h1>
            <p className="text-xs text-slate-400">
              Manage your brand's approved assets, design tokens, and references used for AI compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDesignSpec(!showDesignSpec)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121727] text-slate-400 hover:text-white border border-white/5 text-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>{showDesignSpec ? 'Hide Design Reference' : 'View Design Blueprint Reference'}</span>
          </button>

          <Button
            onClick={() => {
              setAssetFormError('');
              setShowAddModal(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Asset
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeCategory === cat
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40'
                : 'bg-[#121727] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Static Design Blueprint Reference Banner & Viewer (Design Spec Only) */}
      {showDesignSpec && (
        <div className="p-5 rounded-3xl bg-purple-950/30 border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                <strong>Static Design Blueprint Reference:</strong> The asset below represents the reference design blueprint from <code className="bg-purple-900/60 px-1 py-0.5 rounded text-purple-200">resources/veryfi lojo.png</code>. It is a static design reference spec, not an uploaded customer asset.
              </span>
            </div>
            <button
              onClick={() => setShowDesignSpec(false)}
              className="text-xs text-purple-300 hover:text-white underline ml-4 flex-shrink-0"
            >
              Dismiss
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E1322] border border-white/5 flex flex-wrap items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-300">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Veryfi Logo Mark Reference Spec</p>
              <p className="text-[11px] text-slate-400">
                Design system symbol benchmark • Target vector format: SVG / 512×512
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Assets Content + Right Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Grid of Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logos Card */}
            {(activeCategory === 'All Assets' || activeCategory === 'Logos') && (
              <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    Logos ({customLogos.length})
                  </span>
                  <button
                    onClick={() => {
                      setNewAssetCategory('Logos');
                      setShowAddModal(true);
                    }}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Logo
                  </button>
                </div>

                {customLogos.length === 0 ? (
                  <div className="py-8 text-center space-y-2 border border-dashed border-white/10 rounded-2xl bg-[#0E1322]/50 p-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-white">No brand logos uploaded yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Upload your official logo marks (primary, inverse, or icon) to enable logo placement and clear space audits.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {customLogos.map((logo) => (
                      <div key={logo.id} className="space-y-1.5 text-center">
                        <div className="h-20 rounded-2xl bg-[#0E1322] border border-white/10 p-2.5 flex items-center justify-center">
                          <span className="text-xs font-bold text-white truncate">{logo.name}</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">Custom Logo</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Brand Colors Card */}
            {(activeCategory === 'All Assets' || activeCategory === 'Colors') && (
              <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Brand Colors</span>
                  <button
                    onClick={() => {
                      setEditingColors([...colors]);
                      setShowColorModal(true);
                    }}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 focus-visible:ring-1 focus-visible:ring-purple-400 rounded"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-1">
                  {colors.map((col) => (
                    <div key={col.name} className="space-y-1.5 text-center">
                      <div
                        className="h-14 rounded-2xl border border-white/10 shadow-sm"
                        style={{ backgroundColor: col.hex }}
                      />
                      <p className="text-[10px] font-mono text-white truncate">{col.hex}</p>
                      <p className="text-[9px] text-slate-400 truncate">{col.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typography Card */}
            {(activeCategory === 'All Assets' || activeCategory === 'Fonts') && (
              <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Typography</span>
                  <button
                    onClick={() => {
                      setHeadingFont(typography[0]?.fontFamily || 'Inter');
                      setBodyFont(typography[1]?.fontFamily || 'Inter');
                      setShowTypographyModal(true);
                    }}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 focus-visible:ring-1 focus-visible:ring-purple-400 rounded"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="space-y-3">
                  {typography.map((font, idx) => (
                    <div key={idx} className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#0E1322] border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-300 text-lg font-serif">
                        Aa
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {font.fontFamily} <span className="text-slate-400 font-normal">({font.weight})</span>
                        </p>
                        <p className="text-[10px] text-slate-400">{font.usage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Templates Card */}
            {(activeCategory === 'All Assets' || activeCategory === 'Templates') && (
              <div className="rounded-3xl bg-[#121727] border border-white/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    Templates ({customTemplates.length})
                  </span>
                  <button
                    onClick={() => {
                      setNewAssetCategory('Templates');
                      setShowAddModal(true);
                    }}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Template
                  </button>
                </div>

                {customTemplates.length === 0 ? (
                  <div className="py-8 text-center space-y-2 border border-dashed border-white/10 rounded-2xl bg-[#0E1322]/50 p-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-white">No templates registered yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Upload standard ad or collateral templates to verify layout consistency in future audits.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {customTemplates.map((tmpl) => (
                      <div key={tmpl.id} className="rounded-2xl bg-[#0E1322] border border-white/5 p-3 text-center">
                        <p className="text-xs font-semibold text-white truncate">{tmpl.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{tmpl.category}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom Uploaded Assets List */}
            {filteredCustomAssets.map((asset) => (
              <div key={asset.id} className="rounded-3xl bg-[#121727] border border-white/5 p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{asset.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                    {asset.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{asset.fileDetails}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Brand Overview & Storage (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Brand Overview Card */}
          <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Brand Profile</h2>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1322] border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Workspace Governance</h3>
                <p className="text-xs text-slate-400">Local Browser Session</p>
              </div>
            </div>

            {/* Dynamic Checklist reflecting real state */}
            <div className="space-y-2">
              {[
                { label: 'Color palette defined', done: colors.length > 0 },
                { label: 'Typography scale set', done: typography.length > 0 },
                { label: `Logos registered (${customLogos.length})`, done: customLogos.length > 0 },
                { label: `Templates registered (${customTemplates.length})`, done: customTemplates.length > 0 }
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#0E1322]/60 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-200">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        item.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={item.done ? 'text-slate-200' : 'text-slate-400'}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Asset Storage Card */}
          <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Asset Storage</h2>
            </div>

            <div className="w-full bg-[#0E1322] rounded-full h-2.5 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(storagePercentage, 2)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>{usedFormatted} of 100 MB used</span>
              <span className="text-purple-400 font-semibold">{storagePercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Brand Asset"
        description="Upload or define new brand assets for your local workspace."
      >
        <form onSubmit={handleAddAssetSubmit} className="space-y-4">
          <Input
            label="Asset Title"
            value={newAssetName}
            onChange={(e) => {
              setNewAssetName(e.target.value);
              if (assetFormError) setAssetFormError('');
            }}
            placeholder="e.g. Master Logo Mark"
            error={assetFormError}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={newAssetCategory}
              onChange={(e) => setNewAssetCategory(e.target.value)}
              className="w-full bg-[#0E1322] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Logos">Logos</option>
              <option value="Colors">Colors</option>
              <option value="Fonts">Fonts</option>
              <option value="Templates">Templates</option>
              <option value="Imagery">Imagery</option>
              <option value="Documents">Documents</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center bg-[#0E1322] cursor-pointer hover:border-purple-500/40 transition-colors">
            <UploadCloud className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">Drag &amp; drop file here</p>
            <p className="text-[10px] text-slate-400">SVG, PNG, TTF, or JSON tokens</p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Colors Modal */}
      <Modal
        isOpen={showColorModal}
        onClose={() => setShowColorModal(false)}
        title="Edit Brand Color Tokens"
        description="Configure your primary and secondary brand color palette."
      >
        <div className="space-y-4">
          <div className="space-y-3">
            {editingColors.map((col, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="color"
                  value={col.hex}
                  onChange={(e) => {
                    const next = [...editingColors];
                    next[idx] = { ...next[idx], hex: e.target.value };
                    setEditingColors(next);
                  }}
                  className="w-10 h-10 rounded-xl bg-transparent border border-white/10 cursor-pointer p-0.5"
                />
                <div className="flex-1">
                  <Input
                    label={col.name}
                    value={col.hex}
                    onChange={(e) => {
                      const next = [...editingColors];
                      next[idx] = { ...next[idx], hex: e.target.value };
                      setEditingColors(next);
                    }}
                    placeholder="#7C3AED"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowColorModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveColors}>
              Apply Tokens
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Typography Modal */}
      <Modal
        isOpen={showTypographyModal}
        onClose={() => setShowTypographyModal(false)}
        title="Edit Typography Tokens"
        description="Specify brand font families for display headings and body copy."
      >
        <div className="space-y-4">
          <Input
            label="Headings Font Family"
            value={headingFont}
            onChange={(e) => setHeadingFont(e.target.value)}
            placeholder="e.g. Inter or Plus Jakarta Sans"
          />

          <Input
            label="Body Font Family"
            value={bodyFont}
            onChange={(e) => setBodyFont(e.target.value)}
            placeholder="e.g. Inter or Roboto"
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowTypographyModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveTypography}>
              Save Typography
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
