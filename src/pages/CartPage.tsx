import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, cn } from '../lib/utils';
import { EmptyState } from '../components/ui/EmptyState';
import { AnimatedSection } from '../components/ui/AnimatedSection';

export default function CartPage() {
  useDocumentTitle('Cart');
  const { items, total, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="pt-24 min-h-screen bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <EmptyState
            icon={ShoppingBag}
            title="Sign in to view your cart"
            description="Create an account or sign in to start shopping."
            action={{ label: 'Sign In', onClick: () => window.location.href = '/login' }}
          />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-24 min-h-screen bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet."
            action={{ label: 'Start Shopping', onClick: () => window.location.href = '/shop' }}
          />
        </div>
      </div>
    );
  }

  const shipping = total > 50 ? 0 : 9.99;
  const grandTotal = total + shipping;

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-surface-900 mb-8 animate-fade-in-up">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <AnimatedSection key={item.id} animation="fade-in-up" delay={`stagger-${Math.min(i + 1, 5)}`}>
                <div className="bg-white rounded-2xl border border-surface-100 p-4 sm:p-6 flex gap-4 sm:gap-6">
                  <Link
                    to={`/product/${item.product?.slug}`}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-surface-50 flex-shrink-0"
                  >
                    <img
                      src={item.product?.images?.[0] || ''}
                      alt={item.product?.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          to={`/product/${item.product?.slug}`}
                          className="font-semibold text-surface-900 hover:text-brand-700 transition-colors line-clamp-1"
                        >
                          {item.product?.name}
                        </Link>
                        {item.product?.category && (
                          <p className="text-sm text-surface-500 mt-0.5">{(item.product.category as { name: string }).name}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      <div className="flex items-center border border-surface-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-surface-50 transition-colors rounded-l-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-surface-50 transition-colors rounded-r-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-lg font-bold text-surface-900">
                        {formatPrice((item.product?.price || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="lg:col-span-1">
            <AnimatedSection animation="fade-in-up" delay="stagger-2">
              <div className="bg-white rounded-2xl border border-surface-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-surface-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500">Subtotal ({items.length} items)</span>
                    <span className="font-medium text-surface-900">{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500">Shipping</span>
                    <span className={cn('font-medium', shipping === 0 ? 'text-green-600' : 'text-surface-900')}>
                      {shipping === 0 ? 'Free' : formatPrice(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-brand-600">
                      Add {formatPrice(50 - total)} more for free shipping
                    </p>
                  )}
                </div>

                <div className="border-t border-surface-100 pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-surface-900">Total</span>
                    <span className="text-2xl font-bold text-surface-900">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="w-full btn-primary gap-2 py-3.5"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/shop" className="w-full btn-ghost mt-3 text-sm text-center">
                  Continue Shopping
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}
