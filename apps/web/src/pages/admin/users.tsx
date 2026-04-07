import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { useRouter } from 'next/router';

export default function AdminUsersPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) { router.replace('/dashboard'); return; }
    api.get('/admin/users')
      .then((res) => { setUsers(res.data.users); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [isSuperAdmin, authLoading, router]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
        <p className="text-sm text-gray-500">{total} registered users</p>
      </div>

      <div className="rounded-xl bg-white p-6 border border-gray-100">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left font-medium text-gray-500">Name</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Email</th>
                  <th className="pb-3 text-left font-medium text-gray-500">System Role</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Groups</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-500">{u.email}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.systemRole === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.systemRole}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {u.memberships.length === 0 ? (
                        <span className="text-gray-400">None</span>
                      ) : (
                        u.memberships.map((m: any) => (
                          <span key={m.group.id} className="inline-block mr-1 mb-1 rounded bg-gray-100 px-2 py-0.5 text-xs">
                            {m.group.name} ({m.role})
                          </span>
                        ))
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
