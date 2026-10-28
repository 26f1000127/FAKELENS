import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Palette,
  ShieldCheck,
  AlertTriangle,
  UploadCloud,
  ChevronDown,
  Trash2,
  Users,
  Link as LinkIcon,
  Code,
  Bell,
  Copy,
  Plus
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { INITIAL_SETTINGS } from '../data/mockData';
import { WorkspaceSettings } from '../types';
import { ToastType } from '../components/common/Toast';

interface SettingsProps {
  onShowToast?: (message: string, type?: ToastType) => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Lead Auditor' | 'Reviewer';
  initials: string;
}

export const Settings: React.FC<SettingsProps> = ({ onShowToast }) => {
  const [settings, setSettings] = useState<WorkspaceSettings>(INITIAL_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<WorkspaceSettings>(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState<'workspace' | 'team' | 'integrations' | 'api' | 'notifications'>('workspace');
  const [isSaving, setIsSaving] = useState(false);

  // Form errors
  const [nameError, setNameError] = useState('');
  const [primaryColorError, setPrimaryColorError] = useState('');
  const [secondaryColorError, setSecondaryColorError] = useState('');

  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Lead Auditor' | 'Reviewer'>('Reviewer');

  // Team state (local session admin)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Workspace Admin', email: 'admin@workspace.local', role: 'Owner', initials: 'WA' }
  ]);

  // Integrations state (all disconnected until real OAuth / backend connected)
  const [integrations, setIntegrations] = useState([
    { id: 'figma', name: 'Figma', desc: 'Sync frames and design components directly for live audits.', connected: false },
    { id: 'adobe', name: 'Adobe Creative Cloud', desc: 'Photoshop & Illustrator plugin for instant compliance checking.', connected: false },
    { id: 'slack', name: 'Slack', desc: 'Receive real-time alerts when creative audits require fixes.', connected: false },
    { id: 'webhooks', name: 'Outbound Webhooks', desc: 'Trigger CI/CD or CMS webhooks on audit verdict completion.', connected: false }
  ]);

  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  const handleRuleToggle = (key: keyof WorkspaceSettings['rules']) => {
    setSettings((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [key]: !prev.rules[key]
      }
    }));
  };

  const validateForm = () => {
    let isValid = true;
    if (!settings.workspaceName.trim()) {
      setNameError('Workspace name cannot be empty');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!hexRegex.test(settings.primaryColor)) {
      setPrimaryColorError('Invalid hex color (e.g. #7C3AED)');
      isValid = false;
    } else {
      setPrimaryColorError('');
    }

    if (!hexRegex.test(settings.secondaryColor)) {
      setSecondaryColorError('Invalid hex color (e.g. #C4B5FD)');
      isValid = false;
    } else {
      setSecondaryColorError('');
    }

    return isValid;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSettings(settings);
      if (onShowToast) {
        onShowToast('Workspace settings saved successfully!', 'success');
      }
    }, 400);
  };

  const handleCancel = () => {
    setSettings(savedSettings);
    setNameError('');
    setPrimaryColorError('');
    setSecondaryColorError('');
    if (onShowToast) {
      onShowToast('Settings reverted to last saved state.', 'info');
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      if (onShowToast) onShowToast('Please provide a valid email address.', 'error');
      return;
    }

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      initials: inviteEmail.slice(0, 2).toUpperCase()
    };

    setTeamMembers((prev) => [...prev, newMember]);
    setShowInviteModal(false);
    setInviteEmail('');
    if (onShowToast) {
      onShowToast(`Invitation queued for ${newMember.email}.`, 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Settings</h1>
            <p className="text-xs text-slate-400">
              Manage your workspace, brand, integrations, and team access.
            </p>
          </div>
        </div>
      </div>

      {/* Session-Only Persistence Notice */}
      <div className="p-3.5 rounded-2xl bg-[#0E1322] border border-purple-500/30 flex items-start sm:items-center gap-3 text-xs text-purple-200">
        <AlertTriangle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5 sm:mt-0" />
        <p>
          <strong>Session-Only Configuration:</strong> Settings modified in this standalone frontend preview apply to your current browser session and will not persist across reloads without a connected backend database.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/5" role="tablist">
        {[
          { id: 'workspace', label: 'Workspace', icon: Building },
          { id: 'team', label: 'Team', icon: Users },
          { id: 'integrations', label: 'Integrations', icon: LinkIcon },
          { id: 'api', label: 'API', icon: Code },
          { id: 'notifications', label: 'Notifications', icon: Bell }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#121727]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* Top 2 Cards: Workspace Details + Brand Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Card 1: Workspace Details */}
            <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-bold text-white">Workspace Details</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Manage your organisation and workspace information.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left inputs */}
                  <div className="space-y-3">
                    <Input
                      label="Workspace Name"
                      value={settings.workspaceName}
                      onChange={(e) => {
                        setSettings({ ...settings, workspaceName: e.target.value });
                        if (nameError) setNameError('');
                      }}
                      placeholder="e.g. Acme Corp"
                      error={nameError}
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Industry
                      </label>
                      <div className="relative">
                        <select
                          value={settings.industry}
                          onChange={(e) =>
                            setSettings({ ...settings, industry: e.target.value })
                          }
                          className="w-full appearance-none bg-[#0E1322] border border-white/10 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="Healthcare & Aesthetic Wellness">Healthcare &amp; Aesthetic Wellness</option>
                          <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                          <option value="Financial Services">Financial Services</option>
                          <option value="SaaS & Technology">SaaS &amp; Technology</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Workspace Logo Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Workspace Logo
                    </label>
                    <div className="h-[105px] border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-2xl bg-[#0E1322] p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                      <UploadCloud className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform mb-1" />
                      <p className="text-xs font-semibold text-white">Upload Logo</p>
                      <p className="text-[10px] text-slate-500">PNG, JPG (max 5 MB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Brand Configuration */}
            <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-bold text-white">Brand Configuration</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Set your primary brand identity for AI audits.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
                {/* Inputs left (7 cols) */}
                <div className="sm:col-span-7 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Primary Colour
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg border border-white/10 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: hexRegex.test(settings.primaryColor) ? settings.primaryColor : '#7C3AED' }}
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => {
                          setSettings({ ...settings, primaryColor: e.target.value });
                          if (primaryColorError) setPrimaryColorError('');
                        }}
                        className="w-full bg-[#0E1322] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    {primaryColorError && (
                      <p className="text-[10px] text-red-400 mt-1">{primaryColorError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Secondary Colour
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg border border-white/10 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: hexRegex.test(settings.secondaryColor) ? settings.secondaryColor : '#C4B5FD' }}
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => {
                          setSettings({ ...settings, secondaryColor: e.target.value });
                          if (secondaryColorError) setSecondaryColorError('');
                        }}
                        className="w-full bg-[#0E1322] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    {secondaryColorError && (
                      <p className="text-[10px] text-red-400 mt-1">{secondaryColorError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Brand Fonts
                    </label>
                    <div className="relative">
                      <select
                        value={settings.brandFont}
                        onChange={(e) =>
                          setSettings({ ...settings, brandFont: e.target.value })
                        }
                        className="w-full appearance-none bg-[#0E1322] border border-white/10 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        <option value="Satoshi (Headings) / Inter (Body)">Satoshi (Headings) / Inter (Body)</option>
                        <option value="Plus Jakarta Sans / Inter">Plus Jakarta Sans / Inter</option>
                        <option value="Cabinet Grotesk / General Sans">Cabinet Grotesk / General Sans</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Live Brand Preview Card right (5 cols) */}
                <div
                  className="sm:col-span-5 rounded-2xl bg-[#0E1322] border border-white/5 p-4 text-center space-y-2 transition-all"
                  style={{
                    borderColor: hexRegex.test(settings.primaryColor) ? `${settings.primaryColor}40` : undefined
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-2xl font-serif text-white shadow-md transition-colors"
                    style={{
                      backgroundColor: hexRegex.test(settings.primaryColor) ? settings.primaryColor : '#7C3AED'
                    }}
                  >
                    Aa
                  </div>
                  <p className="text-xs font-bold text-white">Brand Preview</p>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    This is how your brand tokens look in audits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 2 Cards: Compliance Rules + Danger Zone */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Card 3: Compliance Rules */}
            <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-bold text-white">Compliance Rules</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Define what the AI should check in your content.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {/* Rule 1 */}
                <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-[#0E1322] border border-white/5">
                  <div>
                    <h4 className="text-xs font-bold text-white">Brand Consistency</h4>
                    <p className="text-[11px] text-slate-400">
                      Checks logo, colours, fonts, and overall design.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRuleToggle('brandConsistency')}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                      settings.rules.brandConsistency ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 rounded-full bg-white transform transition-transform absolute top-1 ${
                        settings.rules.brandConsistency ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Rule 2 */}
                <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-[#0E1322] border border-white/5">
                  <div>
                    <h4 className="text-xs font-bold text-white">Fact Checking</h4>
                    <p className="text-[11px] text-slate-400">
                      Identifies unsupported or outdated claims.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRuleToggle('factChecking')}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                      settings.rules.factChecking ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 rounded-full bg-white transform transition-transform absolute top-1 ${
                        settings.rules.factChecking ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Rule 3 */}
                <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-[#0E1322] border border-white/5">
                  <div>
                    <h4 className="text-xs font-bold text-white">Claims &amp; Compliance</h4>
                    <p className="text-[11px] text-slate-400">
                      Checks promotional and regulatory guidelines.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRuleToggle('claimsCompliance')}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                      settings.rules.claimsCompliance ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 rounded-full bg-white transform transition-transform absolute top-1 ${
                        settings.rules.claimsCompliance ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Rule 4 */}
                <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-[#0E1322] border border-white/5">
                  <div>
                    <h4 className="text-xs font-bold text-white">Accessibility</h4>
                    <p className="text-[11px] text-slate-400">
                      Checks basic accessibility best practices.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRuleToggle('accessibility')}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                      settings.rules.accessibility ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 rounded-full bg-white transform transition-transform absolute top-1 ${
                        settings.rules.accessibility ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Danger Zone */}
            <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-bold text-white">Danger Zone</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Irreversible or high-impact actions for this workspace.
                </p>
              </div>

              <div className="rounded-2xl bg-[#0E1322] border border-red-500/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-auto">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Delete Workspace</h4>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Permanently remove this workspace, its data, and all related assets.
                    </p>
                  </div>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="self-start sm:self-auto"
                >
                  Delete
                </Button>
              </div>

              <div className="text-[11px] text-slate-500 pt-2">
                All data deletion operations require workspace administrator authorization.
              </div>
            </div>
          </div>

          {/* Bottom Save Changes Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" size="md" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={isSaving}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Workspace Members ({teamMembers.length})</h2>
              <p className="text-xs text-slate-400">
                Manage roles and approval permissions for your workspace team.
              </p>
            </div>
            <Button
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowInviteModal(true)}
            >
              Invite Member
            </Button>
          </div>

          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#0E1322] border border-white/5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                    {member.initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{member.name}</p>
                    <p className="text-[11px] text-slate-400">{member.email}</p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Connected Integrations</h2>
            <p className="text-xs text-slate-400">
              Connect design suites and notification channels to automate brand audits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-[#0E1322] border border-white/5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.connected
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.connected ? 'Active' : 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>

                <Button
                  variant={item.connected ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    const updated = integrations.map((i) =>
                      i.id === item.id ? { ...i, connected: !i.connected } : i
                    );
                    setIntegrations(updated);
                    if (onShowToast) {
                      onShowToast(
                        `${item.name} connection toggled. Backend OAuth will sync in production.`,
                        'info'
                      );
                    }
                  }}
                >
                  {item.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Tab */}
      {activeTab === 'api' && (
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">API Keys &amp; Webhooks</h2>
            <p className="text-xs text-slate-400">
              Authenticate external CI/CD pipelines and headless asset managers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E1322] border border-white/5 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Workspace Secret Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value="vf_live_948f2a1b9c7e3d5a4f6e8b0c2d4e6"
                className="w-full bg-[#121727] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-purple-300"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  navigator.clipboard?.writeText('vf_live_948f2a1b9c7e3d5a4f6e8b0c2d4e6');
                  if (onShowToast) onShowToast('API Key copied to clipboard.', 'success');
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              Never share secret API keys in client-side code repositories.
            </p>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="rounded-3xl bg-[#121727] border border-white/5 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Notification Preferences</h2>
            <p className="text-xs text-slate-400">
              Control when and how you receive compliance audit alerts.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Critical Violation Alerts', desc: 'Notify immediately when an asset contains high-severity brand compliance errors.' },
              { title: 'Audit Approval Digest', desc: 'Daily summary of all approved creative assets.' },
              { title: 'Weekly Governance Report', desc: 'Weekly compliance score trends and category violation breakdown.' }
            ].map((n, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#0E1322] border border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <p className="text-[11px] text-slate-400">{n.desc}</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-[#121727] border-white/20 text-purple-600 focus:ring-purple-500 mt-1 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmInput('');
        }}
        title="Delete Workspace Confirmation"
        description="This action cannot be undone. All audits, brand guidelines, and assets will be removed."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            <strong>Warning:</strong> You are about to permanently delete <strong>{settings.workspaceName || 'this workspace'}</strong>.
          </div>

          <Input
            label={`Please type "${settings.workspaceName || 'My Workspace'}" to confirm:`}
            value={deleteConfirmInput}
            onChange={(e) => setDeleteConfirmInput(e.target.value)}
            placeholder={settings.workspaceName || 'My Workspace'}
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteConfirmInput !== (settings.workspaceName || 'My Workspace')}
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmInput('');
                if (onShowToast) {
                  onShowToast(
                    'Workspace deletion protected: Server API connection required.',
                    'info'
                  );
                }
              }}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        description="Add a collaborator to review and manage brand audits."
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
              className="w-full bg-[#0E1322] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Lead Auditor">Lead Auditor (Can approve and resolve audits)</option>
              <option value="Reviewer">Reviewer (View and comment only)</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
