import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';
import {
  ArrowLeft, Pencil, Pause, Play, ArrowRightLeft, Users,
  Wallet, AlertTriangle, Calendar, Mail, Shield,
} from 'lucide-react';

export default function AdminGroupDetailPage() {
  const { t, locale } = useTranslation();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { groupId } = router.query;

  const [group, setGroup] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEdit, setShowEdit] = useState(false);
  const [showSwitchManager, setShowSwitchManager] = useState(false);

  const loadData = async () => {
    if (!groupId) return;
    try {
      const [g, s, u] = await Promise.all([
        api.get(`/admin/groups`).then((r) => r.data.find((grp: any) => grp.id === groupId)),
        api.get(`/groups/${groupId}/summary`).catch(() => ({ data: { totalCollected: 0, totalContributions: 0, totalFines: 0, memberCount: 0 } })),
        api.get('/admin/users'),
      ]);
      setGroup(g);
      setSummary(s.data || s);
      setAllUsers(u.data.users);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) { router.replace('/dashboard'); return; }
    if (groupId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, authLoading, groupId]);

  const onToggleStatus = async () => {
    if (!group) return;
    const newStatus = group.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.patch(`/admin/groups/${groupId}/status`, { status: newStatus });
      toast.success(newStatus === 'PAUSED' ? t('admin.groupPausedMsg') : t('admin.groupActivatedMsg'));
      setGroup((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: any) { toast.error(err.response?.data?.message || t('common.failedGeneric')); }
  };

  const onSwitchManager = async (managerId: string) => {
    try {
      await api.patch(`/admin/groups/${groupId}/manager`, { managerId });
      toast.success(t('admin.managerUpdated'));
      setShowSwitchManager(false);
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || t('common.failedGeneric')); }
  };

  const onEditGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.patch(`/admin/groups/${groupId}`, {
        name: fd.get('name'), description: fd.get('description'),
        monthlyAmount: Number(fd.get('monthlyAmount')), fineAmount: Number(fd.get('fineAmount')), fineDeadlineDay: Number(fd.get('fineDeadlineDay')),
      });
      toast.success(t('admin.updated'));
      setShowEdit(false);
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || t('common.failedGeneric')); }
  };

  const inputCls = "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary";

  if (loading) return <DashboardLayout><p className="text-gray-400">{t('common.loading')}</p></DashboardLayout>;
  if (!group) return <DashboardLayout><p className="text-gray-500">{t('common.groupNotFound')}</p></DashboardLayout>;

  const mgr = group.memberships?.find((m: any) => m.role === 'MANAGER');
  const members = group.memberships?.filter((m: any) => m.role === 'MEMBER') || [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/groups" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> {t('admin.backToGroups')}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-lg font-bold">
              {group.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                  group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                )}>{group.status}</span>
              </div>
              {group.description && <p className="text-sm text-gray-500">{group.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEdit(true)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> {t('common.edit')}
            </button>
            <button onClick={onToggleStatus} className={cn('rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1.5',
              group.status === 'ACTIVE' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
            )}>
              {group.status === 'ACTIVE' ? <><Pause className="w-3.5 h-3.5" /> {t('admin.pause')}</> : <><Play className="w-3.5 h-3.5" /> {t('admin.activate')}</>}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t('dashboard.admin.fundCollected')} value={`৳${(summary?.totalCollected || 0).toLocaleString(locale)}`} color="green" icon={Wallet} />
        <StatCard title={t('groups.contributionsLabel')} value={`৳${(summary?.totalContributions || 0).toLocaleString(locale)}`} color="blue" icon={Calendar} />
        <StatCard title={t('dashboard.mgr.fines')} value={`৳${(summary?.totalFines || 0).toLocaleString(locale)}`} color="red" icon={AlertTriangle} />
        <StatCard title={t('members.title')} value={String(summary?.memberCount || 0)} color="purple" icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Config + Manager */}
        <div className="space-y-6">
          {/* Group Config */}
          <div className="rounded-xl bg-white border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" /> {t('admin.groupConfig')}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">{t('admin.monthlyAmount')}</span>
                <span className="text-sm font-medium text-gray-900">৳{group.monthlyAmount}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">{t('admin.fineAmount')}</span>
                <span className="text-sm font-medium text-gray-900">৳{group.fineAmount}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">{t('admin.fineDeadline')}</span>
                <span className="text-sm font-medium text-gray-900">{t('admin.dayOfMonth', { day: group.fineDeadlineDay })}</span>
              </div>
            </div>
          </div>

          {/* Manager */}
          <div className="rounded-xl bg-white border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" /> {t('table.manager')}
              </h2>
              <button onClick={() => setShowSwitchManager(true)} className="text-xs text-brand-primary hover:underline flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" /> {t('admin.switchManager')}
              </button>
            </div>
            {mgr ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm font-bold">{mgr.user.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{mgr.user.name}</p>
                  <p className="text-xs text-gray-500">{mgr.user.email}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                <p className="text-sm text-orange-600">{t('admin.noManagerAssigned')}</p>
                <button onClick={() => setShowSwitchManager(true)} className="text-xs text-orange-700 hover:underline mt-1">{t('admin.assignNow')}</button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Members */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" /> {t('members.title')} ({members.length})
            </h2>
            {members.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">{t('admin.noMembersYet')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('admin.managerWillAdd')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {members.map((m: any) => (
                  <div key={m.user.id} className="flex items-center gap-3 py-3">
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">{m.user.name.charAt(0)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                      <p className="text-xs text-gray-400">{m.user.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{t('status.member')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Switch Manager Modal — only group members */}
      <Modal isOpen={showSwitchManager} onClose={() => setShowSwitchManager(false)} title={t('admin.switchTitle')}>
        <p className="text-sm text-gray-500 mb-4">{t('admin.promoteNote', { name: group.name })}</p>
        {group.memberships?.length <= 1 ? (
          <p className="text-sm text-gray-400 py-4 text-center">{t('admin.noOtherMembers')}</p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {group.memberships?.map((m: any) => {
              const isCurrent = m.role === 'MANAGER';
              return (
                <button key={m.user.id} onClick={() => !isCurrent && onSwitchManager(m.user.id)}
                  className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors',
                    isCurrent ? 'bg-purple-50 border border-purple-200 cursor-default' : 'hover:bg-gray-50 border border-transparent'
                  )}>
                  <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    isCurrent ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-600'
                  )}>{m.user.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">{m.user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                  </div>
                  {isCurrent && <span className="ml-auto text-purple-600 text-[10px] font-medium">{t('admin.currentManager')}</span>}
                  {!isCurrent && <span className="ml-auto text-xs text-gray-400">{t('status.member')}</span>}
                </button>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Edit Group Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title={t('admin.editGroup')}>
        <form onSubmit={onEditGroup} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.nameLabel')}</label><input name="name" defaultValue={group.name} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.descriptionLabel')}</label><input name="description" defaultValue={group.description || ''} className={inputCls} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.monthlyLabel')}</label><input name="monthlyAmount" type="number" defaultValue={group.monthlyAmount} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.fineLabel')}</label><input name="fineAmount" type="number" defaultValue={group.fineAmount} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.deadlineLabel')}</label><input name="fineDeadlineDay" type="number" min={1} max={28} defaultValue={group.fineDeadlineDay} className={inputCls} /></div>
          </div>
          <button type="submit" className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90">{t('common.save')}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
