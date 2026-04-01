import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { ContributionFilters, filterAndSort } from '@/components/ui/ContributionFilters';
import { ContributionList } from '@/components/ui/ContributionList';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { PiggyBank, AlertTriangle, Clock, Wallet, Users, DollarSign, Hourglass, LayoutGrid } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

function CollectionChart({ contributions, range }: { contributions: any[]; range: number }) {
  const now = new Date();
  const half = Math.floor(range / 2);
  const data = [];
  for (let i = -half; i <= range - half - 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const total = contributions
      .filter((c: any) => c.month === m && c.year === y && c.status === 'VERIFIED')
      .reduce((a: number, c: any) => a + c.amount, 0);
    const label = d.toLocaleString('en', { month: 'short', year: range > 6 ? '2-digit' : undefined });
    data.push({ name: label, contributions: total, isCurrent: i === 0 });
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4a7c59" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#4a7c59" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
        <Tooltip formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Collected']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
        <Area type="monotone" dataKey="contributions" stroke="#4a7c59" strokeWidth={2} fill="url(#colorContrib)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatusDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return <p className="text-sm text-gray-400 text-center py-8">No data yet</p>;

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
            {data.map((d, i) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(value: any, name: any) => [value, name]} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-gray-500">{d.name} <strong className="text-gray-700">{d.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

const RANGE_OPTIONS = [
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: '1Y', value: 12 },
  { label: '2Y', value: 24 },
];

const PAGE_SIZE = 10;

// ─── MEMBER DASHBOARD ──────────────────────────────────
function MemberDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalSaved: 0, totalFines: 0, pendingPayments: 0 });
  const [contributions, setContributions] = useState<any[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, statusFilter, methodFilter, sortBy]);

  const memberGroupId = user?.memberships?.[0]?.group.id || null;

  const loadMemberData = (gId: string) => {
    Promise.all([
      api.get(`/groups/${gId}`),
      api.get(`/groups/${gId}/contributions/my`),
      api.get(`/groups/${gId}/fines/my`),
    ]).then(([g, c, f]) => {
      setGroupId(gId);
      setGroup(g.data);
      setContributions(c.data);
      setPayAmount(g.data.monthlyAmount || 1000);

      const verified = c.data.filter((x: any) => x.status === 'VERIFIED');
      const pending = c.data.filter((x: any) => x.status === 'PENDING');
      setStats({
        totalSaved: verified.reduce((a: number, x: any) => a + x.amount, 0),
        totalFines: f.data.reduce((a: number, x: any) => a + x.amount, 0),
        pendingPayments: pending.length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!memberGroupId) { setLoading(false); return; }
    loadMemberData(memberGroupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberGroupId]);

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
      // Reload
      const c = await api.get(`/groups/${groupId}/contributions/my`);
      setContributions(c.data);
      const verified = c.data.filter((x: any) => x.status === 'VERIFIED');
      const pending = c.data.filter((x: any) => x.status === 'PENDING');
      setStats((s) => ({ ...s, totalSaved: verified.reduce((a: number, x: any) => a + x.amount, 0), pendingPayments: pending.length }));
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  if (!groupId) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl mb-2">🏠</p>
        <p className="text-gray-500 font-medium">You're not in any group yet</p>
        <p className="text-sm text-gray-400 mt-1">Your group manager will add you. Please wait.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{group?.name} · Welcome, {user?.name}</p>
        </div>
        <button onClick={() => setShowPayment(true)} className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 whitespace-nowrap shrink-0 w-full sm:w-auto">
          + Add Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Saved" value={`৳${stats.totalSaved.toLocaleString()}`} change="Verified contributions" changeType="positive" color="green" icon={PiggyBank} />
        <StatCard title="Total Fines" value={`৳${stats.totalFines.toLocaleString()}`} change={stats.totalFines > 0 ? 'Outstanding' : 'No fines!'} changeType={stats.totalFines > 0 ? 'negative' : 'positive'} color="red" icon={AlertTriangle} />
        <StatCard title="Pending Payments" value={String(stats.pendingPayments)} change="Awaiting verification" changeType="neutral" color="yellow" icon={Clock} />
      </div>

      {/* Contributions with Filters */}
      <div className="rounded-xl bg-white p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Contributions</h2>
        {contributions.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No contributions yet. Submit your first payment!</p>
        ) : (
          <>
            <ContributionFilters
              search={search} onSearchChange={setSearch}
              statusFilter={statusFilter} onStatusChange={setStatusFilter}
              methodFilter={methodFilter} onMethodChange={setMethodFilter}
              sortBy={sortBy} onSortChange={setSortBy}
            />
            {(() => {
              const filtered = filterAndSort(contributions, search, statusFilter, methodFilter, sortBy);
              return (
                <>
                  <ContributionList contributions={paginate(filtered, page, PAGE_SIZE)} />
                  <Pagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
                </>
              );
            })()}
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
    </>
  );
}

// ─── MANAGER DASHBOARD ─────────────────────────────────
function ManagerDashboard() {
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const groupId = user?.memberships?.find((m) => m.role === 'MANAGER')?.group.id;

  useEffect(() => {
    if (!groupId) { setLoading(false); return; }
    Promise.all([
      api.get(`/groups/${groupId}`),
      api.get(`/groups/${groupId}/summary`),
      api.get(`/groups/${groupId}/contributions/pending`),
      api.get(`/groups/${groupId}/contributions`),
    ]).then(([g, s, p, c]) => {
      setGroup(g.data);
      setSummary(s.data);
      setPending(p.data);
      setContributions(c.data);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const [chartRange, setChartRange] = useState(12);

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (!group) return <p className="text-gray-500">No group assigned. Contact your admin.</p>;

  const statusData = [
    { name: 'Verified', value: contributions.filter((c: any) => c.status === 'VERIFIED').length, color: '#22c55e' },
    { name: 'Pending', value: contributions.filter((c: any) => c.status === 'PENDING').length, color: '#f59e0b' },
    { name: 'Rejected', value: contributions.filter((c: any) => c.status === 'REJECTED').length, color: '#ef4444' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <p className="text-sm text-gray-500">Manager Dashboard · {group.memberships?.length || 0} members</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Fund Balance" value={`৳${(summary?.totalCollected || 0).toLocaleString()}`} color="green" icon={Wallet} />
        <StatCard title="Contributions" value={`৳${(summary?.totalContributions || 0).toLocaleString()}`} color="blue" icon={DollarSign} />
        <StatCard title="Fines" value={`৳${(summary?.totalFines || 0).toLocaleString()}`} color="red" icon={AlertTriangle} />
        <StatCard title="Pending" value={String(pending.length)} change={pending.length > 0 ? 'Needs attention' : 'All clear'} changeType={pending.length > 0 ? 'negative' : 'positive'} color="yellow" icon={Hourglass} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Collection Trend */}
        <div className="lg:col-span-2 rounded-xl bg-white p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Collection Trend</h3>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setChartRange(opt.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartRange === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <CollectionChart contributions={contributions} range={chartRange} />
          </div>
        </div>

        {/* Payment Status Donut */}
        <div className="rounded-xl bg-white p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment Status</h3>
          <StatusDonut data={statusData} />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {pending.length > 0 && (
          <a href="/verify" className="rounded-xl bg-orange-50 border border-orange-100 p-4 hover:border-orange-200 transition-colors">
            <p className="text-sm font-semibold text-orange-700">{pending.length} pending verifications</p>
            <p className="text-xs text-orange-500 mt-0.5">Review payments →</p>
          </a>
        )}
        <a href="/members" className="rounded-xl bg-purple-50 border border-purple-100 p-4 hover:border-purple-200 transition-colors">
          <p className="text-sm font-semibold text-purple-700">{group.memberships?.filter((m: any) => m.role === 'MEMBER').length || 0} members</p>
          <p className="text-xs text-purple-500 mt-0.5">Manage members →</p>
        </a>
        <a href="/contributions" className="rounded-xl bg-blue-50 border border-blue-100 p-4 hover:border-blue-200 transition-colors">
          <p className="text-sm font-semibold text-blue-700">{contributions.length} total contributions</p>
          <p className="text-xs text-blue-500 mt-0.5">View all →</p>
        </a>
      </div>
    </>
  );
}

// ─── SUPER ADMIN DASHBOARD ─────────────────────────────
function SuperAdminDashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [totalFund, setTotalFund] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get('/admin/groups').then(async (g) => {
      setGroups(g.data);
      // Fetch total fund across all groups
      const summaries = await Promise.all(
        g.data.map((grp: any) => api.get(`/groups/${grp.id}/summary`).then((s) => s.data).catch(() => ({ totalCollected: 0 })))
      );
      setTotalFund(summaries.reduce((acc: number, s: any) => acc + (s.totalCollected || 0), 0));
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const totalUsers = groups.reduce((acc: number, g: any) => acc + (g.memberships?.length || 0), 0);
  const activeGroups = groups.filter((g: any) => g.status === 'ACTIVE').length;
  const pausedGroups = groups.length - activeGroups;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Groups" value={String(activeGroups)} color="green" icon={LayoutGrid} change={`of ${groups.length} total`} changeType="positive" />
        <StatCard title="Paused Groups" value={String(pausedGroups)} color="yellow" icon={Clock} change={pausedGroups > 0 ? 'Needs review' : 'None paused'} changeType={pausedGroups > 0 ? 'negative' : 'positive'} />
        <StatCard title="Fund Collected" value={`৳${totalFund.toLocaleString()}`} color="blue" icon={PiggyBank} change="Across all groups" changeType="neutral" />
        <StatCard title="Total Users" value={String(totalUsers)} color="purple" icon={Users} change={`In ${groups.length} groups`} changeType="neutral" />
      </div>

      {/* Groups */}
      <div className="rounded-xl bg-white p-4 sm:p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Groups</h2>
          <a href="/admin/groups" className="text-sm text-brand-primary hover:underline">View all →</a>
        </div>
        {loading ? <p className="text-gray-400">Loading...</p> : groups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No groups yet</p>
            <a href="/admin/groups" className="text-sm text-brand-primary hover:underline mt-1 inline-block">Create your first group →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.slice(0, 5).map((g: any) => {
              const mgr = g.memberships?.find((m: any) => m.role === 'MANAGER');
              return (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold">
                      {g.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-400">
                        {mgr ? `Manager: ${mgr.user.name}` : <span className="text-orange-500">No manager</span>}
                        {' · '}{g.memberships?.length || 0} members · ৳{g.monthlyAmount}/mo
                      </p>
                    </div>
                  </div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${g.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{g.status}</span>
                </div>
              );
            })}
            {groups.length > 5 && (
              <p className="text-xs text-gray-400 text-center pt-2">and {groups.length - 5} more — <a href="/admin/groups" className="text-brand-primary hover:underline">view all</a></p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const isManager = !isSuperAdmin && (user?.memberships?.some((m) => m.role === 'MANAGER') || false);

  if (loading) return <DashboardLayout><p className="text-gray-400">Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      {isSuperAdmin && <SuperAdminDashboard />}
      {isManager && <ManagerDashboard />}
      {!isSuperAdmin && !isManager && <MemberDashboard />}
    </DashboardLayout>
  );
}
