import { useEffect, useState } from 'react';
import {
  DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown,
  AlertTriangle, Clock, UserPlus, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate, formatDateTime, cn, getInitials } from '../../lib/utils';
import { ORDER_STATUSES } from '../../lib/constants';
import { AnimatedSection } from '../../components/ui/AnimatedSection';
import { PageSpinner } from '../../components/ui/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { Order, Product, Profile } from '../../types';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  prevRevenue: number;
  prevOrders: number;
  prevProducts: number;
  prevCustomers: number;
}

interface RevenueDay {
  date: string;
  revenue: number;
}

interface StatusCount {
  status: string;
  label: string;
  count: number;
  color: string;
}

interface TopProduct {
  product_id: string;
  name: string;
  price: number;
  order_count: number;
  total_qty: number;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'customer';
  description: string;
  timestamp: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#06b6d4',
  delivered: '#16a34a',
  cancelled: '#ef4444',
};

function trendValue(current: number, previous: number): { label: string; positive: boolean } {
  if (previous === 0) return { label: current > 0 ? '+100%' : '0%', positive: current >= 0 };
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? '+' : '';
  return { label: `${sign}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function AdminDashboard() {
  useDocumentTitle('Dashboard — Admin');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0,
    prevRevenue: 0, prevOrders: 0, prevProducts: 0, prevCustomers: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueDay[]>([]);
  const [statusData, setStatusData] = useState<StatusCount[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      const now = new Date();
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        allOrdersRes,
        prevMonthOrdersRes,
        productsCountRes,
        prevProductsCountRes,
        customersCountRes,
        prevCustomersCountRes,
        recentWeekOrdersRes,
        recentOrdersRes,
        lowStockRes,
        orderItemsRes,
        recentNewCustomersRes,
        recentNewOrdersRes,
      ] = await Promise.all([
        supabase.from('orders').select('total_amount, status'),
        supabase.from('orders').select('total_amount').gte('created_at', startOfPrevMonth).lte('created_at', endOfPrevMonth),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('created_at', endOfPrevMonth),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').lte('created_at', endOfPrevMonth),
        supabase.from('orders').select('total_amount, created_at').gte('created_at', sevenDaysAgo),
        supabase.from('orders').select('*, profile:profiles(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('*').lt('stock_quantity', 10).order('stock_quantity', { ascending: true }).limit(5),
        supabase.from('order_items').select('product_id, quantity, product:products(name, price)').limit(1000),
        supabase.from('profiles').select('id, full_name, created_at').eq('role', 'customer').order('created_at', { ascending: false }).limit(10),
        supabase.from('orders').select('id, created_at, total_amount, profile:profiles(full_name)').order('created_at', { ascending: false }).limit(10),
      ]);

      // --- Stats with trends ---
      const allOrders = allOrdersRes.data || [];
      const totalRevenue = allOrders.reduce((s, o) => s + Number(o.total_amount), 0);
      const prevMonthRev = (prevMonthOrdersRes.data || []).reduce((s, o) => s + Number(o.total_amount), 0);

      setStats({
        totalRevenue,
        totalOrders: allOrders.length,
        totalProducts: productsCountRes.count || 0,
        totalCustomers: customersCountRes.count || 0,
        prevRevenue: prevMonthRev,
        prevOrders: prevMonthOrdersRes.data?.length || 0,
        prevProducts: prevProductsCountRes.count || 0,
        prevCustomers: prevCustomersCountRes.count || 0,
      });

      // --- Revenue chart (last 7 days) ---
      const days = getLast7Days();
      const revenueByDay: Record<string, number> = {};
      days.forEach((d) => (revenueByDay[d] = 0));
      (recentWeekOrdersRes.data || []).forEach((o) => {
        const day = new Date(o.created_at).toISOString().slice(0, 10);
        if (revenueByDay[day] !== undefined) {
          revenueByDay[day] += Number(o.total_amount);
        }
      });
      setRevenueData(days.map((d) => ({
        date: new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: revenueByDay[d],
      })));

      // --- Orders by status ---
      const statusMap: Record<string, number> = {};
      allOrders.forEach((o) => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      });
      const statuses: StatusCount[] = Object.entries(ORDER_STATUSES).map(([key, val]) => ({
        status: key,
        label: val.label,
        count: statusMap[key] || 0,
        color: STATUS_COLORS[key] || '#94a3b8',
      }));
      setStatusData(statuses);

      // --- Top selling products ---
      const productAgg: Record<string, { name: string; price: number; order_count: number; total_qty: number }> = {};
      const ordersByProduct: Record<string, Set<string>> = {};
      (orderItemsRes.data || []).forEach((item: { product_id: string; quantity: number; product?: { name: string; price: number } | null }) => {
        if (!item.product_id) return;
        if (!productAgg[item.product_id]) {
          const p = item.product as { name: string; price: number } | null;
          productAgg[item.product_id] = {
            name: p?.name || 'Unknown',
            price: p?.price || 0,
            order_count: 0,
            total_qty: 0,
          };
          ordersByProduct[item.product_id] = new Set();
        }
        productAgg[item.product_id].total_qty += item.quantity;
        productAgg[item.product_id].order_count += 1;
      });
      const topProds = Object.entries(productAgg)
        .map(([pid, data]) => ({ product_id: pid, ...data }))
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 5);
      setTopProducts(topProds);

      // --- Recent orders with profile ---
      setRecentOrders((recentOrdersRes.data as Order[]) || []);

      // --- Low stock ---
      setLowStock((lowStockRes.data as Product[]) || []);

      // --- Activity feed ---
      const activities: ActivityItem[] = [];
      (recentNewOrdersRes.data || []).forEach((o) => {
        const profile = o.profile as { full_name: string } | null;
        activities.push({
          id: `order-${o.id}`,
          type: 'order',
          description: `New order ${formatPrice(o.total_amount)}${profile?.full_name ? ` by ${profile.full_name}` : ''}`,
          timestamp: o.created_at,
        });
      });
      (recentNewCustomersRes.data || []).forEach((p) => {
        activities.push({
          id: `customer-${p.id}`,
          type: 'customer',
          description: `${p.full_name || 'New customer'} joined`,
          timestamp: p.created_at,
        });
      });
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityFeed(activities.slice(0, 10));

      setLoading(false);
    }
    fetchDashboard();
  }, []);

  if (loading) return <PageSpinner />;

  const revenueTrend = trendValue(
    (revenueData.reduce((s, d) => s + d.revenue, 0)),
    stats.prevRevenue
  );
  const thisMonthOrders = stats.totalOrders - stats.prevOrders;
  const ordersTrend = trendValue(thisMonthOrders, stats.prevOrders);
  const productsTrend = trendValue(stats.totalProducts, stats.prevProducts);
  const customersTrend = trendValue(stats.totalCustomers, stats.prevCustomers);

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'bg-green-50 text-green-600', trend: revenueTrend },
    { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingCart, color: 'bg-blue-50 text-blue-600', trend: ordersTrend },
    { label: 'Products', value: stats.totalProducts.toString(), icon: Package, color: 'bg-amber-50 text-amber-600', trend: productsTrend },
    { label: 'Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'bg-teal-50 text-teal-600', trend: customersTrend },
  ];

  const totalStatusOrders = statusData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-500 text-sm">Overview of your store performance</p>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <AnimatedSection key={card.label} animation="fade-in-up" delay={`stagger-${i + 1}`}>
            <div className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', card.color)}>
                  <card.icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                  card.trend.positive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                )}>
                  {card.trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.trend.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-surface-900">{card.value}</p>
              <p className="text-sm text-surface-500">{card.label}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* Revenue Chart + Orders by Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-surface-900 mb-4">Revenue (Last 7 Days)</h2>
            <div className="h-72" style={{ minHeight: 288 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
                    formatter={(value: number) => [formatPrice(value), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-md transition-shadow h-full">
            <h2 className="font-semibold text-surface-900 mb-4">Orders by Status</h2>
            {totalStatusOrders === 0 ? (
              <p className="text-center text-surface-400 text-sm py-12">No orders yet</p>
            ) : (
              <>
                <div className="h-48 flex justify-center" style={{ minHeight: 192 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData.filter((s) => s.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="label"
                      >
                        {statusData.filter((s) => s.count > 0).map((entry) => (
                          <Cell key={entry.status} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
                        formatter={(value: number, name: string) => [`${value} orders`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {statusData.map((s) => (
                    <div key={s.status} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-surface-700">{s.label}</span>
                      </div>
                      <span className="font-medium text-surface-900">{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Products + Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="font-semibold text-surface-900">Top Selling Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Product</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Price</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {topProducts.map((p, idx) => (
                  <tr key={p.product_id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-surface-900 truncate max-w-[180px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-700 text-right">{formatPrice(p.price)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-surface-900 text-right">{p.total_qty}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-surface-400 text-sm">No sales data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-surface-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-surface-100 max-h-[360px] overflow-y-auto">
            {activityFeed.map((item) => (
              <div key={item.id} className="px-6 py-3.5 flex items-start gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  item.type === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'
                )}>
                  {item.type === 'order' ? <ShoppingCart className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-surface-900">{item.description}</p>
                  <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {activityFeed.length === 0 && (
              <p className="px-6 py-8 text-center text-surface-400 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-6 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {recentOrders.map((order) => {
                    const statusInfo = ORDER_STATUSES[order.status];
                    const profile = order.profile as Profile | undefined;
                    const name = profile?.full_name || '—';
                    return (
                      <tr key={order.id} className="hover:bg-surface-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono font-medium text-surface-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-surface-100 text-surface-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {getInitials(name)}
                            </span>
                            <span className="text-surface-700 truncate max-w-[120px]">{name}</span>
                          </div>
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
                      <td colSpan={5} className="px-6 py-8 text-center text-surface-400 text-sm">No orders yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-md transition-shadow">
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
