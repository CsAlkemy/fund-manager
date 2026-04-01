import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { ContributionFilters, filterAndSort } from '@/components/ui/ContributionFilters';
import { ContributionList } from '@/components/ui/ContributionList';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { PiggyBank, AlertTriangle, Clock, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export default function ContributionsPage() {
  const { user, isSuperAdmin } = useAuth();
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

  const loadData = (gId: string, mgr: boolean) => {
    Promise.all([
      mgr
        ? api.get(`/groups/${gId}/contributions`).then((r) => r.data)
        : api.get(`/groups/${gId}/contributions/my`).then((r) => r.data),
      api.get(`/groups/${gId}/fines/my`).then((r) => r.data).catch(() => []),
    ]).then(([c, f]) => {
      setContributions(c);
      setFines(f);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!groupId) { setLoading(false); return; }
    loadData(groupId, isManager);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const verified = contributions.filter((c) => c.status === 'VERIFIED');
  const pending = contributions.filter((c) => c.status === 'PENDING');
  const totalSaved = verified.reduce((a: number, c: any) => a + c.amount, 0);
  const totalFines = fines.reduce((a: number, f: any) => a + f.amount, 0);
  const pendingFines = fines.filter((f) => f.status === 'PENDING').reduce((a: number, f: any) => a + f.amount, 0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, statusFilter, methodFilter, sortBy]);

  const filtered = filterAndSort(contributions, search, statusFilter, methodFilter, sortBy, isManager);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload/screenshot', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScreenshotUrl(res.data.url);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSubmitPayment = async () => {
    if (!screenshotUrl) { toast.error('Screenshot is required'); return; }
    if (!payTxId) { toast.error('Transaction ID is required'); return; }
    if (!groupId) return;
    setSubmitting(true);
    try {
      await api.post(`/groups/${groupId}/contributions`, {
        month: payMonth, year: payYear, amount: payAmount,
        paymentMethod: payMethod, transactionId: payTxId, screenshotUrl,
      });
      toast.success('Payment submitted!');
      setShowPayment(false);
      setPayTxId(''); setScreenshotUrl('');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isManager ? 'All Contributions' : 'My Contributions'}
          </h1>
          <p className="text-sm text-gray-500">
            {isManager ? 'All member payments in your group' : 'Your payment history and stats'}
          </p>
        </div>
        {!isManager && groupId && (
          <button onClick={() => setShowPayment(true)} className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 whitespace-nowrap shrink-0 w-full sm:w-auto">
            + Add Payment
          </button>
        )}
      </div>

      {!isManager && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Saved" value={`৳${totalSaved.toLocaleString()}`} change={`${verified.length} verified`} changeType="positive" color="green" icon={PiggyBank} />
          <StatCard title="Total Fines" value={`৳${totalFines.toLocaleString()}`} change={pendingFines > 0 ? `৳${pendingFines} pending` : 'No pending fines'} changeType={pendingFines > 0 ? 'negative' : 'positive'} color="red" icon={AlertTriangle} />
          <StatCard title="Pending" value={String(pending.length)} change="Awaiting verification" changeType="neutral" color="yellow" icon={Clock} />
          <StatCard title="Total Payments" value={String(contributions.length)} change="All time" changeType="neutral" color="blue" icon={Hash} />
        </div>
      )}

      <div className="rounded-xl bg-white p-4 sm:p-6 border border-gray-100">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : contributions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No contributions yet</p>
            <p className="text-sm text-gray-400 mt-1">Submit your first payment using the button above</p>
          </div>
        ) : (
          <>
            <ContributionFilters
              search={search} onSearchChange={setSearch}
              statusFilter={statusFilter} onStatusChange={setStatusFilter}
              methodFilter={methodFilter} onMethodChange={setMethodFilter}
              sortBy={sortBy} onSortChange={setSortBy}
              showMemberSearch={isManager}
            />
            <ContributionList contributions={paginate(filtered, page, PAGE_SIZE)} showMember={isManager} />
            <Pagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Submit Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Add Payment">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select value={payMonth} onChange={(e) => setPayMonth(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input type="number" value={payYear} onChange={(e) => setPayYear(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳)</label>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary">
              <option value="BKASH">bKash</option>
              <option value="BANK">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
            <input value={payTxId} onChange={(e) => setPayTxId(e.target.value)} placeholder="e.g. TXN123456789" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot Proof <span className="text-red-500">*</span></label>
            <input type="file" accept="image/*" onChange={handleUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20" />
            {uploading && <p className="mt-1 text-xs text-gray-400">Uploading...</p>}
            {screenshotUrl && <p className="mt-1 text-xs text-green-600">Uploaded ✓</p>}
          </div>
          <button onClick={handleSubmitPayment} disabled={submitting || uploading || !screenshotUrl} className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Payment'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
