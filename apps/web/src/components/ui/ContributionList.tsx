import { cn } from '@/lib/cn';

interface ContributionListProps {
  contributions: any[];
  showMember?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium',
      status === 'VERIFIED' && 'bg-green-100 text-green-700',
      status === 'REJECTED' && 'bg-red-100 text-red-700',
      status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
    )}>{status}</span>
  );
}

export function ContributionList({ contributions, showMember = false }: ContributionListProps) {
  if (contributions.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">No contributions found</p>;
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {showMember && <th className="pb-3 text-left font-medium text-gray-500">Member</th>}
              <th className="pb-3 text-left font-medium text-gray-500">Month</th>
              <th className="pb-3 text-left font-medium text-gray-500">Method</th>
              <th className="pb-3 text-left font-medium text-gray-500">TxID</th>
              <th className="pb-3 text-left font-medium text-gray-500">Status</th>
              <th className="pb-3 text-right font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((c: any) => (
              <tr key={c.id} className="border-b border-gray-50">
                {showMember && <td className="py-3 font-medium text-gray-900">{c.user?.name || '—'}</td>}
                <td className="py-3 text-gray-900">
                  {new Date(0, c.month - 1).toLocaleString('en', { month: 'short' })} {c.year}
                </td>
                <td className="py-3 text-gray-500">{c.paymentMethod}</td>
                <td className="py-3 text-gray-500 font-mono text-xs">{c.transactionId}</td>
                <td className="py-3">
                  <StatusBadge status={c.status} />
                  {c.status === 'REJECTED' && c.rejectionReason && (
                    <p className="text-xs text-red-400 mt-0.5">{c.rejectionReason}</p>
                  )}
                </td>
                <td className="py-3 text-right font-medium text-gray-900">৳{c.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {contributions.map((c: any) => (
          <div key={c.id} className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                {showMember && <p className="text-sm font-medium text-gray-900">{c.user?.name}</p>}
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(0, c.month - 1).toLocaleString('en', { month: 'long' })} {c.year}
                </p>
              </div>
              <p className="text-lg font-bold text-gray-900">৳{c.amount}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{c.paymentMethod}</span>
                <StatusBadge status={c.status} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 font-mono truncate">TxID: {c.transactionId}</p>
            {c.status === 'REJECTED' && c.rejectionReason && (
              <p className="text-xs text-red-400 mt-1">Reason: {c.rejectionReason}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
