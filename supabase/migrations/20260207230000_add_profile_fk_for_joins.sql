/*
  Add foreign key references from orders, reviews, cart_items, and wishlists
  to profiles(id) so PostgREST can resolve joins like:
    select('*, profile:profiles(full_name)')
  
  The existing FK to auth.users(id) stays. This adds a second FK to profiles
  which mirrors auth.users via the handle_new_user trigger.
*/

ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_profiles_fk
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_user_id_profiles_fk
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_user_id_profiles_fk
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE wishlists
  ADD CONSTRAINT wishlists_user_id_profiles_fk
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
