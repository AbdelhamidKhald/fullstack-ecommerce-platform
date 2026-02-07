import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, CreditCard, ClipboardList } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import { formatPrice, cn } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import type { ShippingAddress } from '../types';

const steps = [
  { id: 1, label: 'Shipping', icon: MapPin },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Review', icon: ClipboardList },
];

export default function CheckoutPage() {
  useDocumentTitle('Checkout');
  const { items, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState<ShippingAddress>({
    full_name: profile?.full_name || '',
    address: profile?.address || '',
    city: profile?.city || '',
    country: profile?.country || '',
    phone: profile?.phone || '',
  });

  const shipping = total > 50 ? 0 : 9.99;
  const grandTotal = total + shipping;

  const handlePlaceOrder = async () => {
    if (!user) return;
    setLoading(true);

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: grandTotal,
        shipping_address: address,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (orderErr || !order) {
      showToast('Failed to create order', 'error');
      setLoading(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.product?.price || 0,
      total_price: (item.product?.price || 0) * item.quantity,
    }));

    await supabase.from('order_items').insert(orderItems);
    await clearCart();

    setLoading(false);
    navigate(`/order-confirmation/${order.id}`);
  };

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, [items.length, navigate]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-surface-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-surface-900 mb-8">Checkout</h1>

        <div className="flex items-center justify-center mb-12">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  step > s.id ? 'bg-brand-600 text-white' :
                  step === s.id ? 'bg-brand-600 text-white scale-110 shadow-lg shadow-brand-500/30' :
                  'bg-surface-200 text-surface-500'
                )}>
                  {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  'text-xs font-medium mt-2',
                  step >= s.id ? 'text-brand-700' : 'text-surface-400'
                )}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-16 sm:w-24 h-0.5 mx-2 transition-colors duration-300',
                  step > s.id ? 'bg-brand-600' : 'bg-surface-200'
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in-up">
                <h2 className="text-lg font-semibold text-surface-900 mb-6">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Full Name</label>
                    <input
                      value={address.full_name}
                      onChange={(e) => setAddress({ ...address, full_name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Address</label>
                    <input
                      value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">City</label>
                      <input
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">Country</label>
                      <input
                        value={address.country}
                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Phone</label>
                    <input
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!address.full_name || !address.address || !address.city || !address.country}
                  className="btn-primary w-full mt-6 disabled:opacity-50"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in-up">
                <h2 className="text-lg font-semibold text-surface-900 mb-6">Payment Method</h2>
                <div className="space-y-3">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
                    { id: 'card', label: 'Credit / Debit Card', desc: 'Secure online payment' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        paymentMethod === method.id
                          ? 'border-brand-500 bg-brand-50/50'
                          : 'border-surface-200 hover:border-surface-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-brand-600 accent-brand-600"
                      />
                      <div>
                        <p className="font-medium text-surface-900">{method.label}</p>
                        <p className="text-sm text-surface-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                  <button onClick={() => setStep(3)} className="btn-primary flex-1">Review Order</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in-up">
                <h2 className="text-lg font-semibold text-surface-900 mb-6">Review Your Order</h2>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-surface-500 mb-2">Shipping to</h3>
                  <p className="text-surface-900 font-medium">{address.full_name}</p>
                  <p className="text-sm text-surface-600">{address.address}, {address.city}, {address.country}</p>
                  <p className="text-sm text-surface-600">{address.phone}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-surface-500 mb-2">Payment</h3>
                  <p className="text-surface-900 font-medium">
                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card'}
                  </p>
                </div>

                <div className="border-t border-surface-100 pt-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.product?.images?.[0] || ''}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{item.product?.name}</p>
                        <p className="text-xs text-surface-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(2)} className="btn-outline flex-1">Back</button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn-primary flex-1 gap-2"
                  >
                    {loading ? <Spinner size="sm" className="border-white/30 border-t-white" /> : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 sticky top-24">
              <h3 className="font-semibold text-surface-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Subtotal</span>
                  <span className="font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Shipping</span>
                  <span className={cn('font-medium', shipping === 0 && 'text-green-600')}>
                    {shipping === 0 ? 'Free' : formatPrice(shipping)}
                  </span>
                </div>
              </div>
              <div className="border-t border-surface-100 pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
