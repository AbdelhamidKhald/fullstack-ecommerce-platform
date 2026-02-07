import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  Heart,
  LogOut,
  LayoutDashboard,
  Package,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { APP_NAME } from '../../lib/constants';
import { cn } from '../../lib/utils';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { itemCount, bounceKey } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    ...(profile?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const isTransparent = isHome && !scrolled && !mobileOpen;

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isTransparent
            ? 'bg-transparent'
            : 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-surface-100/50'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className={cn(
                  'text-xl font-bold tracking-tight transition-colors',
                  isTransparent ? 'text-white' : 'text-surface-900'
                )}>
                  {APP_NAME}
                </span>
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      location.pathname === link.to
                        ? isTransparent
                          ? 'bg-white/20 text-white'
                          : 'bg-brand-50 text-brand-700'
                        : isTransparent
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search products"
                className={cn(
                  'p-2.5 rounded-xl transition-all',
                  isTransparent
                    ? 'text-white/80 hover:bg-white/10 hover:text-white'
                    : 'text-surface-600 hover:bg-surface-100'
                )}
              >
                <Search className="w-5 h-5" />
              </button>

              {user && (
                <Link
                  to="/wishlist"
                  aria-label="Wishlist"
                  className={cn(
                    'p-2.5 rounded-xl transition-all hidden sm:flex',
                    isTransparent
                      ? 'text-white/80 hover:bg-white/10 hover:text-white'
                      : 'text-surface-600 hover:bg-surface-100'
                  )}
                >
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              <Link
                to="/cart"
                aria-label={`Shopping cart${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
                className={cn(
                  'relative p-2.5 rounded-xl transition-all',
                  isTransparent
                    ? 'text-white/80 hover:bg-white/10 hover:text-white'
                    : 'text-surface-600 hover:bg-surface-100'
                )}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span
                    key={bounceKey}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-cart-bounce"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={cn(
                      'flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-all',
                      isTransparent
                        ? 'text-white/80 hover:bg-white/10 hover:text-white'
                        : 'text-surface-600 hover:bg-surface-50'
                    )}
                  >
                    <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-brand-700" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                      {profile?.full_name || 'Account'}
                    </span>
                    <ChevronDown className={cn(
                      'w-4 h-4 hidden sm:block transition-transform',
                      userMenuOpen && 'rotate-180'
                    )} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-surface-100 overflow-hidden animate-scale-in origin-top-right z-20">
                        <div className="px-4 py-3 border-b border-surface-100">
                          <p className="text-sm font-semibold text-surface-900 truncate">{profile?.full_name || 'User'}</p>
                          <p className="text-xs text-surface-500 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                            <User className="w-4 h-4" />
                            My Profile
                          </Link>
                          <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                            <Package className="w-4 h-4" />
                            My Orders
                          </Link>
                          <Link to="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors sm:hidden">
                            <Heart className="w-4 h-4" />
                            Wishlist
                          </Link>
                          {profile?.role === 'admin' && (
                            <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50 transition-colors">
                              <LayoutDashboard className="w-4 h-4" />
                              Admin Dashboard
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-surface-100 py-1">
                          <button
                            onClick={() => { signOut(); setUserMenuOpen(false); }}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className={cn(
                    'hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                    isTransparent
                      ? 'bg-white text-surface-900 hover:bg-white/90'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  )}
                >
                  Sign In
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className={cn(
                  'lg:hidden p-2.5 rounded-xl transition-all',
                  isTransparent
                    ? 'text-white/80 hover:bg-white/10'
                    : 'text-surface-600 hover:bg-surface-100'
                )}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-surface-100 bg-white animate-fade-in-down">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="input-field pl-12 pr-4"
                  autoFocus
                />
              </form>
            </div>
          </div>
        )}

        {mobileOpen && (
          <div className="lg:hidden border-t border-surface-100 bg-white animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    location.pathname === link.to
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-600 hover:bg-surface-50'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <Link
                  to="/login"
                  className="block px-4 py-3 rounded-xl text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors text-center mt-2"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
