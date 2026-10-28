import React from 'react';
import { Check, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { AuditStatus } from '../../types';

interface BadgeProps {
  status: AuditStatus | 'On Track' | 'Compliant' | 'Needs Review' | 'Low' | 'Medium' | 'High' | 'Passed' | 'Warning' | 'Failed';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium'
  };

  switch (status) {
    case 'Approved':
    case 'Compliant':
    case 'On Track':
    case 'Passed':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses[size]}`}>
          {showIcon && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          <span>{status}</span>
        </span>
      );

    case 'Needs Fix':
    case 'Needs Review':
    case 'Warning':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses[size]}`}>
          {showIcon && <RefreshCw className="w-3.5 h-3.5 stroke-[2]" />}
          <span>{status}</span>
        </span>
      );

    case 'Rejected':
    case 'Failed':
      return (
        <span className={`inline-flex items-center rounded-full bg-red-500/10 text-red-400 border border-red-500/30 ${sizeClasses[size]}`}>
          {showIcon && <X className="w-3.5 h-3.5 stroke-[2.5]" />}
          <span>{status}</span>
        </span>
      );

    case 'Low':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 ${sizeClasses[size]}`}>
          <span>Low</span>
        </span>
      );

    case 'Medium':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 ${sizeClasses[size]}`}>
          <AlertTriangle className="w-3 h-3 stroke-[2]" />
          <span>Medium</span>
        </span>
      );

    case 'High':
      return (
        <span className={`inline-flex items-center rounded-full bg-red-500/15 text-red-400 border border-red-500/30 ${sizeClasses[size]}`}>
          <AlertTriangle className="w-3 h-3 stroke-[2]" />
          <span>High</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses[size]}`}>
          <span>{status}</span>
        </span>
      );
  }
};

