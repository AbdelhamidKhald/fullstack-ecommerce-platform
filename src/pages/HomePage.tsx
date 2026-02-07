import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Headphones, RotateCcw } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { useAnimateOnScroll } from '../hooks/useAnimateOnScroll';
import { useEffect, useState } from 'react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const { ref, isVisible } = useAnimateOnScroll<HTMLSpanElement>();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let current = 0;
    const step = Math.ceil(target / 40);
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setCount(current);
    }, 30);
    return () => clearInterval(interval);
  }, [isVisible, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  useDocumentTitle();
  const { user } = useAuth();
  const { products: featuredProducts, loading: featuredLoading } = useProducts({ featured: true, limit: 8 });
  const { categories } = useCategories();

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
    { icon: Shield, title: 'Secure Payment', desc: '100% protected' },
    { icon: Headphones, title: '24/7 Support', desc: 'Dedicated help' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '30-day guarantee' },
  ];

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 via-surface-900/95 to-surface-950" />
          <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-8 animate-fade-in-down">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse-soft" />
              <span className="text-sm text-white/80 font-medium">New Collection 2026</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-up">
              Discover{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-emerald-400 to-teal-400">
                Premium
              </span>
              <br />
              Products
            </h1>

            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up stagger-2">
              Curated collections of the finest products. From cutting-edge electronics to timeless fashion, find everything you need in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-3">
              <Link to="/shop" className="btn-primary text-base px-8 py-4 gap-2 group">
                Browse Collection
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/shop?featured=true" className="btn-outline border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-8 py-4 text-base">
                Featured Items
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-20 animate-fade-in-up stagger-4">
              {[
                { value: 10000, suffix: '+', label: 'Happy Customers' },
                { value: 500, suffix: '+', label: 'Premium Products' },
                { value: 50, suffix: '+', label: 'Brands' },
                { value: 99, suffix: '%', label: 'Satisfaction' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-white mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-50 to-transparent" />
      </section>

      <section className="py-6 bg-surface-50 relative -mt-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-surface-200/50 border border-surface-100 p-6 sm:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {features.map((f, i) => (
                <AnimatedSection key={f.title} animation="fade-in-up" delay={`stagger-${i + 1}`}>
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 group-hover:scale-110 transition-all duration-300">
                      <f.icon className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 text-sm sm:text-base">{f.title}</h3>
                      <p className="text-sm text-surface-500">{f.desc}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-in-up" className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-3">Shop by Category</h2>
            <p className="text-surface-500 max-w-lg mx-auto">Browse our curated collections and find exactly what you need</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <AnimatedSection key={cat.id} animation="fade-in-up" delay={`stagger-${i + 1}`}>
                <Link
                  to={`/shop?category=${cat.slug}`}
                  className="group relative block aspect-[4/5] rounded-2xl overflow-hidden"
                >
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform duration-300">
                      {cat.name}
                    </h3>
                    <p className="text-white/70 text-sm line-clamp-2">{cat.description}</p>
                    <span className="inline-flex items-center gap-1 text-brand-400 text-sm font-medium mt-3 group-hover:gap-2 transition-all">
                      Explore <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-in-up" className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-3">Featured Products</h2>
              <p className="text-surface-500">Handpicked selections our customers love the most</p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors group"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>

          {featuredLoading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="scale-in">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-600 to-emerald-600 p-8 sm:p-12 lg:p-16">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  {user ? 'Discover Something New' : 'Ready to Start Shopping?'}
                </h2>
                <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
                  {user
                    ? 'Explore our latest collections and find products that match your style.'
                    : 'Join thousands of satisfied customers and discover products that enhance your lifestyle.'}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {!user && (
                    <Link to="/register" className="btn-secondary bg-white text-brand-700 hover:bg-white/90 px-8 py-4 text-base shadow-lg">
                      Create Free Account
                    </Link>
                  )}
                  <Link to="/shop" className="btn-outline border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-4 text-base">
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
