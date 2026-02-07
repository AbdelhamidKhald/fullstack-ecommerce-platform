import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Review } from '../types';

export function useReviews(productId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*, profile:profiles(full_name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    setReviews((data as Review[]) || []);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const addReview = async (rating: number, comment: string, userId: string) => {
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: userId,
      rating,
      comment,
    });
    if (!error) await fetchReviews();
    return error;
  };

  return { reviews, loading, addReview, refetch: fetchReviews };
}
