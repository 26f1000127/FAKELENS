import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  isOpen,
  onClose,
  duration = 3500
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-500/30',
      bg: 'bg-[#0E1B1E]',
      text: 'text-emerald-400',
      iconColor: 'text-emerald-400'
    },
    error: {
      icon: AlertCircle,
      border: 'border-red-500/30',
      bg: 'bg-[#1C1217]',
      text: 'text-red-400',
      iconColor: 'text-red-400'
    },
    info: {
      icon: Info,
      border: 'border-purple-500/30',
      bg: 'bg-[#141224]',
      text: 'text-purple-300',
      iconColor: 'text-purple-400'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${config.border} ${config.bg} shadow-2xl backdrop-blur-md max-w-md`}
        role="status"
        aria-live="polite"
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
        <p className={`text-xs font-semibold ${config.text} leading-tight`}>{message}</p>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 ml-2 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-purple-400"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

