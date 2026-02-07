/*
  # Seed products data

  Inserts 20 sample products across all 4 categories with realistic
  names, descriptions, prices, and Pexels stock images.
*/

INSERT INTO products (name, slug, description, price, compare_at_price, images, category_id, stock_quantity, is_featured, rating_avg, rating_count) VALUES
  (
    'Wireless Noise-Cancelling Headphones',
    'wireless-noise-cancelling-headphones',
    'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio. Perfect for music lovers and professionals who demand the best sound quality.',
    299.99, 399.99,
    '["https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'electronics'), 45, true, 4.70, 128
  ),
  (
    'Smart Fitness Watch Pro',
    'smart-fitness-watch-pro',
    'Advanced fitness tracking with heart rate monitoring, GPS, sleep analysis, and 14-day battery life. Water-resistant to 50m with a vibrant AMOLED display.',
    249.99, 329.99,
    '["https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'electronics'), 78, true, 4.50, 95
  ),
  (
    'Ultra-Slim Laptop Stand',
    'ultra-slim-laptop-stand',
    'Ergonomic aluminum laptop stand with adjustable height and angle. Improves posture and airflow for your laptop. Foldable and portable design.',
    79.99, NULL,
    '["https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'electronics'), 120, false, 4.30, 67
  ),
  (
    'Portable Bluetooth Speaker',
    'portable-bluetooth-speaker',
    'Compact waterproof speaker with 360-degree sound, 20-hour playtime, and built-in microphone. Take your music anywhere with this rugged outdoor companion.',
    89.99, 119.99,
    '["https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'electronics'), 95, false, 4.20, 52
  ),
  (
    'Mechanical Keyboard RGB',
    'mechanical-keyboard-rgb',
    'Premium mechanical keyboard with customizable RGB backlighting, hot-swappable switches, and aircraft-grade aluminum frame. N-key rollover for gaming precision.',
    159.99, 199.99,
    '["https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'electronics'), 60, true, 4.80, 203
  ),
  (
    'Classic Leather Jacket',
    'classic-leather-jacket',
    'Timeless genuine leather jacket with a modern slim fit. Features a soft quilted lining, multiple pockets, and durable YKK zippers. A wardrobe essential.',
    349.99, 449.99,
    '["https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1035685/pexels-photo-1035685.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'fashion'), 30, true, 4.60, 87
  ),
  (
    'Premium Running Shoes',
    'premium-running-shoes',
    'Lightweight performance running shoes with responsive cushioning, breathable mesh upper, and durable rubber outsole. Designed for both road and trail running.',
    179.99, 219.99,
    '["https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'fashion'), 85, true, 4.40, 156
  ),
  (
    'Designer Sunglasses',
    'designer-sunglasses',
    'Polarized UV400 sunglasses with acetate frame and titanium temples. Handcrafted in Italy with premium anti-scratch lenses.',
    199.99, NULL,
    '["https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'fashion'), 50, false, 4.10, 41
  ),
  (
    'Cashmere Blend Scarf',
    'cashmere-blend-scarf',
    'Luxuriously soft cashmere blend scarf in a versatile neutral tone. Lightweight yet warm, perfect for layering in any season.',
    89.99, 129.99,
    '["https://images.pexels.com/photos/6567607/pexels-photo-6567607.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'fashion'), 70, false, 4.30, 33
  ),
  (
    'Canvas Tote Bag',
    'canvas-tote-bag',
    'Durable organic cotton canvas tote with reinforced handles and interior pocket. Spacious enough for daily essentials with a minimalist aesthetic.',
    49.99, NULL,
    '["https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'fashion'), 150, false, 4.00, 29
  ),
  (
    'Modern Floor Lamp',
    'modern-floor-lamp',
    'Minimalist arc floor lamp with adjustable arm and warm LED bulb included. Matte black finish with a weighted marble base for stability.',
    189.99, 249.99,
    '["https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'home-garden'), 35, true, 4.50, 74
  ),
  (
    'Ceramic Planter Set',
    'ceramic-planter-set',
    'Set of 3 handcrafted ceramic planters in graduated sizes. Matte white finish with bamboo drainage trays. Perfect for indoor plants.',
    69.99, NULL,
    '["https://images.pexels.com/photos/4503273/pexels-photo-4503273.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'home-garden'), 90, false, 4.20, 48
  ),
  (
    'Luxury Throw Blanket',
    'luxury-throw-blanket',
    'Ultra-soft faux fur throw blanket with a reversible sherpa backing. Generous 60x80 inch size, machine washable, and available in neutral tones.',
    99.99, 139.99,
    '["https://images.pexels.com/photos/6032279/pexels-photo-6032279.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'home-garden'), 55, false, 4.70, 92
  ),
  (
    'Scented Candle Collection',
    'scented-candle-collection',
    'Set of 4 hand-poured soy wax candles in artisan glass jars. Fragrances include Cedar & Sage, Vanilla Bean, Fresh Linen, and Ocean Breeze. 45-hour burn time each.',
    59.99, 79.99,
    '["https://images.pexels.com/photos/3270223/pexels-photo-3270223.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'home-garden'), 110, false, 4.40, 63
  ),
  (
    'Minimalist Wall Clock',
    'minimalist-wall-clock',
    'Silent quartz movement wall clock with a clean Scandinavian design. 12-inch diameter with solid walnut wood frame and brass hands.',
    79.99, NULL,
    '["https://images.pexels.com/photos/707582/pexels-photo-707582.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'home-garden'), 40, false, 4.10, 37
  ),
  (
    'Professional Yoga Mat',
    'professional-yoga-mat',
    'Extra-thick 6mm yoga mat with alignment markings, non-slip grip on both sides, and eco-friendly TPE material. Includes carrying strap.',
    69.99, 89.99,
    '["https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'sports-outdoors'), 100, true, 4.60, 118
  ),
  (
    'Stainless Steel Water Bottle',
    'stainless-steel-water-bottle',
    'Double-wall vacuum insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours. BPA-free, 32oz capacity with leak-proof lid.',
    34.99, NULL,
    '["https://images.pexels.com/photos/4065891/pexels-photo-4065891.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'sports-outdoors'), 200, false, 4.30, 85
  ),
  (
    'Camping Backpack 65L',
    'camping-backpack-65l',
    'Full-featured hiking backpack with adjustable suspension, rain cover, hydration-compatible design, and multiple compartments. Built for multi-day adventures.',
    149.99, 199.99,
    '["https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'sports-outdoors'), 45, false, 4.50, 72
  ),
  (
    'Resistance Band Set',
    'resistance-band-set',
    'Complete set of 5 fabric resistance bands with varying resistance levels. Non-slip design with carrying bag. Perfect for home workouts and rehabilitation.',
    29.99, 39.99,
    '["https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'sports-outdoors'), 180, false, 4.20, 54
  ),
  (
    'Telescoping Trekking Poles',
    'telescoping-trekking-poles',
    'Pair of ultralight carbon fiber trekking poles with cork grips and tungsten carbide tips. Collapses to 24 inches for easy packing.',
    89.99, 119.99,
    '["https://images.pexels.com/photos/551852/pexels-photo-551852.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
    (SELECT id FROM categories WHERE slug = 'sports-outdoors'), 65, false, 4.40, 46
  );
