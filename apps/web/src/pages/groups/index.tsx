import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

export default function GroupsListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/groups')
      .then((res) => setGroups(res.data))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('groups.myGroups')}</h1>
        <div className="flex gap-2">
          <Link href="/join" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {t('groups.joinGroup')}
          </Link>
          <Link href="/groups/create" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90">
            {t('groups.createGroup')}
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">{t('common.loading')}</p>
      ) : groups.length === 0 ? (
        <div className="rounded-xl bg-white p-12 border border-gray-100 text-center">
          <p className="text-gray-500 mb-2">{t('groups.noGroups')}</p>
          <p className="text-sm text-gray-400">{t('groups.createOrJoin')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => {
            const myRole = g.memberships?.find((m: any) => m.user?.id === user?.id)?.role || 'MEMBER';
            return (
              <Link key={g.id} href={`/groups/${g.id}`} className="rounded-xl bg-white p-6 border border-gray-100 hover:border-brand-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{g.name}</h3>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                    myRole === 'MANAGER' ? 'bg-purple-100 text-purple-700' :
                    myRole === 'TREASURER' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{myRole}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{g.description || t('groups.fundGroupDefault')}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{t('groups.membersCount', { count: g.memberships?.length || 0 })}</span>
                  <span>৳{g.monthlyAmount}/mo</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
