import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate, cn } from '../../lib/utils';
import { ORDER_STATUSES } from '../../lib/constants';
import { AnimatedSection } from '../../components/ui/AnimatedSection';
import type { Order, Product } from '../../types';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const [ordersRes, productsRes, customersRes, recentRes, lowStockRes] = await Promise.all([
        supabase.from('orders').select('total_amount'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('*').lt('stock_quantity', 10).order('stock_quantity', { ascending: true }).limit(5),
      ]);

      const revenue = (ordersRes.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0);

      setStats({
        totalRevenue: revenue,
        totalOrders: ordersRes.data?.length || 0,
        totalProducts: productsRes.count || 0,
        totalCustomers: customersRes.count || 0,
      });
      setRecentOrders((recentRes.data as Order[]) || []);
      setLowStock((lowStockRes.data as Product[]) || []);
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'bg-green-50 text-green-600', trend: '+12.5%' },
    { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingCart, color: 'bg-blue-50 text-blue-600', trend: '+8.2%' },
    { label: 'Products', value: stats.totalProducts.toString(), icon: Package, color: 'bg-amber-50 text-amber-600', trend: '+3' },
    { label: 'Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'bg-teal-50 text-teal-600', trend: '+24' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-500 text-sm">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <AnimatedSection key={card.label} animation="fade-in-up" delay={`stagger-${i + 1}`}>
            <div className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', card.color)}>
                  <card.icon className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {card.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-surface-900">{card.value}</p>
              <p className="text-sm text-surface-500">{card.label}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {recentOrders.map((order) => {
                    const statusInfo = ORDER_STATUSES[order.status];
                    return (
                      <tr key={order.id} className="hover:bg-surface-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono font-medium text-surface-900">
                          #{order.id.slice(0, 8).toUpperCase()}
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
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-surface-400 text-sm">No orders yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-surface-900">Low Stock</h2>
            </div>
            <div className="divide-y divide-surface-100">
              {lowStock.map((product) => (
                <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-surface-900 truncate">{product.name}</p>
                    <p className="text-xs text-surface-500">{formatPrice(product.price)}</p>
                  </div>
                  <span className={cn(
                    'badge flex-shrink-0',
                    product.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  )}>
                    {product.stock_quantity} left
                  </span>
                </div>
              ))}
              {lowStock.length === 0 && (
                <p className="px-6 py-8 text-center text-surface-400 text-sm">All products well stocked</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
