import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate, getInitials, cn } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce';
import { Spinner } from '../../components/ui/Spinner';
import type { Profile } from '../../types';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (debouncedSearch) {
        query = query.ilike('full_name', `%${debouncedSearch}%`);
      }
      const { data } = await query;
      setCustomers((data as Profile[]) || []);
      setLoading(false);
    }
    fetch();
  }, [debouncedSearch]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Customers</h1>
        <p className="text-surface-500 text-sm">{customers.length} registered users</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="input-field pl-12"
        />
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Location</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="hover:bg-surface-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-sm font-semibold text-brand-700">
                        {getInitials(c.full_name || 'U')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900">{c.full_name || 'Unnamed'}</p>
                        <p className="text-xs text-surface-500">{c.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-500">
                    {[c.city, c.country].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('badge', c.role === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-surface-100 text-surface-600')}>
                      {c.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-500">{formatDate(c.created_at)}</td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-surface-400 text-sm">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
