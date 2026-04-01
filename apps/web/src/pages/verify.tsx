import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { CheckCircle, XCircle, ExternalLink, Image } from 'lucide-react';

const PAGE_SIZE = 10;

export default function VerifyPaymentsPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  // Reject modal
  const [showReject, setShowReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Proof modal
  const [showProof, setShowProof] = useState<string | null>(null);

  const groupId = user?.memberships?.find((m) => m.role === 'MANAGER')?.group.id;

  const loadData = () => {
    if (!groupId) { setLoading(false); return; }
    api.get(`/groups/${groupId}/contributions/pending`)
      .then((r) => setPending(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => { setPage(1); }, [search, monthFilter]);

  const filtered = pending.filter((c: any) => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.user?.name?.toLowerCase().includes(q) || c.transactionId?.toLowerCase().includes(q);
    const matchMonth = !monthFilter || `${c.month}-${c.year}` === monthFilter;
    return matchSearch && matchMonth;
  });

  // Get unique months for filter
  const months = [...new Set(pending.map((c: any) => `${c.month}-${c.year}`))].sort().reverse();

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/groups/${groupId}/contributions/${id}/verify`, { status: 'VERIFIED' });
      toast.success('Payment approved!');
      setPending((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async () => {
    if (!showReject || !rejectReason.trim()) { toast.error('Reason is required'); return; }
    try {
      await api.patch(`/groups/${groupId}/contributions/${showReject}/verify`, { status: 'REJECTED', rejectionReason: rejectReason });
      toast.success('Payment rejected');
      setPending((prev) => prev.filter((p) => p.id !== showReject));
      setShowReject(null);
      setRejectReason('');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verify Payments</h1>
        <p className="text-sm text-gray-500">{pending.length} pending verifications</p>
      </div>

      {/* Filters */}
      {pending.length > 0 && (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 mb-4 sm:justify-end">
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-brand-primary bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M5%206L0%200h10z%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat">
            <option value="">All Months</option>
            {months.map((m) => {
              const [mo, yr] = m.split('-');
              return <option key={m} value={m}>{new Date(0, Number(mo) - 1).toLocaleString('en', { month: 'short' })} {yr}</option>;
            })}
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member or TxID..."
            className="sm:w-64 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
          {(search || monthFilter) && (
            <button onClick={() => { setSearch(''); setMonthFilter(''); }} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">Clear</button>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
        {loading ? <p className="text-gray-400 p-6">Loading...</p> : pending.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">All caught up!</p>
            <p className="text-sm text-gray-400 mt-0.5">No pending payments to verify</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 p-6 text-center">No pending payments match your filters</p>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Member</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Month</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Method</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">TxID</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Amount</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Proof</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Submitted</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginate(filtered, page, PAGE_SIZE).map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">{c.user.name.charAt(0)}</div>
                          <span className="font-medium text-gray-900">{c.user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{new Date(0, c.month - 1).toLocaleString('en', { month: 'short' })} {c.year}</td>
                      <td className="px-5 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{c.paymentMethod}</span></td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">{c.transactionId}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">৳{c.amount}</td>
                      <td className="px-5 py-3">
                        {c.screenshotUrl ? (
                          <button onClick={() => setShowProof(`${process.env.NEXT_PUBLIC_API_URL}${c.screenshotUrl}`)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            <Image className="w-3 h-3" /> View
                          </button>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{new Date(c.submittedAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleApprove(c.id)} className="rounded-lg bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 text-xs font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => setShowReject(c.id)} className="rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 text-xs font-medium flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-50">
              {paginate(filtered, page, PAGE_SIZE).map((c: any) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">{c.user.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.user.name}</p>
                        <p className="text-xs text-gray-400">{new Date(0, c.month - 1).toLocaleString('en', { month: 'short' })} {c.year}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">৳{c.amount}</p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{c.paymentMethod}</span>
                    <span className="text-xs text-gray-400 font-mono">{c.transactionId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.screenshotUrl && (
                      <button onClick={() => setShowProof(`${process.env.NEXT_PUBLIC_API_URL}${c.screenshotUrl}`)} className="rounded-lg bg-gray-100 text-gray-600 px-3 py-2 text-xs font-medium flex-1 text-center">
                        View Proof
                      </button>
                    )}
                    <button onClick={() => handleApprove(c.id)} className="rounded-lg bg-green-500 text-white px-3 py-2 text-xs font-medium flex-1 text-center">
                      Approve
                    </button>
                    <button onClick={() => setShowReject(c.id)} className="rounded-lg bg-red-50 text-red-600 px-3 py-2 text-xs font-medium flex-1 text-center">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-50">
              <Pagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={!!showReject} onClose={() => { setShowReject(null); setRejectReason(''); }} title="Reject Payment">
        <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejection.</p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection..."
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary mb-4 resize-none"
        />
        <button onClick={handleReject} disabled={!rejectReason.trim()} className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
          Reject Payment
        </button>
      </Modal>

      {/* Proof Modal */}
      <Modal isOpen={!!showProof} onClose={() => setShowProof(null)} title="Payment Proof">
        {showProof && (
          <div>
            <img src={showProof} alt="Payment proof" className="w-full rounded-lg border border-gray-100" />
            <a href={showProof} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1 text-xs text-brand-primary hover:underline">
              <ExternalLink className="w-3 h-3" /> Open full size
            </a>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
