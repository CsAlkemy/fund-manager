import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const PAGE_SIZE = 10;

const actionBadge = (action: string) => {
  if (['CREATE', 'VERIFY', 'JOIN', 'ADD_MEMBER'].includes(action)) return 'bg-green-100 text-green-700';
  if (['REJECT', 'REMOVE', 'DELETE'].includes(action)) return 'bg-red-100 text-red-700';
  if (['WAIVE', 'STATUS_CHANGE', 'AUTO_FINE'].includes(action)) return 'bg-yellow-100 text-yellow-700';
  if (['UPDATE', 'ROLE_CHANGE', 'ASSIGN_MANAGER'].includes(action)) return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
};

export default function AdminAuditPage() {
  const { t } = useTranslation();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, actionFilter, entityFilter, sortBy]);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) { router.replace('/dashboard'); return; }
    api.get('/admin/audit?limit=500')
      .then((res) => { setLogs(res.data.logs); setTotal(res.data.total); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, authLoading]);

  // Unique actions/entities for filter dropdowns
  const actions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);
  const entities = useMemo(() => [...new Set(logs.map((l) => l.entity))].sort(), [logs]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = [...logs];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.actor?.name?.toLowerCase().includes(q) ||
        l.actor?.email?.toLowerCase().includes(q) ||
        l.group?.name?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.entity?.toLowerCase().includes(q) ||
        (l.details && JSON.stringify(l.details).toLowerCase().includes(q))
      );
    }
    if (actionFilter) result = result.filter((l) => l.action === actionFilter);
    if (entityFilter) result = result.filter((l) => l.entity === entityFilter);

    result.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [logs, search, actionFilter, entityFilter, sortBy]);

  const hasFilters = search || actionFilter || entityFilter || sortBy !== 'newest';

  const selectCls = "rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-brand-primary bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M5%206L0%200h10z%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.auditLogs')}</h1>
        <p className="text-sm text-gray-500">{t('admin.eventsLogged', { count: total })}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 mb-4 sm:justify-end">
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={selectCls}>
          <option value="">{t('filter.allActions')}</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className={selectCls}>
          <option value="">{t('filter.allEntities')}</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
          <option value="newest">{t('filter.newest')}</option>
          <option value="oldest">{t('filter.oldest')}</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('filter.searchAudit')}
          className="sm:w-64 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
        />
        {hasFilters && (
          <button onClick={() => { setSearch(''); setActionFilter(''); setEntityFilter(''); setSortBy('newest'); }} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">
            {t('common.clear')}
          </button>
        )}
      </div>

      <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 p-6 text-center">{logs.length === 0 ? t('admin.noAuditEvents') : t('admin.noLogsMatch')}</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.time')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.actor')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.action')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.entity')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.group')}</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">{t('table.details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginate(filtered, page, PAGE_SIZE).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString()}<br />
                        <span className="text-gray-300">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                            {log.actor?.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-gray-900">{log.actor?.name || t('audit.unknown')}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', actionBadge(log.action))}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{log.entity}</td>
                      <td className="px-5 py-3 text-gray-500">{log.group?.name || <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-3 text-xs text-gray-400 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {paginate(filtered, page, PAGE_SIZE).map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', actionBadge(log.action))}>
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">
                      {log.actor?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{log.actor?.name || t('audit.unknown')}</span>
                    <span className="text-xs text-gray-400">{t('audit.on', { entity: log.entity })}</span>
                  </div>
                  {log.group?.name && <p className="text-xs text-gray-400">{t('groups.groupPrefix', { name: log.group.name })}</p>}
                  {log.details && <p className="text-xs text-gray-400 mt-1 truncate">{JSON.stringify(log.details)}</p>}
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
