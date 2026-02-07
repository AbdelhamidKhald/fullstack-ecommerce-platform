import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ProductCard } from '../components/product/ProductCard';
import { PageSpinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { Product } from '../types';

export default function WishlistPage() {
  useDocumentTitle('My Wishlist');
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!user) return;
      const { data } = await supabase
        .from('wishlists')
        .select('product:products(*, category:categories(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const prods = (data || [])
        .map((w: { product: Product }) => w.product)
        .filter(Boolean);
      setProducts(prods);
      setLoading(false);
    }
    fetch();
  }, [user]);

  if (loading) return <PageSpinner />;

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-surface-900 mb-8 animate-fade-in-up">My Wishlist</h1>

        {products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Save items you love by tapping the heart icon on any product."
            action={{ label: 'Browse Products', onClick: () => window.location.href = '/shop' }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
