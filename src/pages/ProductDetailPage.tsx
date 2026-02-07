import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart, Heart, ChevronLeft, Minus, Plus, Truck, Shield, RotateCcw,
} from 'lucide-react';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useReviews } from '../hooks/useReviews';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, getDiscountPercentage, formatDate, cn } from '../lib/utils';
import { StarRating } from '../components/ui/StarRating';
import { PageSpinner } from '../components/ui/Spinner';
import { ProductCard } from '../components/product/ProductCard';
import { AnimatedSection } from '../components/ui/AnimatedSection';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading } = useProduct(slug || '');
  useDocumentTitle(product?.name || 'Product');
  const { products: related } = useProducts({ limit: 4 });
  const { reviews, addReview } = useReviews(product?.id || '');
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  if (loading) return <PageSpinner />;
  if (!product) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 mb-2">Product not found</h2>
          <Link to="/shop" className="btn-primary mt-4">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const discount = getDiscountPercentage(product.price, product.compare_at_price);
  const images = product.images || [];
  const relatedFiltered = related.filter((p) => p.id !== product.id).slice(0, 4);

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please sign in to add items to cart', 'info');
      return;
    }
    await addToCart(product.id, quantity);
    showToast(`${product.name} added to cart`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setReviewLoading(true);
    const err = await addReview(reviewRating, reviewComment, user.id);
    if (err) {
      showToast('You already reviewed this product', 'error');
    } else {
      showToast('Review submitted!');
      setReviewComment('');
      setReviewRating(5);
    }
    setReviewLoading(false);
  };

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-surface-500 hover:text-surface-900 transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="animate-fade-in">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-surface-100">
              <img
                src={images[selectedImage] || ''}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                  -{discount}% OFF
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'w-20 h-20 rounded-xl overflow-hidden border-2 transition-all',
                      selectedImage === i ? 'border-brand-500 shadow-md' : 'border-surface-200 hover:border-surface-300'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="animate-fade-in-up">
            {product.category && (
              <Link
                to={`/shop?category=${product.category.slug}`}
                className="text-sm font-medium text-brand-600 uppercase tracking-wide hover:text-brand-700 transition-colors"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 mt-2 mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <StarRating rating={Math.round(product.rating_avg)} count={product.rating_count} size="md" />
              <span className="text-sm text-surface-500">{product.rating_avg.toFixed(1)} out of 5</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-surface-900">{formatPrice(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-xl text-surface-400 line-through">{formatPrice(product.compare_at_price)}</span>
              )}
              {discount > 0 && (
                <span className="badge bg-green-100 text-green-800">Save {formatPrice(product.compare_at_price! - product.price)}</span>
              )}
            </div>

            <p className="text-surface-600 leading-relaxed mb-8">{product.description}</p>

            <div className="flex items-center gap-2 mb-6">
              <span className={cn(
                'badge',
                product.stock_quantity > 10 ? 'bg-green-100 text-green-800' :
                product.stock_quantity > 0 ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              )}>
                {product.stock_quantity > 10 ? 'In Stock' :
                 product.stock_quantity > 0 ? `Only ${product.stock_quantity} left` :
                 'Out of Stock'}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-surface-200 rounded-xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-surface-50 transition-colors rounded-l-xl"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="p-3 hover:bg-surface-50 transition-colors rounded-r-xl"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="flex-1 btn-primary gap-2 py-3.5 disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>

              <button className="p-3.5 border border-surface-200 rounded-xl hover:bg-surface-50 hover:border-red-200 transition-all group">
                <Heart className="w-5 h-5 text-surface-400 group-hover:text-red-500 transition-colors" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-surface-100 pt-6">
              {[
                { icon: Truck, label: 'Free Shipping' },
                { icon: Shield, label: 'Secure Payment' },
                { icon: RotateCcw, label: '30-Day Returns' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-sm text-surface-500">
                  <f.icon className="w-4 h-4" />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="flex gap-1 border-b border-surface-200 mb-8">
            {(['description', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-6 py-3 text-sm font-semibold border-b-2 transition-colors capitalize',
                  activeTab === tab
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-surface-500 hover:text-surface-700'
                )}
              >
                {tab} {tab === 'reviews' && `(${reviews.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="prose prose-surface max-w-none animate-fade-in">
              <p className="text-surface-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8 animate-fade-in">
              {user && (
                <form onSubmit={handleSubmitReview} className="bg-white rounded-2xl border border-surface-100 p-6">
                  <h3 className="font-semibold text-surface-900 mb-4">Write a Review</h3>
                  <div className="mb-4">
                    <StarRating rating={reviewRating} interactive onRate={setReviewRating} size="lg" />
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    className="input-field min-h-[100px] resize-none mb-4"
                    required
                  />
                  <button type="submit" disabled={reviewLoading} className="btn-primary text-sm">
                    Submit Review
                  </button>
                </form>
              )}

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl border border-surface-100 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-surface-900">
                          {(review.profile as { full_name?: string })?.full_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-surface-500">{formatDate(review.created_at)}</p>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    <p className="text-surface-600 text-sm">{review.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-center text-surface-500 py-8">No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {relatedFiltered.length > 0 && (
          <AnimatedSection animation="fade-in-up">
            <h2 className="text-2xl font-bold text-surface-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedFiltered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}
