import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useDebounce } from '../hooks/useDebounce';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ProductGrid } from '../components/product/ProductGrid';
import { SORT_OPTIONS } from '../lib/constants';
import { cn } from '../lib/utils';
import type { SortOption } from '../types';

export default function ShopPage() {
  useDocumentTitle('Shop');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [categorySlug, setCategorySlug] = useState(initialCategory);
  const [sort, setSort] = useState<SortOption>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const debouncedSearch = useDebounce(search, 300);
  const { categories } = useCategories();
  const { products, loading } = useProducts({
    categorySlug,
    search: debouncedSearch,
    sort,
  });

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );
  }, [products, priceRange]);

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setCategorySlug('');
    setSort('newest');
    setPriceRange([0, 1000]);
    setSearchParams({});
  };

  const hasActiveFilters = search || categorySlug || sort !== 'newest' || priceRange[0] > 0 || priceRange[1] < 1000;

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-2">
            {categorySlug
              ? categories.find((c) => c.slug === categorySlug)?.name || 'Products'
              : 'All Products'}
          </h1>
          <p className="text-surface-500">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-8 animate-fade-in-up stagger-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products..."
              className="input-field pl-12"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-surface-400" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="input-field appearance-none pr-10 min-w-[180px]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'btn-outline gap-2 lg:hidden',
                filtersOpen && 'border-brand-500 text-brand-700'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className={cn(
            'w-64 flex-shrink-0 space-y-6',
            'hidden lg:block',
            filtersOpen && '!block fixed inset-0 z-40 bg-white p-6 lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0 overflow-y-auto'
          )}>
            {filtersOpen && (
              <div className="flex items-center justify-between lg:hidden mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                <button onClick={() => setFiltersOpen(false)} className="p-2 hover:bg-surface-100 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-surface-100 p-5">
              <h3 className="font-semibold text-surface-900 mb-4">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    !categorySlug ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-50'
                  )}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      categorySlug === cat.slug ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-50'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-surface-100 p-5">
              <h3 className="font-semibold text-surface-900 mb-4">Price Range</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Min: ${priceRange[0]}</label>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full accent-brand-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Max: ${priceRange[1]}</label>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-brand-600"
                  />
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="w-full btn-ghost text-sm text-red-600 hover:bg-red-50">
                Clear All Filters
              </button>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            <ProductGrid products={filteredProducts} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
