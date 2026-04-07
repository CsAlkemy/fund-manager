import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';
import { useGroup } from '@/hooks/useGroup';
import { useTranslation } from '@/i18n/useTranslation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api, assetUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { ExternalLink, Trash2 } from 'lucide-react';

const CATEGORIES = ['SUPPLIES', 'EVENT', 'MAINTENANCE', 'TRANSPORT', 'OTHER'] as const;

export default function ExpensesPage() {
  const { isSuperAdmin } = useAuth();
  const { selectedGroupId: groupId, isManagerOfSelected } = useGroup();
  const { t, locale } = useTranslation();
  const isManager = !isSuperAdmin && isManagerOfSelected;

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Proof modal
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const loadExpenses = () => {
    if (!groupId) { setLoading(false); return; }
    api.get(`/groups/${groupId}/expenses`)
      .then((r) => setExpenses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadExpenses(); }, [groupId]);

  const totalSpent = expenses.reduce((a: number, e: any) => a + e.amount, 0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload/screenshot', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReceiptUrl(res.data.url);
    } catch { toast.error(t('payment.uploadFailed')); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!description.trim()) errors.description = t('expenses.descriptionRequired');
    if (!amount || amount <= 0) errors.amount = t('expenses.amountRequired');
    if (!receiptUrl) errors.receipt = t('payment.screenshotRequired');
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!groupId) return;

    setSubmitting(true);
    try {
      await api.post(`/groups/${groupId}/expenses`, {
        description: description.trim(),
        amount,
        category: category || undefined,
        date: date || undefined,
        receiptUrl: receiptUrl || undefined,
      });
      toast.success(t('expenses.submitted'));
      setShowAdd(false);
      setDescription(''); setAmount(''); setCategory(''); setReceiptUrl('');
      setDate(new Date().toISOString().slice(0, 10));
      loadExpenses();
    } catch (err: any) { toast.error(err.response?.data?.message || t('common.failed')); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId || !groupId) return;
    try {
      await api.delete(`/groups/${groupId}/expenses/${deleteId}`);
      toast.success(t('expenses.deleted'));
      setDeleteId(null);
      loadExpenses();
    } catch { toast.error(t('common.failed')); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('expenses.title')}</h1>
          <p className="text-sm text-gray-500">
            {totalSpent > 0 ? t('expenses.totalSpent', { amount: totalSpent.toLocaleString() }) : t('expenses.subtitle')}
          </p>
        </div>
        {isManager && groupId && (
          <button onClick={() => setShowAdd(true)} className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 whitespace-nowrap shrink-0 w-full sm:w-auto">
            {t('expenses.addExpense')}
          </button>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 sm:p-6 border border-gray-100">
        {loading ? (
          <LoadingSpinner />
        ) : expenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('expenses.noExpenses')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left font-medium text-gray-500">{t('table.date')}</th>
                    <th className="pb-3 text-left font-medium text-gray-500">{t('table.description')}</th>
                    <th className="pb-3 text-left font-medium text-gray-500">{t('table.category')}</th>
                    <th className="pb-3 text-left font-medium text-gray-500">{t('table.receipt')}</th>
                    <th className="pb-3 text-right font-medium text-gray-500">{t('table.amount')}</th>
                    {isManager && <th className="pb-3 text-right font-medium text-gray-500"></th>}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e: any) => (
                    <tr key={e.id} className="border-b border-gray-50">
                      <td className="py-3 text-gray-900">
                        {new Date(e.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 text-gray-900">
                        <p className="font-medium">{e.description}</p>
                        <p className="text-xs text-gray-400">{t('expenses.recordedBy', { name: e.recorder?.name || '—' })}</p>
                      </td>
                      <td className="py-3 text-gray-500">
                        {e.category ? (
                          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {t(`expenses.category${e.category}`)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3">
                        {e.receiptUrl ? (
                          <button onClick={() => setProofUrl(assetUrl(e.receiptUrl))} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> {t('verify.viewProof')}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">৳{e.amount.toLocaleString()}</td>
                      {isManager && (
                        <td className="py-3 text-right">
                          <button onClick={() => setDeleteId(e.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {expenses.map((e: any) => (
                <div key={e.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{e.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(e.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">৳{e.amount.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {e.category && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                          {t(`expenses.category${e.category}`)}
                        </span>
                      )}
                      {e.receiptUrl && (
                        <button onClick={() => setProofUrl(assetUrl(e.receiptUrl))} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> {t('verify.viewProof')}
                        </button>
                      )}
                    </div>
                    {isManager && (
                      <button onClick={() => setDeleteId(e.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{t('expenses.recordedBy', { name: e.recorder?.name || '—' })}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setFormErrors({}); }} title={t('expenses.addExpense')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.description')} <span className="text-red-500">*</span></label>
            <input
              value={description}
              onChange={(e) => { setDescription(e.target.value); setFormErrors((p) => ({ ...p, description: '' })); }}
              placeholder={t('expenses.descriptionPlaceholder')}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-1 ${formErrors.description ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-brand-primary focus:ring-brand-primary'}`}
            />
            {formErrors.description && <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.amount')} <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(Number(e.target.value)); setFormErrors((p) => ({ ...p, amount: '' })); }}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-1 ${formErrors.amount ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-brand-primary focus:ring-brand-primary'}`}
              />
              {formErrors.amount && <p className="mt-1 text-xs text-red-500">{formErrors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.date')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
            >
              <option value="">{t('expenses.categoryNone')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`expenses.category${c}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.receipt')} <span className="text-red-500">*</span></label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => { handleUpload(e); setFormErrors((p) => ({ ...p, receipt: '' })); }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"
            />
            {uploading && <p className="mt-1 text-xs text-gray-400">{t('payment.uploading')}</p>}
            {receiptUrl && <p className="mt-1 text-xs text-green-600">{t('payment.uploaded')}</p>}
            {formErrors.receipt && <p className="mt-1 text-xs text-red-500">{formErrors.receipt}</p>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading || !receiptUrl}
            className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {submitting ? t('expenses.submitting') : t('expenses.submitExpense')}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('common.confirm')}
        message={t('expenses.deleteConfirm')}
        confirmLabel={t('common.delete')}
        variant="danger"
      />

      {/* Receipt Proof Modal */}
      <Modal isOpen={!!proofUrl} onClose={() => setProofUrl(null)} title={t('table.receipt')}>
        {proofUrl && (
          <div className="space-y-3">
            <img src={proofUrl} alt="Receipt" className="w-full rounded-lg" />
            <a href={proofUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-sm text-blue-500 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> {t('verify.openFullSize')}
            </a>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
