import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { UserPlus, UserMinus, Mail, Users as UsersIcon } from 'lucide-react';

const PAGE_SIZE = 10;

export default function MembersPage() {
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Search
  const [search, setSearch] = useState('');

  // Add member modal
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const groupId = user?.memberships?.find((m) => m.role === 'MANAGER')?.group.id;

  const loadData = () => {
    if (!groupId) { setLoading(false); return; }
    api.get(`/groups/${groupId}`).then((r) => setGroup(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => { setPage(1); }, [search]);

  const members = group?.memberships?.filter((m: any) => m.role === 'MEMBER') || [];
  const manager = group?.memberships?.find((m: any) => m.role === 'MANAGER');

  const filtered = members.filter((m: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.user.name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q);
  });

  const handleAddMember = async () => {
    if (!addEmail.trim()) { toast.error('Email is required'); return; }
    setAdding(true);
    try {
      await api.post(`/groups/${groupId}/members`, { email: addEmail });
      toast.success('Member added!');
      setShowAdd(false);
      setAddEmail('');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAdding(false); }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from this group?`)) return;
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      toast.success('Member removed');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500">{group?.name} · {members.length} members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 flex items-center gap-2 w-full sm:w-auto justify-center">
          <UserPlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Manager Card */}
      {manager && (
        <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 mb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm font-bold">{manager.user.name.charAt(0)}</div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">{manager.user.name}</p>
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-200 text-purple-700">MANAGER</span>
            </div>
            <p className="text-xs text-gray-500">{manager.user.email}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex justify-end mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="sm:w-64 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
        />
      </div>

      {/* Members List */}
      <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
        {loading ? <p className="text-gray-400 p-6">Loading...</p> : filtered.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">{members.length === 0 ? 'No members yet' : 'No members match your search'}</p>
            {members.length === 0 && <p className="text-sm text-gray-400 mt-0.5">Add members using their email</p>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Member</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Email</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Phone</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">bKash</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginate(filtered, page, PAGE_SIZE).map((m: any) => (
                    <tr key={m.user.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">{m.user.name.charAt(0)}</div>
                          <span className="font-medium text-gray-900">{m.user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{m.user.email}</td>
                      <td className="px-5 py-3 text-gray-500">{m.user.phone || <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-3 text-gray-500">{m.user.bkashNumber || <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleRemove(m.user.id, m.user.name)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500" title="Remove">
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-50">
              {paginate(filtered, page, PAGE_SIZE).map((m: any) => (
                <div key={m.user.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">{m.user.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(m.user.id, m.user.name)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 shrink-0">
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-50">
              <Pagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setAddEmail(''); }} title="Add Member">
        <p className="text-sm text-gray-500 mb-4">Enter the email of a registered user to add them to this group.</p>
        <div className="relative mb-4">
          <input
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            type="email"
            placeholder="member@example.com"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary pl-10"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button onClick={handleAddMember} disabled={adding} className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50">
          {adding ? 'Adding...' : 'Add Member'}
        </button>
      </Modal>
    </DashboardLayout>
  );
}
