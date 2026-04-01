import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function GroupDetailPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const { user, isSuperAdmin, getGroupRole } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSubmitPayment, setShowSubmitPayment] = useState(false);
  const [showReject, setShowReject] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Payment form state
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payAmount, setPayAmount] = useState(1000);
  const [payMethod, setPayMethod] = useState<'BKASH' | 'BANK'>('BKASH');
  const [payTxId, setPayTxId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const role = groupId ? getGroupRole(groupId as string) : null;
  const isManager = role === 'MANAGER' || isSuperAdmin;

  const loadData = async () => {
    if (!groupId || !user) return;
    try {
      const [g, s, c] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/summary`),
        api.get(`/groups/${groupId}/contributions?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
      ]);
      setGroup(g.data);
      setSummary(s.data);
      setContributions(c.data);
      if (isManager) {
        const p = await api.get(`/groups/${groupId}/contributions/pending`);
        setPending(p.data);
      }
    } catch { toast.error('Failed to load group'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [groupId, user, isManager]);

  const handleVerify = async (contributionId: string) => {
    try {
      await api.patch(`/groups/${groupId}/contributions/${contributionId}/verify`, { status: 'VERIFIED' });
      toast.success('Payment approved!');
      setPending((prev) => prev.filter((p) => p.id !== contributionId));
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async () => {
    if (!showReject || !rejectReason) return;
    try {
      await api.patch(`/groups/${groupId}/contributions/${showReject}/verify`, { status: 'REJECTED', rejectionReason: rejectReason });
      toast.success('Payment rejected');
      setPending((prev) => prev.filter((p) => p.id !== showReject));
      setShowReject(null);
      setRejectReason('');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAddMember = async () => {
    if (!addEmail) return;
    try {
      await api.post(`/groups/${groupId}/members`, { email: addEmail });
      toast.success('Member added!');
      setShowAddMember(false);
      setAddEmail('');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from this group?`)) return;
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      toast.success('Member removed');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload/screenshot', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScreenshotUrl(res.data.url);
      toast.success('Screenshot uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSubmitPayment = async () => {
    if (!screenshotUrl) { toast.error('Screenshot is required'); return; }
    if (!payTxId) { toast.error('Transaction ID is required'); return; }
    setSubmitting(true);
    try {
      await api.post(`/groups/${groupId}/contributions`, {
        month: payMonth, year: payYear, amount: payAmount,
        paymentMethod: payMethod, transactionId: payTxId, screenshotUrl,
      });
      toast.success('Payment submitted!');
      setShowSubmitPayment(false);
      setPayTxId(''); setScreenshotUrl('');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <DashboardLayout><p className="text-gray-400">Loading...</p></DashboardLayout>;
  if (!group) return <DashboardLayout><p className="text-gray-500">Group not found</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-500">{group.description || 'Fund Group'} · Role: <span className="font-medium">{role || 'Admin'}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSubmitPayment(true)} className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90">
            + Submit Payment
          </button>
          {isManager && (
            <button onClick={() => setShowAddMember(true)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              + Add Member
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Fund Balance" value={`৳${(summary?.totalCollected || 0).toLocaleString()}`} />
        <StatCard title="Contributions" value={`৳${(summary?.totalContributions || 0).toLocaleString()}`} />
        <StatCard title="Fines Collected" value={`৳${(summary?.totalFines || 0).toLocaleString()}`} />
        <StatCard title="Active Members" value={String(summary?.memberCount || 0)} />
      </div>

      {/* Invite Link (Manager) */}
      {isManager && (
        <div className="rounded-xl bg-brand-primary/5 border border-brand-primary/20 p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Invite Link</p>
            <p className="text-xs text-gray-500">Share with new members</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join?code=${group.inviteCode}`); toast.success('Copied!'); }}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90">
            Copy Invite Link
          </button>
        </div>
      )}

      {/* Pending Verifications (Manager) */}
      {isManager && pending.length > 0 && (
        <div className="rounded-xl bg-white p-6 border border-orange-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Verifications <span className="text-sm font-normal text-orange-500">({pending.length})</span>
          </h2>
          <div className="space-y-3">
            {pending.map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-gray-50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-medium">{c.user.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.user.name}</p>
                    <p className="text-xs text-gray-500">{c.paymentMethod} · TxID: {c.transactionId} · ৳{c.amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.screenshotUrl && (
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}${c.screenshotUrl}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Proof</a>
                  )}
                  <button onClick={() => handleVerify(c.id)} className="rounded bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600">Approve</button>
                  <button onClick={() => setShowReject(c.id)} className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="rounded-xl bg-white p-6 border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Members</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-left font-medium text-gray-500">Name</th>
              <th className="pb-3 text-left font-medium text-gray-500">Email</th>
              <th className="pb-3 text-left font-medium text-gray-500">Role</th>
              {isManager && <th className="pb-3 text-right font-medium text-gray-500">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {group.memberships?.map((m: any) => (
              <tr key={m.user.id} className="border-b border-gray-50">
                <td className="py-3 font-medium text-gray-900">{m.user.name}</td>
                <td className="py-3 text-gray-500">{m.user.email}</td>
                <td className="py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${m.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{m.role}</span>
                </td>
                {isManager && (
                  <td className="py-3 text-right">
                    {m.role !== 'MANAGER' && (
                      <button onClick={() => handleRemoveMember(m.user.id, m.user.name)} className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* This Month's Contributions */}
      <div className="rounded-xl bg-white p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month</h2>
        {contributions.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No contributions yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left font-medium text-gray-500">Member</th>
                <th className="pb-3 text-left font-medium text-gray-500">Method</th>
                <th className="pb-3 text-left font-medium text-gray-500">Status</th>
                <th className="pb-3 text-right font-medium text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50">
                  <td className="py-3 font-medium text-gray-900">{c.user?.name}</td>
                  <td className="py-3 text-gray-500">{c.paymentMethod}</td>
                  <td className="py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                      c.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{c.status}</span>
                  </td>
                  <td className="py-3 text-right font-medium">৳{c.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <p className="text-sm text-gray-500 mb-4">Enter the email of a registered user to add them to this group.</p>
        <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} type="email" placeholder="member@example.com"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary mb-4" />
        <button onClick={handleAddMember} className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90">
          Add Member
        </button>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!showReject} onClose={() => { setShowReject(null); setRejectReason(''); }} title="Reject Payment">
        <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejection.</p>
        <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary mb-4" />
        <button onClick={handleReject} disabled={!rejectReason} className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
          Reject Payment
        </button>
      </Modal>

      {/* Submit Payment Modal */}
      <Modal isOpen={showSubmitPayment} onClose={() => setShowSubmitPayment(false)} title="Submit Payment">
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
            <input value={payTxId} onChange={(e) => setPayTxId(e.target.value)} placeholder="e.g. TXN123456789"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot Proof <span className="text-red-500">*</span></label>
            <input type="file" accept="image/*" onChange={handleUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20" />
            {uploading && <p className="mt-1 text-xs text-gray-400">Uploading...</p>}
            {screenshotUrl && <p className="mt-1 text-xs text-green-600">Uploaded ✓</p>}
          </div>
          <button onClick={handleSubmitPayment} disabled={submitting || uploading || !screenshotUrl}
            className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Payment'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
