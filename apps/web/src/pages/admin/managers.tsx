import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Shield, Users as UsersIcon } from 'lucide-react';

const PAGE_SIZE = 10;

export default function AdminManagersPage() {
  const { t } = useTranslation();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, roleFilter, sortBy]);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) { router.replace('/dashboard'); return; }
    api.get('/admin/users').then((r) => setUsers(r.data.users)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, authLoading]);

  // Derive role for each user
  const usersWithRole = users.map((u: any) => {
    const isAdmin = u.systemRole === 'SUPER_ADMIN';
    const managerOf = u.memberships?.find((m: any) => m.role === 'MANAGER');
    const memberOf = u.memberships?.find((m: any) => m.role === 'MEMBER');
    const role = isAdmin ? 'SUPER_ADMIN' : managerOf ? 'MANAGER' : memberOf ? 'MEMBER' : 'NO_GROUP';
    const groupName = managerOf?.group?.name || memberOf?.group?.name || null;
    return { ...u, derivedRole: role, groupName };
  });

  // Filter
  const filtered = usersWithRole.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.groupName?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.derivedRole === roleFilter;
    return matchSearch && matchRole;
  });

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name-az': return a.name.localeCompare(b.name);
      case 'name-za': return b.name.localeCompare(a.name);
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const selectCls = "rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-brand-primary bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M5%206L0%200h10z%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat";

  const roleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-700';
      case 'MANAGER': return 'bg-purple-100 text-purple-700';
      case 'MEMBER': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return t('role.admin');
      case 'MANAGER': return t('role.manager');
      case 'MEMBER': return t('role.member');
      default: return t('role.noGroup');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.users')}</h1>
          <p className="text-sm text-gray-500">{t('admin.usersCount', { count: users.length })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 mb-4 sm:justify-end">
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectCls}>
          <option value="">{t('filter.allRoles')}</option>
          <option value="SUPER_ADMIN">{t('role.admin')}</option>
          <option value="MANAGER">{t('role.manager')}</option>
          <option value="MEMBER">{t('role.member')}</option>
          <option value="NO_GROUP">{t('role.noGroup')}</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
          <option value="newest">{t('filter.newest')}</option>
          <option value="oldest">{t('filter.oldest')}</option>
          <option value="name-az">{t('filter.nameAZ')}</option>
          <option value="name-za">{t('filter.nameZA')}</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('filter.searchNameEmail')}
          className="sm:w-64 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
        />
        {(search || roleFilter || sortBy !== 'newest') && (
          <button onClick={() => { setSearch(''); setRoleFilter(''); setSortBy('newest'); }} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">
            {t('common.clear')}
          </button>
        )}
      </div>

      {/* User List */}
      <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <p className="text-gray-400 p-6 text-center">{t('common.noUsersMatch')}</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.user')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.email')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.role')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.group')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginate(filtered, page, PAGE_SIZE).map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                            u.derivedRole === 'SUPER_ADMIN' ? 'bg-red-100 text-red-600' :
                            u.derivedRole === 'MANAGER' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          )}>{u.name.charAt(0)}</div>
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', roleBadge(u.derivedRole))}>
                          {roleLabel(u.derivedRole)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{u.groupName || <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {paginate(filtered, page, PAGE_SIZE).map((u) => (
                <div key={u.id} className="p-4 flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    u.derivedRole === 'SUPER_ADMIN' ? 'bg-red-100 text-red-600' :
                    u.derivedRole === 'MANAGER' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  )}>{u.name.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0', roleBadge(u.derivedRole))}>
                        {roleLabel(u.derivedRole)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    {u.groupName && <p className="text-xs text-gray-400 mt-0.5">{t('groups.groupPrefix', { name: u.groupName })}</p>}
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
    </DashboardLayout>
  );
}
