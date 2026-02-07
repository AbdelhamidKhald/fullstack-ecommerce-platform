import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { AuthGuard, AdminGuard } from './components/layout/AuthGuard';
import { ToastContainer } from './components/ui/ToastContainer';
import { PageSpinner } from './components/ui/Spinner';

const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminActivity = lazy(() => import('./pages/admin/AdminActivity'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <ToastContainer />
            <ErrorBoundary>
              <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route path="/" element={<Layout><HomePage /></Layout>} />
                <Route path="/shop" element={<Layout><ShopPage /></Layout>} />
                <Route path="/product/:slug" element={<Layout><ProductDetailPage /></Layout>} />
                <Route path="/cart" element={<Layout><CartPage /></Layout>} />

                <Route path="/checkout" element={<Layout><AuthGuard><CheckoutPage /></AuthGuard></Layout>} />
                <Route path="/order-confirmation/:orderId" element={<Layout><AuthGuard><OrderConfirmationPage /></AuthGuard></Layout>} />
                <Route path="/profile" element={<Layout><AuthGuard><ProfilePage /></AuthGuard></Layout>} />
                <Route path="/orders" element={<Layout><AuthGuard><OrdersPage /></AuthGuard></Layout>} />
                <Route path="/wishlist" element={<Layout><AuthGuard><WishlistPage /></AuthGuard></Layout>} />

                <Route path="/admin" element={<Layout><AdminGuard><AdminLayout /></AdminGuard></Layout>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="activity" element={<AdminActivity />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
              </Routes>
              </Suspense>
            </ErrorBoundary>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
