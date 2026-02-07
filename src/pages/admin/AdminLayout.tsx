import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, FolderTree, ChevronLeft,
  Activity, Settings,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, end: false },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree, end: false },
  { to: '/admin/customers', label: 'Customers', icon: Users, end: false },
  { to: '/admin/activity', label: 'Activity', icon: Activity, end: false },
  { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-surface-50 flex">
      <aside className={cn(
        'fixed left-0 top-16 lg:top-20 bottom-0 bg-white border-r border-surface-100 z-30 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        'hidden lg:flex flex-col'
      )}>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 border-t border-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors"
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-100 z-30 flex">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors',
              isActive ? 'text-brand-700' : 'text-surface-400'
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <main className={cn(
        'flex-1 transition-all duration-300 pb-20 lg:pb-0',
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        <Outlet />
      </main>
    </div>
  );
}
