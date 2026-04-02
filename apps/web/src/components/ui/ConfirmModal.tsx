import { Modal } from './Modal';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

const iconMap = {
  danger: <Trash2 className="w-6 h-6 text-red-500" />,
  warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
  default: <Info className="w-6 h-6 text-blue-500" />,
};

const bgMap = {
  danger: 'bg-red-100',
  warning: 'bg-yellow-100',
  default: 'bg-blue-100',
};

const btnMap = {
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  default: 'bg-brand-primary hover:bg-brand-primary/90 text-white',
};

export function ConfirmModal({
  isOpen, onClose, onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('common.confirm');
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={resolvedTitle}>
      <div className="text-center py-2">
        <div className={cn('h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4', bgMap[variant])}>
          {iconMap[variant]}
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn('flex-1 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50', btnMap[variant])}
          >
            {loading ? t('common.processing') : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
