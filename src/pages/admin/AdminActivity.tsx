import { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  ShoppingCart,
  UserPlus,
  Star,
  Filter,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice, cn } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { Order, Profile, Review } from '../../types';

type ActivityType = 'order' | 'customer' | 'review';

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  created_at: string;
}

type FilterType = 'all' | ActivityType;

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

const ACTIVITY_CONFIG: Record<ActivityType, { color: string; bgColor: string; Icon: typeof ShoppingCart }> = {
  order: { color: 'text-green-600', bgColor: 'bg-green-100', Icon: ShoppingCart },
  customer: { color: 'text-blue-600', bgColor: 'bg-blue-100', Icon: UserPlus },
  review: { color: 'text-amber-600', bgColor: 'bg-amber-100', Icon: Star },
};

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Orders', value: 'order' },
  { label: 'Customers', value: 'customer' },
  { label: 'Reviews', value: 'review' },
];

const PAGE_SIZE = 20;

export default function AdminActivity() {
  useDocumentTitle('Activity — Admin');

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);

      const [ordersRes, profilesRes, reviewsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, profile:profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('reviews')
          .select('*, profile:profiles(full_name), product:products(name)')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const items: ActivityItem[] = [];

      if (ordersRes.data) {
        for (const order of ordersRes.data as (Order & { profile: { full_name: string } | null })[]) {
          const name = order.profile?.full_name || 'Unknown';
          const orderId = order.id.slice(0, 8).toUpperCase();
          items.push({
            id: `order-${order.id}`,
            type: 'order',
            description: `New order #${orderId} by ${name} for ${formatPrice(order.total_amount)}`,
            created_at: order.created_at,
          });
        }
      }

      if (profilesRes.data) {
        for (const profile of profilesRes.data as Profile[]) {
          items.push({
            id: `customer-${profile.id}`,
            type: 'customer',
            description: `New customer registered: ${profile.full_name || 'Anonymous'}`,
            created_at: profile.created_at!,
          });
        }
      }

      if (reviewsRes.data) {
        for (const review of reviewsRes.data as (Review & { product: { name: string } | null })[]) {
          const reviewer = review.profile?.full_name || 'Someone';
          const product = review.product?.name || 'a product';
          items.push({
            id: `review-${review.id}`,
            type: 'review',
            description: `${reviewer} reviewed ${product} (${review.rating} star${review.rating !== 1 ? 's' : ''})`,
            created_at: review.created_at,
          });
        }
      }

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(items);
      setLoading(false);
    }

    fetchActivity();
  }, []);

  const stats = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return {
      orders: activities.filter((a) => a.type === 'order' && new Date(a.created_at).getTime() > oneDayAgo).length,
      customers: activities.filter((a) => a.type === 'customer' && new Date(a.created_at).getTime() > oneDayAgo).length,
      reviews: activities.filter((a) => a.type === 'review' && new Date(a.created_at).getTime() > oneDayAgo).length,
    };
  }, [activities]);

  const filtered = useMemo(
    () => (filter === 'all' ? activities : activities.filter((a) => a.type === filter)),
    [activities, filter],
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Activity Log</h1>
          <p className="text-surface-500 mt-1">Recent activity across your store</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-surface-100 p-5">
        <div className="flex items-center gap-2 text-sm text-surface-500 mb-3">
          <Clock className="w-4 h-4" />
          <span>Last 24 hours</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-surface-900">{stats.orders}</p>
            <p className="text-sm text-surface-500">Orders</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{stats.customers}</p>
            <p className="text-sm text-surface-500">New Customers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{stats.reviews}</p>
            <p className="text-sm text-surface-500">Reviews</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-surface-400" />
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-surface-400">
            <Activity className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">No activity yet</p>
            <p className="text-sm mt-1">Activity will appear here as your store grows</p>
          </div>
        ) : (
          <div className="relative">
            {visible.map((item, idx) => {
              const config = ACTIVITY_CONFIG[item.type];
              const isLast = idx === visible.length - 1;

              return (
                <div key={item.id} className="relative flex gap-4 group">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-[17px] top-10 bottom-0 w-px bg-surface-100" />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                      config.bgColor,
                    )}
                  >
                    <config.Icon className={cn('w-4 h-4', config.color)} />
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      'flex-1 pb-6 min-w-0',
                      isLast && 'pb-0',
                    )}
                  >
                    <div className="rounded-xl p-3 -mt-1 transition-colors group-hover:bg-surface-50">
                      <p className="text-sm text-surface-800">{item.description}</p>
                      <p className="text-xs text-surface-400 mt-1">
                        {getRelativeTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-4 pt-4 border-t border-surface-100">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
