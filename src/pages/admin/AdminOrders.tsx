import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate, formatDateTime, cn } from '../../lib/utils';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../../lib/constants';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  Truck,
  CheckCircle,
  MapPin,
  Phone,
  CreditCard,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import type { Order, OrderItem } from '../../types';

const ORDERS_PER_PAGE = 10;

const ORDER_PROGRESS: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered'];

const PROGRESS_ICONS: Record<string, typeof Package> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function AdminOrders() {
  useDocumentTitle('Orders — Admin');

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingTracking, setEditingTracking] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const { showToast } = useToast();

  // Stats — fetched once (unfiltered)
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('status')
      .order('created_at', { ascending: false });
    setAllOrders((data as Order[]) || []);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = { total: allOrders.length };
    for (const o of allOrders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [allOrders]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const from = page * ORDERS_PER_PAGE;
    const to = from + ORDERS_PER_PAGE - 1;

    let query = supabase
      .from('orders')
      .select('*, profile:profiles(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);
    if (paymentFilter) query = query.eq('payment_status', paymentFilter);
    if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);

    query = query.range(from, to);

    const { data, count } = await query;
    setOrders((data as Order[]) || []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [statusFilter, paymentFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, paymentFilter, dateFrom, dateTo, searchQuery]);

  // Client-side search (on current page results)
  const displayedOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      const idMatch = order.id.slice(0, 8).toLowerCase().includes(q);
      const name = (order.profile as { full_name: string } | undefined)?.full_name || '';
      const nameMatch = name.toLowerCase().includes(q);
      return idMatch || nameMatch;
    });
  }, [orders, searchQuery]);

  const totalPages = Math.ceil(totalCount / ORDERS_PER_PAGE);

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setEditingTracking(false);
    setTrackingInput(order.tracking_number || '');
    const { data } = await supabase
      .from('order_items')
      .select('*, product:products(name, images)')
      .eq('order_id', order.id);
    setOrderItems((data as OrderItem[]) || []);
    setDetailOpen(true);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    showToast('Order status updated', 'success');
    fetchOrders();
    fetchStats();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: status as Order['status'] });
    }
  };

  const saveTracking = async () => {
    if (!selectedOrder) return;
    await supabase
      .from('orders')
      .update({ tracking_number: trackingInput })
      .eq('id', selectedOrder.id);
    setSelectedOrder({ ...selectedOrder, tracking_number: trackingInput });
    setEditingTracking(false);
    showToast('Tracking number updated', 'success');
    fetchOrders();
  };

  const exportCSV = () => {
    const rows = [['Order ID', 'Customer', 'Date', 'Status', 'Payment Status', 'Total']];
    for (const o of displayedOrders) {
      const name = (o.profile as { full_name: string } | undefined)?.full_name || 'Unknown';
      rows.push([
        o.id.slice(0, 8).toUpperCase(),
        name,
        formatDate(o.created_at),
        ORDER_STATUSES[o.status]?.label || o.status,
        PAYMENT_STATUSES[o.payment_status]?.label || o.payment_status,
        o.total_amount.toFixed(2),
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: 'Total Orders', value: stats.total || 0, color: 'bg-surface-100 text-surface-800' },
    { label: 'Pending', value: stats.pending || 0, color: 'bg-amber-100 text-amber-800' },
    { label: 'Processing', value: stats.processing || 0, color: 'bg-blue-100 text-blue-800' },
    { label: 'Shipped', value: stats.shipped || 0, color: 'bg-cyan-100 text-cyan-800' },
    { label: 'Delivered', value: stats.delivered || 0, color: 'bg-green-100 text-green-800' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Orders</h1>
          <p className="text-surface-500 text-sm">{totalCount} orders total</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-900 text-white rounded-xl text-sm font-medium hover:bg-surface-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-surface-100 p-4 text-center"
          >
            <p className="text-2xl font-bold text-surface-900">{s.value}</p>
            <span className={cn('badge text-xs mt-1 inline-block', s.color)}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-surface-100 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by order ID or customer name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 text-sm w-full"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field text-sm"
              placeholder="From"
            />
            <span className="text-surface-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Order status filter */}
          <span className="text-xs font-semibold text-surface-500 uppercase mr-1">Status:</span>
          <button
            onClick={() => setStatusFilter('')}
            className={cn(
              'badge cursor-pointer transition-colors',
              !statusFilter ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            )}
          >
            All
          </button>
          {Object.entries(ORDER_STATUSES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'badge cursor-pointer transition-colors',
                statusFilter === key ? val.color : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              )}
            >
              {val.label}
            </button>
          ))}

          <span className="mx-2 h-5 border-l border-surface-200" />

          {/* Payment status filter */}
          <span className="text-xs font-semibold text-surface-500 uppercase mr-1">Payment:</span>
          <button
            onClick={() => setPaymentFilter('')}
            className={cn(
              'badge cursor-pointer transition-colors',
              !paymentFilter ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            )}
          >
            All
          </button>
          {Object.entries(PAYMENT_STATUSES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setPaymentFilter(key)}
              className={cn(
                'badge cursor-pointer transition-colors',
                paymentFilter === key ? val.color : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              )}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Order</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Payment</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : displayedOrders.length > 0 ? (
                displayedOrders.map((order) => {
                  const statusInfo = ORDER_STATUSES[order.status];
                  const paymentInfo = PAYMENT_STATUSES[order.payment_status];
                  return (
                    <tr
                      key={order.id}
                      onClick={() => viewOrder(order)}
                      className="hover:bg-surface-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-mono font-medium text-surface-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-700">
                        {(order.profile as { full_name: string } | undefined)?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-500" title={formatDateTime(order.created_at)}>
                        {timeAgo(order.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('badge', statusInfo.color)}>{statusInfo.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('badge', paymentInfo?.color)}>{paymentInfo?.label || order.payment_status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-surface-900 text-right">
                        {formatPrice(order.total_amount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-surface-400 text-sm">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Showing {page * ORDERS_PER_PAGE + 1}–{Math.min((page + 1) * ORDERS_PER_PAGE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-surface-700">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Order #${selectedOrder?.id.slice(0, 8).toUpperCase()}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Progress Bar */}
            {selectedOrder.status !== 'cancelled' && (
              <div className="flex items-center justify-between">
                {ORDER_PROGRESS.map((step, i) => {
                  const stepIdx = ORDER_PROGRESS.indexOf(selectedOrder.status as typeof step);
                  const isActive = i <= stepIdx;
                  const isCurrent = i === stepIdx;
                  const Icon = PROGRESS_ICONS[step];
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center relative">
                      {i > 0 && (
                        <div
                          className={cn(
                            'absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2',
                            i <= stepIdx ? 'bg-green-500' : 'bg-surface-200'
                          )}
                        />
                      )}
                      <div
                        className={cn(
                          'relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                          isCurrent
                            ? 'bg-green-500 text-white ring-4 ring-green-100'
                            : isActive
                              ? 'bg-green-500 text-white'
                              : 'bg-surface-200 text-surface-400'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={cn(
                          'text-xs mt-1.5 font-medium',
                          isActive ? 'text-green-700' : 'text-surface-400'
                        )}
                      >
                        {ORDER_STATUSES[step].label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedOrder.status === 'cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <span className="badge bg-red-100 text-red-800">Cancelled</span>
              </div>
            )}

            {/* Status & Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-surface-500 uppercase mb-1 block">
                  Order Status
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  className="input-field w-full text-sm py-2"
                >
                  {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-500 uppercase mb-1 block">
                  Payment Status
                </label>
                <div className="flex items-center gap-2 h-[38px]">
                  <CreditCard className="w-4 h-4 text-surface-400" />
                  <span
                    className={cn(
                      'badge',
                      PAYMENT_STATUSES[selectedOrder.payment_status]?.color
                    )}
                  >
                    {PAYMENT_STATUSES[selectedOrder.payment_status]?.label || selectedOrder.payment_status}
                  </span>
                  {selectedOrder.payment_method && (
                    <span className="text-xs text-surface-500">
                      via {selectedOrder.payment_method}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tracking Number */}
            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase mb-1 block">
                Tracking Number
              </label>
              {editingTracking ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter tracking number…"
                    className="input-field text-sm flex-1 py-2"
                    autoFocus
                  />
                  <button
                    onClick={saveTracking}
                    className="p-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTracking(false);
                      setTrackingInput(selectedOrder.tracking_number || '');
                    }}
                    className="p-2 rounded-xl bg-surface-100 text-surface-600 hover:bg-surface-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface-700 font-mono">
                    {selectedOrder.tracking_number || '—'}
                  </span>
                  <button
                    onClick={() => {
                      setTrackingInput(selectedOrder.tracking_number || '');
                      setEditingTracking(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase mb-2">
                Shipping Address
              </h4>
              <div className="bg-surface-50 rounded-xl p-3 text-sm text-surface-900 space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-surface-400 shrink-0" />
                  <span>
                    {selectedOrder.shipping_address?.full_name}
                    <br />
                    {selectedOrder.shipping_address?.address}
                    <br />
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.country}
                  </span>
                </div>
                {selectedOrder.shipping_address?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-surface-400 shrink-0" />
                    <span>{selectedOrder.shipping_address.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            {selectedOrder.notes && (
              <div>
                <h4 className="text-xs font-semibold text-surface-500 uppercase mb-2">Notes</h4>
                <p className="text-sm text-surface-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* Items */}
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase mb-2">
                Items ({orderItems.length})
              </h4>
              <div className="space-y-3">
                {orderItems.map((item) => {
                  const prod = item.product as { name: string; images: string[] } | undefined;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={prod?.images?.[0] || ''}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-surface-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">
                          {prod?.name}
                        </p>
                        <p className="text-xs text-surface-500">
                          Qty: {item.quantity} × {formatPrice(item.unit_price)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice(item.total_price)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-surface-100 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-surface-400 flex items-center justify-between">
              <span>Created: {formatDateTime(selectedOrder.created_at)}</span>
              {selectedOrder.updated_at && (
                <span>Updated: {formatDateTime(selectedOrder.updated_at)}</span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
