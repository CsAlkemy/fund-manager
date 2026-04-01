import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function FinesPage() {
  const { user } = useAuth();
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/groups').then(async (res) => {
      const allFines = await Promise.all(
        res.data.map((g: any) =>
          api.get(`/groups/${g.id}/fines/my`).then((r) =>
            r.data.map((f: any) => ({ ...f, groupName: g.name }))
          ).catch(() => [])
        )
      );
      setFines(allFines.flat());
      setLoading(false);
    });
  }, [user]);

  const totalPending = fines.filter((f) => f.status === 'PENDING').reduce((acc, f) => acc + f.amount, 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Fines</h1>
        {totalPending > 0 && (
          <p className="text-sm text-red-500">Outstanding: ৳{totalPending.toLocaleString()}</p>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 border border-gray-100">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : fines.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-gray-500">No fines! You're up to date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left font-medium text-gray-500">Group</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Month/Year</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Status</th>
                  <th className="pb-3 text-right font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50">
                    <td className="py-3 font-medium text-gray-900">{f.groupName}</td>
                    <td className="py-3 text-gray-500">{f.month}/{f.year}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        f.status === 'WAIVED' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>{f.status}</span>
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">৳{f.amount}</td>
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
