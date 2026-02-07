import { useState, useCallback } from 'react';
import { Store, Bell, LayoutGrid, AlertTriangle, Save, RotateCcw, ShieldAlert } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';

const STORAGE_KEY = 'nexshop_settings';

interface StoreSettings {
  storeName: string;
  storeDescription: string;
  currencySymbol: string;
  contactEmail: string;
}

interface NotificationSettings {
  emailOnNewOrder: boolean;
  emailOnLowStock: boolean;
  emailOnNewCustomer: boolean;
}

interface DisplaySettings {
  productsPerPage: number;
  defaultSortOrder: string;
  showOutOfStock: boolean;
}

interface AllSettings {
  store: StoreSettings;
  notifications: NotificationSettings;
  display: DisplaySettings;
}

const defaultSettings: AllSettings = {
  store: {
    storeName: 'NexShop',
    storeDescription: '',
    currencySymbol: '$',
    contactEmail: '',
  },
  notifications: {
    emailOnNewOrder: true,
    emailOnLowStock: true,
    emailOnNewCustomer: false,
  },
  display: {
    productsPerPage: 12,
    defaultSortOrder: 'newest',
    showOutOfStock: true,
  },
};

function loadSettings(): AllSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        store: { ...defaultSettings.store, ...parsed.store },
        notifications: { ...defaultSettings.notifications, ...parsed.notifications },
        display: { ...defaultSettings.display, ...parsed.display },
      };
    }
  } catch {
    // ignore
  }
  return { ...defaultSettings };
}

function saveToStorage(settings: AllSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Toggle switch component styled like iOS
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      <div>
        <p className="text-sm font-medium text-surface-900 group-hover:text-brand-600 transition-colors">
          {label}
        </p>
        {description && <p className="text-xs text-surface-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2
          focus:ring-brand-500/30 focus:ring-offset-2
          ${checked ? 'bg-brand-600' : 'bg-surface-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
            ring-0 transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </label>
  );
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name (A–Z)' },
];

export default function AdminSettings() {
  useDocumentTitle('Settings — Admin');
  const { showToast } = useToast();

  const [settings, setSettings] = useState<AllSettings>(loadSettings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Convenience updaters
  const updateStore = useCallback(
    (patch: Partial<StoreSettings>) =>
      setSettings((prev) => ({ ...prev, store: { ...prev.store, ...patch } })),
    [],
  );

  const updateNotifications = useCallback(
    (patch: Partial<NotificationSettings>) =>
      setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, ...patch } })),
    [],
  );

  const updateDisplay = useCallback(
    (patch: Partial<DisplaySettings>) =>
      setSettings((prev) => ({ ...prev, display: { ...prev.display, ...patch } })),
    [],
  );

  const saveSection = (section: 'store' | 'notifications' | 'display') => {
    const current = loadSettings();
    const merged: AllSettings = { ...current, [section]: settings[section] };
    saveToStorage(merged);
    showToast('Settings saved successfully', 'success');
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings({ ...defaultSettings });
    setShowResetConfirm(false);
    showToast('All settings have been reset to defaults', 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500 text-sm">Manage your store configuration and preferences</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* ── Store Information ── */}
        <section className="bg-white rounded-2xl border border-surface-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Store className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Store Information</h2>
              <p className="text-xs text-surface-400">Basic details about your store</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Store Name</label>
              <input
                type="text"
                className="input-field"
                value={settings.store.storeName}
                onChange={(e) => updateStore({ storeName: e.target.value })}
                placeholder="Your store name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Store Description
              </label>
              <textarea
                className="input-field min-h-[100px] resize-y"
                value={settings.store.storeDescription}
                onChange={(e) => updateStore({ storeDescription: e.target.value })}
                placeholder="A brief description of your store"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={settings.store.currencySymbol}
                  onChange={(e) => updateStore({ currencySymbol: e.target.value })}
                  placeholder="$"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={settings.store.contactEmail}
                  onChange={(e) => updateStore({ contactEmail: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={() => saveSection('store')} className="btn-primary gap-2 text-sm">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </section>

        {/* ── Notification Preferences ── */}
        <section className="bg-white rounded-2xl border border-surface-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Notification Preferences</h2>
              <p className="text-xs text-surface-400">Choose what email notifications you receive</p>
            </div>
          </div>

          <div className="space-y-5">
            <Toggle
              checked={settings.notifications.emailOnNewOrder}
              onChange={(val) => updateNotifications({ emailOnNewOrder: val })}
              label="New order received"
              description="Get notified when a customer places a new order"
            />
            <Toggle
              checked={settings.notifications.emailOnLowStock}
              onChange={(val) => updateNotifications({ emailOnLowStock: val })}
              label="Low stock alert"
              description="Get notified when a product stock falls below threshold"
            />
            <Toggle
              checked={settings.notifications.emailOnNewCustomer}
              onChange={(val) => updateNotifications({ emailOnNewCustomer: val })}
              label="New customer registration"
              description="Get notified when a new customer signs up"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => saveSection('notifications')}
              className="btn-primary gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </section>

        {/* ── Display Preferences ── */}
        <section className="bg-white rounded-2xl border border-surface-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Display Preferences</h2>
              <p className="text-xs text-surface-400">
                Customize how products are shown on the storefront
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Products Per Page
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="input-field"
                  value={settings.display.productsPerPage}
                  onChange={(e) =>
                    updateDisplay({ productsPerPage: Math.max(1, Number(e.target.value)) })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Default Sort Order
                </label>
                <select
                  className="input-field"
                  value={settings.display.defaultSortOrder}
                  onChange={(e) => updateDisplay({ defaultSortOrder: e.target.value })}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Toggle
              checked={settings.display.showOutOfStock}
              onChange={(val) => updateDisplay({ showOutOfStock: val })}
              label="Show out-of-stock products"
              description="Display products that are currently unavailable"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => saveSection('display')}
              className="btn-primary gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </section>

        {/* ── Danger Zone ── */}
        <section className="bg-white rounded-2xl border-2 border-red-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
              <p className="text-xs text-surface-400">Irreversible actions — proceed with caution</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Reset settings */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/50 p-4">
              <div>
                <p className="text-sm font-medium text-surface-900">Reset All Settings</p>
                <p className="text-xs text-surface-400">
                  Restore every setting on this page to its factory default
                </p>
              </div>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-surface-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Confirm Reset
                  </button>
                </div>
              )}
            </div>

            {/* Clear sessions (informational) */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-surface-100 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-surface-900">Clear All Sessions</p>
                  <span className="badge text-[10px]">Info</span>
                </div>
                <p className="text-xs text-surface-400 mt-0.5">
                  Session management is handled by Supabase Auth. To revoke active sessions, visit
                  your Supabase dashboard under Authentication → Users.
                </p>
              </div>
              <ShieldAlert className="w-5 h-5 text-surface-300 shrink-0" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
