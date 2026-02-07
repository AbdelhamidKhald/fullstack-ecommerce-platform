import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, SortOption } from '../types';

interface UseProductsOptions {
  categorySlug?: string;
  search?: string;
  sort?: SortOption;
  featured?: boolean;
  limit?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('products')
      .select('*, category:categories(*)');

    if (options.categorySlug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', options.categorySlug)
        .maybeSingle();
      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }

    if (options.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    if (options.featured) {
      query = query.eq('is_featured', true);
    }

    switch (options.sort) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating_avg', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
    } else {
      setProducts((data as Product[]) || []);
    }
    setLoading(false);
  }, [options.categorySlug, options.search, options.sort, options.featured, options.limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .maybeSingle();

      setProduct(data as Product | null);
      setLoading(false);
    }
    if (slug) fetch();
  }, [slug]);

  return { product, loading };
}
