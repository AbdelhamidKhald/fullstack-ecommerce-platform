import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { formatPrice, getDiscountPercentage, cn } from '../../lib/utils';
import { StarRating } from '../ui/StarRating';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [isWished, setIsWished] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()
      .then(({ data }) => setIsWished(!!data));
  }, [user, product.id]);

  const discount = getDiscountPercentage(product.price, product.compare_at_price);
  const mainImage = product.images?.[0] || '';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to add items to cart', 'info');
      return;
    }
    await addToCart(product.id);
    showToast(`${product.name} added to cart`);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to save items', 'info');
      return;
    }
    if (isWished) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product.id);
      setIsWished(false);
      showToast('Removed from wishlist');
    } else {
      // Check DB to prevent duplicate insert
      const { data: exists } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      if (!exists) {
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id });
      }
      setIsWished(true);
      showToast('Added to wishlist');
    }
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-xl hover:shadow-surface-200/60 hover:-translate-y-1.5 transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-surface-50">
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton rounded-none" />
          )}
          <img
            src={mainImage}
            alt={product.name}
            onLoad={() => setImgLoaded(true)}
            className={cn(
              'w-full h-full object-cover group-hover:scale-110 transition-transform duration-500',
              !imgLoaded && 'opacity-0'
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              -{discount}%
            </span>
          )}

          {product.stock_quantity < 10 && product.stock_quantity > 0 && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              Low Stock
            </span>
          )}

          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={handleWishlist}
              aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-md"
            >
              <Heart className={cn('w-4 h-4', isWished ? 'fill-red-500 text-red-500' : 'text-surface-700')} />
            </button>
            <button
              onClick={handleAddToCart}
              aria-label="Add to cart"
              className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center hover:bg-brand-700 hover:scale-110 transition-all shadow-md"
            >
              <ShoppingCart className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75">
            <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-surface-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-md">
              <Eye className="w-3.5 h-3.5" />
              Quick View
            </span>
          </div>
        </div>

        <div className="p-4">
          {product.category && (
            <p className="text-xs font-medium text-brand-600 uppercase tracking-wide mb-1">
              {product.category.name}
            </p>
          )}
          <h3 className="font-semibold text-surface-900 group-hover:text-brand-700 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="mt-1.5">
            <StarRating rating={Math.round(product.rating_avg)} count={product.rating_count} size="sm" />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-lg font-bold text-surface-900">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-sm text-surface-400 line-through">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
