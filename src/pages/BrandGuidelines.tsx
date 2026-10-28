import React, { useState } from 'react';
import {
  BookMarked,
  Plus,
  Volume2,
  CheckCircle,
  XCircle,
  FileText,
  Edit,
  MoreVertical,
  ChevronRight,
  Megaphone,
  Target,
  Palette,
  Type,
  Droplet,
  Image as ImageIcon,
  ShieldCheck,
  Accessibility,
  Check,
  Search
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { BASELINE_GUIDELINES } from '../data/mockData';
import { GuidelineCategory } from '../types';
import { ToastType } from '../components/common/Toast';

interface BrandGuidelinesProps {
  onShowToast?: (message: string, type?: ToastType) => void;
}

export const BrandGuidelines: React.FC<BrandGuidelinesProps> = ({ onShowToast }) => {
  const [categories, setCategories] = useState<GuidelineCategory[]>(BASELINE_GUIDELINES);
  const [selectedCategory, setSelectedCategory] = useState<GuidelineCategory>(categories[0] || BASELINE_GUIDELINES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [formError, setFormError] = useState('');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Megaphone':
        return <Megaphone className="w-4 h-4" />;
      case 'Target':
        return <Target className="w-4 h-4" />;
      case 'Palette':
        return <Palette className="w-4 h-4" />;
      case 'Type':
        return <Type className="w-4 h-4" />;
      case 'Droplet':
        return <Droplet className="w-4 h-4" />;
      case 'Image':
        return <ImageIcon className="w-4 h-4" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4" />;
      case 'Accessibility':
        return <Accessibility className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGuideline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Please enter a guideline title');
      return;
    }
    if (!newDesc.trim()) {
      setFormError('Please enter a short description');
      return;
    }

    const created: GuidelineCategory = {
      id: `custom-cat-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      iconName: 'FileText',
      attributes: ['Approved', 'Standardized'],
      dos: ['Follow verified brand checklist', 'Maintain high clarity'],
      donts: ['Do not deviate without approval'],
      examples: {
        onBrand: 'Compliant execution adhering to new standards.',
        offBrand: 'Unapproved creative variations.'
      }
    };

    setCategories((prev) => [...prev, created]);
    setSelectedCategory(created);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setFormError('');

    if (onShowToast) {
      onShowToast(`Created brand guideline rule: "${created.title}".`, 'success');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = categories.map((c) =>
      c.id === selectedCategory.id
        ? { ...c, title: editTitle || c.title, description: editDesc || c.description }
        : c
    );
    setCategories(updated);
    setSelectedCategory({
      ...selectedCategory,
      title: editTitle || selectedCategory.title,
      description: editDesc || selectedCategory.description
    });
    setShowEditModal(false);
    if (onShowToast) {
      onShowToast('Guideline details updated.', 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Brand Guidelines</h1>
            <p className="text-xs text-slate-400">
              Define your brand's rules, voice, and standards for AI to follow during audits.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setFormError('');
            setShowCreateModal(true);
          }}
          icon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Create Guideline
        </Button>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Categories List (lg:col-span-4) */}
        <div className="lg:col-span-4 rounded-3xl bg-[#121727] border border-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Guideline Categories ({filteredCategories.length})
            </span>
          </div>

          {/* Search Category */}
          <div className="relative px-1 pb-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E1322] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategory.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                    isSelected
                      ? 'bg-purple-600/90 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                      : 'text-slate-400 hover:text-white hover:bg-[#161D2F]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={isSelected ? 'text-white' : 'text-purple-400'}>
                      {getCategoryIcon(cat.iconName)}
                    </span>
                    <span className="truncate">{cat.title}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isSelected ? 'text-white translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Category Details (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0">
                {getCategoryIcon(selectedCategory.iconName)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{selectedCategory.title}</h2>
                <p className="text-xs text-slate-400">{selectedCategory.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => {
                  setEditTitle(selectedCategory.title);
                  setEditDesc(selectedCategory.description);
                  setShowEditModal(true);
                }}
              >
                Edit
              </Button>
              <button
                className="p-2 rounded-xl bg-[#182035] hover:bg-[#1E2842] text-slate-400 hover:text-white border border-white/5 transition-colors focus-visible:ring-1 focus-visible:ring-purple-400"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice Attributes (if present) */}
          {selectedCategory.attributes && selectedCategory.attributes.length > 0 && (
            <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Voice Attributes</span>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {selectedCategory.attributes.map((attr) => (
                  <span
                    key={attr}
                    className="px-4 py-1.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/30 text-xs font-medium shadow-sm"
                  >
                    {attr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Writing Do's and Don'ts */}
          <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Writing Do's and Don'ts</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Do Box */}
              <div className="rounded-2xl bg-[#0E1322] border border-emerald-500/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Do</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedCategory.dos.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Don't Box */}
              <div className="rounded-2xl bg-[#0E1322] border border-red-500/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span>Don't</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedCategory.donts.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Examples</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* On-Brand */}
              <div className="rounded-2xl bg-[#0E1322] border border-emerald-500/20 p-5 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                  <Check className="w-3 h-3 stroke-[2.5]" /> On-Brand
                </span>
                <p className="text-xs text-slate-200 italic leading-relaxed pt-1">
                  {selectedCategory.examples.onBrand}
                </p>
              </div>

              {/* Off-Brand */}
              <div className="rounded-2xl bg-[#0E1322] border border-red-500/20 p-5 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[11px] font-semibold">
                  <XCircle className="w-3 h-3 stroke-[2.5]" /> Off-Brand
                </span>
                <p className="text-xs text-slate-200 italic leading-relaxed pt-1">
                  {selectedCategory.examples.offBrand}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Guideline Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Brand Guideline"
        description="Establish voice attributes, copywriting guidelines, and compliance boundary rules."
      >
        <form onSubmit={handleCreateGuideline} className="space-y-4">
          <Input
            label="Guideline Title"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              if (formError) setFormError('');
            }}
            placeholder="e.g. Social Video Pacing"
            error={formError && !newTitle ? formError : undefined}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => {
                setNewDesc(e.target.value);
                if (formError) setFormError('');
              }}
              rows={3}
              placeholder="Defines timing, transition speed, and keyframe text overlay rules."
              className="w-full bg-[#0E1322] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Guideline
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Guideline Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit ${selectedCategory.title}`}
        description="Update rules for this category."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full bg-[#0E1322] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
