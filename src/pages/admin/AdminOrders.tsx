import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate, cn } from '../../lib/utils';
import { ORDER_STATUSES } from '../../lib/constants';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import type { Order, OrderItem } from '../../types';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const { showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*, profile:profiles(full_name)').order('created_at', { ascending: false });
    if (filter) query = query.eq('status', filter);
    const { data } = await query;
    setOrders((data as Order[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase
      .from('order_items')
      .select('*, product:products(name, images)')
      .eq('order_id', order.id);
    setOrderItems((data as OrderItem[]) || []);
    setDetailOpen(true);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    showToast('Order status updated');
    fetchOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: status as Order['status'] });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Orders</h1>
          <p className="text-surface-500 text-sm">{orders.length} orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('')}
            className={cn('badge cursor-pointer', !filter ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200')}
          >
            All
          </button>
          {Object.entries(ORDER_STATUSES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn('badge cursor-pointer transition-colors', filter === key ? val.color : 'bg-surface-100 text-surface-600 hover:bg-surface-200')}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Order</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : orders.map((order) => {
                const statusInfo = ORDER_STATUSES[order.status];
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
                    <td className="px-6 py-4 text-sm text-surface-500">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={cn('badge', statusInfo.color)}>{statusInfo.label}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-surface-900 text-right">
                      {formatPrice(order.total_amount)}
                    </td>
                  </tr>
                );
              })}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-surface-400 text-sm">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`Order #${selectedOrder?.id.slice(0, 8).toUpperCase()}`} size="lg">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-surface-500">Status:</span>
              <select
                value={selectedOrder.status}
                onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                className="input-field w-auto text-sm py-2"
              >
                {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div>
              <h4 className="text-sm font-medium text-surface-500 mb-2">Shipping Address</h4>
              <p className="text-sm text-surface-900">
                {(selectedOrder.shipping_address as { full_name?: string })?.full_name}<br />
                {(selectedOrder.shipping_address as { address?: string })?.address}<br />
                {(selectedOrder.shipping_address as { city?: string })?.city}, {(selectedOrder.shipping_address as { country?: string })?.country}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-surface-500 mb-2">Items</h4>
              <div className="space-y-3">
                {orderItems.map((item) => {
                  const prod = item.product as { name: string; images: string[] } | undefined;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={prod?.images?.[0] || ''} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{prod?.name}</p>
                        <p className="text-xs text-surface-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice(item.total_price)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-surface-100 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(selectedOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
