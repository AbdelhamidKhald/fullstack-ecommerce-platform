import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, formatDate } from '../lib/utils';
import { PageSpinner } from '../components/ui/Spinner';
import type { Order, OrderItem } from '../types';

export default function OrderConfirmationPage() {
  useDocumentTitle('Order Confirmed');
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!orderId) return;
      const { data: o } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      setOrder(o as Order | null);

      const { data: items } = await supabase
        .from('order_items')
        .select('*, product:products(name, images, slug)')
        .eq('order_id', orderId);
      setOrderItems((items as OrderItem[]) || []);
      setLoading(false);
    }
    fetch();
  }, [orderId]);

  if (loading) return <PageSpinner />;
  if (!order) return null;

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-surface-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Order Confirmed!</h1>
          <p className="text-surface-500">Thank you for your purchase. Your order has been placed successfully.</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-100 p-6 mb-6 animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-surface-500">Order ID</p>
              <p className="font-mono text-sm font-medium text-surface-900">{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-surface-500">Date</p>
              <p className="text-sm font-medium text-surface-900">{formatDate(order.created_at)}</p>
            </div>
          </div>

          <div className="border-t border-surface-100 pt-4 space-y-3">
            {orderItems.map((item) => {
              const prod = item.product as { name: string; images: string[]; slug: string } | undefined;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={prod?.images?.[0] || ''}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{prod?.name}</p>
                    <p className="text-xs text-surface-500">Qty: {item.quantity} x {formatPrice(item.unit_price)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(item.total_price)}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-surface-100 pt-4 mt-4">
            <div className="flex justify-between text-lg font-bold text-surface-900">
              <span>Total</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up stagger-2">
          <Link to="/orders" className="flex-1 btn-primary gap-2 justify-center">
            <Package className="w-4 h-4" />
            View My Orders
          </Link>
          <Link to="/shop" className="flex-1 btn-outline gap-2 justify-center">
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
