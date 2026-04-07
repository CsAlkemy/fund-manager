import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { UserPlus, UserMinus, Mail, Users as UsersIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

const PAGE_SIZE = 10;

export default function MembersPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Search
  const [search, setSearch] = useState('');

  // Add member modal
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  // Remove confirm modal
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

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
    if (!addEmail.trim()) { toast.error(t('members.addNote')); return; }
    setAdding(true);
    try {
      await api.post(`/groups/${groupId}/members`, { email: addEmail });
      toast.success(t('members.added'));
      setShowAdd(false);
      setAddEmail('');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || t('common.failed')); }
    finally { setAdding(false); }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/groups/${groupId}/members/${removeTarget.id}`);
      toast.success(t('members.removed'));
      setRemoveTarget(null);
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || t('common.failed')); }
    finally { setRemoving(false); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('members.title')}</h1>
          <p className="text-sm text-gray-500">{group?.name} · {t('dashboard.mgr.members', { count: members.length })}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 flex items-center gap-2 w-full sm:w-auto justify-center">
          <UserPlus className="w-4 h-4" /> {t('members.addMember').replace('+ ', '')}
        </button>
      </div>

      {/* Manager Card */}
      {manager && (
        <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 mb-4 flex items-center gap-3">
          <Avatar src={manager.user.avatarUrl} name={manager.user.name} size="md" className="bg-purple-600" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">{manager.user.name}</p>
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-200 text-purple-700">{t('status.manager')}</span>
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
          placeholder={t('members.searchMembers')}
          className="sm:w-64 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
        />
      </div>

      {/* Members List */}
      <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">{members.length === 0 ? t('members.noMembers') : t('members.noMatch')}</p>
            {members.length === 0 && <p className="text-sm text-gray-400 mt-0.5">{t('members.addByEmail')}</p>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.member')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.email')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.phone')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.bkash')}</th>
                    {/* <th className="px-5 py-3 text-right font-medium text-gray-500">{t('table.actions')}</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginate(filtered, page, PAGE_SIZE).map((m: any) => (
                    <tr key={m.user.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={m.user.avatarUrl} name={m.user.name} size="sm" />
                          <span className="font-medium text-gray-900">{m.user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{m.user.email}</td>
                      <td className="px-5 py-3 text-gray-500">{m.user.phone || <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-3 text-gray-500">{m.user.bkashNumber || <span className="text-gray-300">—</span>}</td>
                      {/* <td className="px-5 py-3 text-right">
                        <button onClick={() => setRemoveTarget({ id: m.user.id, name: m.user.name })} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500" title={t('common.remove')}>
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </td> */}
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
                    <Avatar src={m.user.avatarUrl} name={m.user.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                    </div>
                  </div>
                  {/* <button onClick={() => setRemoveTarget({ id: m.user.id, name: m.user.name })} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 shrink-0">
                    <UserMinus className="w-4 h-4" />
                  </button> */}
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
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setAddEmail(''); }} title={t('members.addTitle')}>
        <p className="text-sm text-gray-500 mb-4">{t('members.addNote')}</p>
        <div className="relative mb-4">
          <input
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            type="email"
            placeholder={t('members.emailPlaceholder')}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary pl-10"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button onClick={handleAddMember} disabled={adding} className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50">
          {adding ? t('members.adding') : t('members.addTitle')}
        </button>
      </Modal>

      {/* Remove Member Confirm */}
      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title={t('members.removeTitle')}
        message={t('members.removeConfirm', { name: removeTarget?.name || '' })}
        confirmLabel={t('common.remove')}
        variant="danger"
        loading={removing}
      />
    </DashboardLayout>
  );
}
