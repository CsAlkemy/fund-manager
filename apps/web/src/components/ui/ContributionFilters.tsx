interface ContributionFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  methodFilter: string;
  onMethodChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  monthFilter?: string;
  onMonthChange?: (val: string) => void;
  months?: string[];
  showMemberSearch?: boolean;
  hideStatus?: boolean;
}

export function ContributionFilters({
  search, onSearchChange,
  statusFilter, onStatusChange,
  methodFilter, onMethodChange,
  sortBy, onSortChange,
  monthFilter = '', onMonthChange,
  months = [],
  showMemberSearch = false,
  hideStatus = false,
}: ContributionFiltersProps) {
  return (
    <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-end">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={showMemberSearch ? 'Search member or TxID...' : 'Search by TxID...'}
        className="w-full md:w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
      />
      <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
        {onMonthChange && months.length > 0 && (
          <select
            value={monthFilter}
            onChange={(e) => onMonthChange(e.target.value)}
            className="rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-brand-primary bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M5%206L0%200h10z%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat"
          >
            <option value="">All Months</option>
            {months.map((m) => {
              const [mo, yr] = m.split('-');
              return <option key={m} value={m}>{new Date(0, Number(mo) - 1).toLocaleString('en', { month: 'short' })} {yr}</option>;
            })}
          </select>
        )}
        {!hideStatus && (
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-brand-primary bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M5%206L0%200h10z%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat"
          >
            <option value="">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        )}
        <select
          value={methodFilter}
          onChange={(e) => onMethodChange(e.target.value)}
          className="rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-brand-primary bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M5%206L0%200h10z%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat"
        >
          <option value="">All Methods</option>
          <option value="BKASH">bKash</option>
          <option value="BANK">Bank</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-brand-primary bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M5%206L0%200h10z%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="amount-high">Amount ↓</option>
          <option value="amount-low">Amount ↑</option>
        </select>
      </div>
    </div>
  );
}

export function filterAndSort(contributions: any[], search: string, statusFilter: string, methodFilter: string, sortBy: string, showMemberSearch = false, monthFilter = '') {
  let filtered = [...contributions];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((c) =>
      c.transactionId?.toLowerCase().includes(q) ||
      (showMemberSearch && c.user?.name?.toLowerCase().includes(q))
    );
  }
  if (statusFilter) filtered = filtered.filter((c) => c.status === statusFilter);
  if (methodFilter) filtered = filtered.filter((c) => c.paymentMethod === methodFilter);
  if (monthFilter) {
    const [mo, yr] = monthFilter.split('-');
    filtered = filtered.filter((c) => c.month === Number(mo) && c.year === Number(yr));
  }

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'oldest': return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      case 'amount-high': return b.amount - a.amount;
      case 'amount-low': return a.amount - b.amount;
      default: return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
  });

  return filtered;
}
