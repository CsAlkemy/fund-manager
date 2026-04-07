import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContributionFilters, filterAndSort } from '@/components/ui/ContributionFilters';
import { ContributionList } from '@/components/ui/ContributionList';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import { api } from '@/lib/api';

import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export default function ContributionsPage() {
  const { user, isSuperAdmin } = useAuth();
  const { t, locale } = useTranslation();
  const isManager = !isSuperAdmin && (user?.memberships?.some((m) => m.role === 'MANAGER') || false);
  const [contributions, setContributions] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const groupId = user?.memberships?.[0]?.group.id || null;

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payAmount, setPayAmount] = useState(1000);
  const [payMethod, setPayMethod] = useState<'BKASH' | 'BANK'>('BKASH');
  const [payTxId, setPayTxId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [groupData, setGroupData] = useState<any>(null);

  const loadData = (gId: string, mgr: boolean) => {
    Promise.all([
      mgr
        ? api.get(`/groups/${gId}/contributions`).then((r) => r.data)
        : api.get(`/groups/${gId}/contributions/my`).then((r) => r.data),
      api.get(`/groups/${gId}/fines/my`).then((r) => r.data).catch(() => []),
      api.get(`/groups/${gId}`).then((r) => r.data).catch(() => null),
    ]).then(([c, f, g]) => {
      setContributions(c);
      setFines(f);
      if (g) {
        setGroupData(g);
        const pf = f.filter((x: any) => x.status === 'PENDING').reduce((a: number, x: any) => a + x.amount, 0);
        setPayAmount((g.monthlyAmount || 1000) + pf);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!groupId) { setLoading(false); return; }
    loadData(groupId, isManager);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const verified = contributions.filter((c) => c.status === 'VERIFIED');
  const pendingFines = fines.filter((f) => f.status === 'PENDING').reduce((a: number, f: any) => a + f.amount, 0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, statusFilter, methodFilter, monthFilter, sortBy]);

  // Manager sees only verified, Member sees all their own
  const displayContributions = isManager ? verified : contributions;
  const filtered = filterAndSort(displayContributions, search, isManager ? '' : statusFilter, methodFilter, sortBy, isManager, monthFilter);

  // Unique months for filter
  const availableMonths = [...new Set(displayContributions.map((c: any) => `${c.month}-${c.year}`))].sort().reverse();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload/screenshot', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScreenshotUrl(res.data.url);
    } catch { toast.error(t('payment.uploadFailed')); }
    finally { setUploading(false); }
  };

  const minAmount = (groupData?.monthlyAmount || 1000) + pendingFines;

  const handleSubmitPayment = async () => {
    const errors: Record<string, string> = {};
    if (!payTxId.trim()) errors.txId = t('payment.txIdRequired');
    if (!screenshotUrl) errors.screenshot = t('payment.screenshotRequired');
    if (payAmount < minAmount) errors.amount = t('payment.minRequired', { amount: minAmount.toLocaleString() }) + (pendingFines > 0 ? t('payment.minWithFine', { monthly: String(groupData?.monthlyAmount), fine: String(pendingFines) }) : '');
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!groupId) return;
    setSubmitting(true);
    try {
      await api.post(`/groups/${groupId}/contributions`, {
        month: payMonth, year: payYear, amount: payAmount,
        paymentMethod: payMethod, transactionId: payTxId, screenshotUrl,
      });
      toast.success(t('payment.submitted'));
      setShowPayment(false);
      setPayTxId(''); setScreenshotUrl('');
      if (groupId) loadData(groupId, isManager);
    } catch (err: any) { toast.error(err.response?.data?.message || t('common.failed')); }
    finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isManager ? t('contributions.title') : t('contributions.myTitle')}
          </h1>
          <p className="text-sm text-gray-500">
            {isManager ? t('contributions.verifiedPayments', { count: verified.length }) : t('contributions.subtitle')}
          </p>
        </div>
        {!isManager && groupId && (
          <button onClick={() => setShowPayment(true)} className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 whitespace-nowrap shrink-0 w-full sm:w-auto">
            {t('dashboard.addPayment')}
          </button>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 sm:p-6 border border-gray-100">
        {loading ? (
          <p className="text-gray-400">{t('common.loading')}</p>
        ) : contributions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('contributions.noContributions')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('contributions.submitFirst')}</p>
          </div>
        ) : (
          <>
            <ContributionFilters
              search={search} onSearchChange={setSearch}
              statusFilter={statusFilter} onStatusChange={setStatusFilter}
              methodFilter={methodFilter} onMethodChange={setMethodFilter}
              sortBy={sortBy} onSortChange={setSortBy}
              monthFilter={monthFilter} onMonthChange={setMonthFilter} months={availableMonths}
              showMemberSearch={isManager}
              hideStatus={isManager}
            />
            <ContributionList contributions={paginate(filtered, page, PAGE_SIZE)} showMember={isManager} />
            <Pagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Submit Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => { setShowPayment(false); setFormErrors({}); }} title={t('payment.addPayment')}>
        <div className="space-y-4">
          {pendingFines > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3">
              <p className="text-xs font-medium text-red-700">{t('payment.pendingFines', { amount: pendingFines.toLocaleString() })}</p>
              <p className="text-[11px] text-red-500 mt-0.5">{t('payment.minPayment', { amount: minAmount.toLocaleString(), monthly: String(groupData?.monthlyAmount), fine: String(pendingFines) })}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.month')}</label>
              <select value={payMonth} onChange={(e) => setPayMonth(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString(locale, { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.year')}</label>
              <input type="number" value={payYear} onChange={(e) => setPayYear(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.amount')}</label>
            <input type="number" value={payAmount} onChange={(e) => { setPayAmount(Number(e.target.value)); setFormErrors((p) => ({ ...p, amount: '' })); }} className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-1 ${formErrors.amount ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-brand-primary focus:ring-brand-primary'}`} />
            {formErrors.amount && <p className="mt-1 text-xs text-red-500">{formErrors.amount}</p>}
            {!formErrors.amount && pendingFines > 0 && <p className="mt-1 text-[11px] text-gray-400">{t('payment.minHint', { amount: minAmount.toLocaleString() })}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.method')}</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary">
              <option value="BKASH">{t('payment.bkash')}</option>
              <option value="BANK">{t('payment.bank')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.txId')} <span className="text-red-500">*</span></label>
            <input value={payTxId} onChange={(e) => { setPayTxId(e.target.value); setFormErrors((p) => ({ ...p, txId: '' })); }} placeholder={t('payment.txIdPlaceholder')} className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-1 ${formErrors.txId ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-brand-primary focus:ring-brand-primary'}`} />
            {formErrors.txId && <p className="mt-1 text-xs text-red-500">{formErrors.txId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.screenshot')} <span className="text-red-500">*</span></label>
            <input type="file" accept="image/*" onChange={(e) => { handleUpload(e); setFormErrors((p) => ({ ...p, screenshot: '' })); }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20" />
            {uploading && <p className="mt-1 text-xs text-gray-400">{t('payment.uploading')}</p>}
            {screenshotUrl && <p className="mt-1 text-xs text-green-600">{t('payment.uploaded')}</p>}
            {formErrors.screenshot && <p className="mt-1 text-xs text-red-500">{formErrors.screenshot}</p>}
          </div>
          <button onClick={handleSubmitPayment} disabled={submitting || uploading || !screenshotUrl} className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50">
            {submitting ? t('payment.submitting') : t('payment.submitPayment')}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
