import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { ORDER_STATUSES } from '../lib/constants';
import { PageSpinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import type { Order } from '../types';

export default function OrdersPage() {
  useDocumentTitle('My Orders');
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!user) return;
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  if (loading) return <PageSpinner />;

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-surface-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-surface-900 mb-8 animate-fade-in-up">My Orders</h1>

        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you place orders, they will appear here."
            action={{ label: 'Start Shopping', onClick: () => window.location.href = '/shop' }}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const statusInfo = ORDER_STATUSES[order.status];
              return (
                <AnimatedSection key={order.id} animation="fade-in-up" delay={`stagger-${Math.min(i + 1, 5)}`}>
                  <Link
                    to={`/order-confirmation/${order.id}`}
                    className="block bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-mono text-sm font-medium text-surface-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn('badge', statusInfo.color)}>{statusInfo.label}</span>
                        <ChevronRight className="w-4 h-4 text-surface-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-surface-100">
                      <span className="text-sm text-surface-500">
                        Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card'}
                      </span>
                      <span className="text-lg font-bold text-surface-900">{formatPrice(order.total_amount)}</span>
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
