import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, ShieldCheck, ShoppingBag, Users, UserPlus, Phone, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate, formatDateTime, formatPrice, getInitials, cn } from '../../lib/utils';
import { ORDER_STATUSES } from '../../lib/constants';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import type { Profile, Order } from '../../types';

type RoleFilter = 'all' | 'customer' | 'admin';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

const PAGE_SIZE = 15;

export default function AdminCustomers() {
  useDocumentTitle('Customers — Admin');
  const { showToast } = useToast();

  // --- List state ---
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  // --- Stats state ---
  const [stats, setStats] = useState({ total: 0, admins: 0, newThisMonth: 0, withOrders: 0 });

  // --- Detail modal state ---
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Fetch stats once on mount
  useEffect(() => {
    async function fetchStats() {
      const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: admins } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin');

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count: newThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      const { data: orderUsers } = await supabase.from('orders').select('user_id');
      const uniqueUsers = new Set((orderUsers || []).map((o) => o.user_id));

      setStats({
        total: total ?? 0,
        admins: admins ?? 0,
        newThisMonth: newThisMonth ?? 0,
        withOrders: uniqueUsers.size,
      });
    }
    fetchStats();
  }, []);

  // Fetch paginated customers
  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);

      const sortMap: Record<SortOption, { col: string; asc: boolean }> = {
        newest: { col: 'created_at', asc: false },
        oldest: { col: 'created_at', asc: true },
        name_asc: { col: 'full_name', asc: true },
        name_desc: { col: 'full_name', asc: false },
      };
      const { col, asc } = sortMap[sortOption];
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order(col, { ascending: asc })
        .range(from, to);

      if (debouncedSearch) {
        query = query.ilike('full_name', `%${debouncedSearch}%`);
      }
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, count } = await query;
      setCustomers((data as Profile[]) || []);
      setTotalCount(count ?? 0);
      setLoading(false);
    }
    fetchCustomers();
  }, [debouncedSearch, roleFilter, sortOption, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, roleFilter, sortOption]);

  // Fetch orders when a customer is selected
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerOrders([]);
      return;
    }
    async function fetchOrders() {
      setOrdersLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', selectedCustomer!.id)
        .order('created_at', { ascending: false });
      setCustomerOrders((data as Order[]) || []);
      setOrdersLoading(false);
    }
    fetchOrders();
  }, [selectedCustomer]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const totalSpent = useMemo(
    () => customerOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
    [customerOrders],
  );

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (customers.length === 0) {
      showToast('No customers to export', 'error');
      return;
    }
    const header = 'Name,Phone,City,Country,Role,Joined';
    const rows = customers.map((c) =>
      [
        `"${(c.full_name || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${(c.city || '').replace(/"/g, '""')}"`,
        `"${(c.country || '').replace(/"/g, '""')}"`,
        c.role,
        formatDate(c.created_at),
      ].join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Customers exported successfully', 'success');
  }, [customers, showToast]);

  const statCards = [
    { label: 'Total Customers', value: stats.total, icon: Users, color: 'text-brand-600 bg-brand-50' },
    { label: 'Admins', value: stats.admins, icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
    { label: 'New This Month', value: stats.newThisMonth, icon: UserPlus, color: 'text-green-600 bg-green-50' },
    { label: 'With Orders', value: stats.withOrders, icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Customers</h1>
          <p className="text-surface-500 text-sm">{totalCount} registered users</p>
        </div>
        <button onClick={handleExportCSV} className="btn-outline flex items-center gap-2 self-start">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-surface-100 p-4 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{s.value}</p>
              <p className="text-xs text-surface-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="input-field pl-12"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'customer', 'admin'] as RoleFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors capitalize',
                roleFilter === r ? 'bg-brand-600 text-white' : 'btn-ghost',
              )}
            >
              {r === 'all' ? 'All' : r === 'customer' ? 'Customers' : 'Admins'}
            </button>
          ))}
        </div>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="input-field w-auto"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Location</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-500 font-medium">No customers found</p>
                    <p className="text-surface-400 text-sm mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-surface-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-sm font-semibold text-brand-700">
                          {getInitials(c.full_name || 'U')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-900">{c.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-surface-500">{c.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500">
                      {[c.city, c.country].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'badge',
                          c.role === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-surface-100 text-surface-600',
                        )}
                      >
                        {c.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500">{formatDate(c.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-surface-700">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Profile header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-xl font-bold text-brand-700 shrink-0">
                {getInitials(selectedCustomer.full_name || 'U')}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900">
                  {selectedCustomer.full_name || 'Unnamed'}
                </h3>
                <span
                  className={cn(
                    'badge mt-1 inline-block',
                    selectedCustomer.role === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-surface-100 text-surface-600',
                  )}
                >
                  {selectedCustomer.role}
                </span>
              </div>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-surface-400 shrink-0" />
                <span className="text-surface-700">{selectedCustomer.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-surface-400 shrink-0" />
                <span className="text-surface-700">
                  {[selectedCustomer.address, selectedCustomer.city, selectedCustomer.country]
                    .filter(Boolean)
                    .join(', ') || 'No address'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-surface-400 shrink-0" />
                <span className="text-surface-700">Member since {formatDate(selectedCustomer.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShoppingBag className="w-4 h-4 text-surface-400 shrink-0" />
                <span className="text-surface-700">
                  {ordersLoading ? '...' : `${customerOrders.length} orders · ${formatPrice(totalSpent)} spent`}
                </span>
              </div>
            </div>

            {/* Orders */}
            <div>
              <h4 className="text-sm font-semibold text-surface-900 mb-3">Order History</h4>
              {ordersLoading ? (
                <div className="py-8 text-center">
                  <Spinner className="mx-auto" />
                </div>
              ) : customerOrders.length === 0 ? (
                <p className="text-sm text-surface-400 py-4 text-center">No orders yet</p>
              ) : (
                <div className="bg-surface-50/50 rounded-xl border border-surface-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-100">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-surface-500 uppercase">Order</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-surface-500 uppercase">Date</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-surface-500 uppercase">Status</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-surface-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {customerOrders.map((order) => {
                          const status = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
                          return (
                            <tr key={order.id} className="bg-white">
                              <td className="px-4 py-2 text-sm font-medium text-surface-900">
                                #{order.id.slice(0, 8)}
                              </td>
                              <td className="px-4 py-2 text-sm text-surface-500">
                                {formatDateTime(order.created_at)}
                              </td>
                              <td className="px-4 py-2">
                                <span className={cn('badge', status?.color || 'bg-surface-100 text-surface-600')}>
                                  {status?.label || order.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-surface-900 text-right">
                                {formatPrice(order.total_amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
