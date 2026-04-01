import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { Plus, Pencil, Pause, Play, ChevronRight, Mail } from 'lucide-react';

const PAGE_SIZE = 10;

export default function AdminGroupsPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [showEdit, setShowEdit] = useState<any>(null);

  // Create form
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cMonthly, setCMonthly] = useState(1000);
  const [cFine, setCFine] = useState(100);
  const [cDeadline, setCDeadline] = useState(15);
  const [mgrName, setMgrName] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrPhone, setMgrPhone] = useState('');
  const [selectedMgrId, setSelectedMgrId] = useState('');
  const [showExistingManagers, setShowExistingManagers] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const loadData = async () => {
    try {
      const [g, u] = await Promise.all([api.get('/admin/groups'), api.get('/admin/users')]);
      setGroups(g.data);
      setUsers(u.data.users);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) { router.replace('/dashboard'); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, authLoading]);

  const resetCreateForm = () => {
    setCName(''); setCDesc(''); setCMonthly(1000); setCFine(100); setCDeadline(15);
    setMgrName(''); setMgrEmail(''); setMgrPhone(''); setSelectedMgrId('');
    setCreateStep(1); setShowExistingManagers(false);
  };

  const onCreateNext = () => {
    if (!cName.trim()) { toast.error('Group name is required'); return; }
    setCreateStep(2);
  };

  const onCreateGroup = async () => {
    const isNewMgr = !showExistingManagers;
    if (isNewMgr && (!mgrName.trim() || !mgrEmail.trim())) { toast.error('Manager name and email are required'); return; }
    if (showExistingManagers && !selectedMgrId) { toast.error('Please select a manager'); return; }
    setCreatingGroup(true);
    try {
      const res = await api.post('/admin/groups', {
        name: cName, description: cDesc, monthlyAmount: cMonthly, fineAmount: cFine, fineDeadlineDay: cDeadline,
      });
      let managerId = selectedMgrId;
      if (isNewMgr) {
        await api.post('/auth/request-otp', { email: mgrEmail });
        const verifyRes = await api.post('/auth/verify-otp', { email: mgrEmail, code: '000000' });
        const usersRes = await api.get('/admin/users');
        const newUser = usersRes.data.users.find((u: any) => u.email === mgrEmail);
        if (newUser) {
          managerId = newUser.id;
          if (mgrName) await api.post('/auth/register', { name: mgrName, phone: mgrPhone }, { headers: { Authorization: `Bearer ${verifyRes.data.token}` } });
        }
      }
      if (managerId) await api.patch(`/admin/groups/${res.data.id}/manager`, { managerId });
      toast.success('Group created!');
      setShowCreate(false);
      resetCreateForm();
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreatingGroup(false); }
  };

  const onEditGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.patch(`/admin/groups/${showEdit.id}`, {
        name: fd.get('name'), description: fd.get('description'),
        monthlyAmount: Number(fd.get('monthlyAmount')), fineAmount: Number(fd.get('fineAmount')), fineDeadlineDay: Number(fd.get('fineDeadlineDay')),
      });
      toast.success('Updated');
      setShowEdit(null);
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const onToggleStatus = async (e: React.MouseEvent, groupId: string, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.patch(`/admin/groups/${groupId}/status`, { status: status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' });
      toast.success('Status updated');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const filteredGroups = groups.filter((g: any) => {
    const mgr = g.memberships?.find((m: any) => m.role === 'MANAGER');
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      g.name.toLowerCase().includes(q) ||
      mgr?.user?.name?.toLowerCase().includes(q) ||
      mgr?.user?.email?.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const inputCls = "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary";
  const selectCls = "rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-brand-primary bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M5%206L0%200h10z%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat";

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-sm text-gray-500">{groups.length} groups</p>
        </div>
        <button onClick={() => { resetCreateForm(); setShowCreate(true); }} className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </div>

      {/* Filters */}
      {groups.length > 0 && (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 mb-4 sm:justify-end">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search group or manager..."
            className="sm:w-64 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">
              Clear
            </button>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
        {loading ? <p className="text-gray-400 p-6">Loading...</p> : groups.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-2">No groups yet</p>
            <button onClick={() => { resetCreateForm(); setShowCreate(true); }} className="text-brand-primary hover:underline text-sm">Create your first group</button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <p className="text-gray-400 p-6 text-center">No groups match your filters</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Group</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Manager</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Members</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Monthly</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginate(filteredGroups, page, PAGE_SIZE).map((g: any) => {
                    const mgr = g.memberships?.find((m: any) => m.role === 'MANAGER');
                    const memberCount = g.memberships?.filter((m: any) => m.role === 'MEMBER').length || 0;
                    return (
                      <tr key={g.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/groups/${g.id}`)}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">{g.name.charAt(0)}</div>
                            <span className="font-medium text-gray-900">{g.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{mgr ? mgr.user.name : <span className="text-orange-500 text-xs">Unassigned</span>}</td>
                        <td className="px-5 py-3 text-gray-600">{memberCount}</td>
                        <td className="px-5 py-3 text-gray-600">৳{g.monthlyAmount}</td>
                        <td className="px-5 py-3">
                          <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                            g.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          )}>{g.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setShowEdit(g); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => onToggleStatus(e, g.id, g.status)} className="p-1.5 rounded-lg text-gray-400 hover:bg-yellow-50 hover:text-yellow-600" title={g.status === 'ACTIVE' ? 'Pause' : 'Activate'}>
                              {g.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-1" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {paginate(filteredGroups, page, PAGE_SIZE).map((g: any) => {
                const mgr = g.memberships?.find((m: any) => m.role === 'MANAGER');
                const memberCount = g.memberships?.filter((m: any) => m.role === 'MEMBER').length || 0;
                return (
                  <Link key={g.id} href={`/admin/groups/${g.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">{g.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{g.name}</p>
                          <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0',
                            g.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          )}>{g.status}</span>
                        </div>
                        <p className="text-xs text-gray-400">{mgr ? mgr.user.name : 'No manager'} · {memberCount} members</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </Link>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-50">
              <Pagination currentPage={page} totalItems={filteredGroups.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Create Group Modal (2-Step) */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); resetCreateForm(); }} title={createStep === 1 ? 'Create Group — Details' : 'Create Group — Assign Manager'}>
        {createStep === 1 ? (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Group Name <span className="text-red-500">*</span></label><input value={cName} onChange={(e) => setCName(e.target.value)} className={inputCls} placeholder="e.g. Bro Fund 2026" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input value={cDesc} onChange={(e) => setCDesc(e.target.value)} className={inputCls} placeholder="What's this fund for?" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly (৳)</label><input type="number" value={cMonthly} onChange={(e) => setCMonthly(Number(e.target.value))} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Fine (৳)</label><input type="number" value={cFine} onChange={(e) => setCFine(Number(e.target.value))} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label><input type="number" min={1} max={28} value={cDeadline} onChange={(e) => setCDeadline(Number(e.target.value))} className={inputCls} /></div>
            </div>
            <button onClick={onCreateNext} className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90">Next — Assign Manager →</button>
          </div>
        ) : (
          <div className="space-y-4">
            {!showExistingManagers ? (
              <>
                <p className="text-sm text-gray-500">Create a new manager for <strong>{cName}</strong></p>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label><input value={mgrName} onChange={(e) => setMgrName(e.target.value)} className={inputCls} placeholder="Full name" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label><div className="relative"><input value={mgrEmail} onChange={(e) => setMgrEmail(e.target.value)} className={cn(inputCls, 'pl-10')} placeholder="manager@example.com" type="email" /><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label><input value={mgrPhone} onChange={(e) => setMgrPhone(e.target.value)} className={inputCls} placeholder="+880 1XXX XXXXXX" /></div>
                <button onClick={() => setShowExistingManagers(true)} className="w-full text-xs text-gray-500 hover:text-brand-primary py-2 text-center">Or select from existing users →</button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Select a manager for <strong>{cName}</strong></p><button onClick={() => { setShowExistingManagers(false); setSelectedMgrId(''); }} className="text-xs text-brand-primary hover:underline">← Create new</button></div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {users.map((u: any) => (
                    <button key={u.id} type="button" onClick={() => setSelectedMgrId(u.id)} className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors', selectedMgrId === u.id ? 'bg-brand-primary/10 border border-brand-primary/30' : 'hover:bg-gray-50 border border-transparent')}>
                      <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold shrink-0">{u.name.charAt(0)}</div>
                      <div className="min-w-0"><p className="text-sm text-gray-900 truncate">{u.name}</p><p className="text-xs text-gray-400 truncate">{u.email}</p></div>
                      {selectedMgrId === u.id && <span className="ml-auto text-brand-primary text-xs font-medium">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button onClick={() => setCreateStep(1)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">← Back</button>
              <button onClick={onCreateGroup} disabled={creatingGroup} className="flex-1 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50">{creatingGroup ? 'Creating...' : 'Create Group'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Group Modal */}
      <Modal isOpen={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Group">
        {showEdit && (
          <form onSubmit={onEditGroup} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input name="name" defaultValue={showEdit.name} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input name="description" defaultValue={showEdit.description || ''} className={inputCls} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly</label><input name="monthlyAmount" type="number" defaultValue={showEdit.monthlyAmount} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Fine</label><input name="fineAmount" type="number" defaultValue={showEdit.fineAmount} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label><input name="fineDeadlineDay" type="number" min={1} max={28} defaultValue={showEdit.fineDeadlineDay} className={inputCls} /></div>
            </div>
            <button type="submit" className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90">Save Changes</button>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}
