import { useState } from 'react';
import { User, Phone, MapPin, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Spinner } from '../components/ui/Spinner';
import { getInitials } from '../lib/utils';

export default function ProfilePage() {
  useDocumentTitle('My Profile');
  const { user, profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    country: profile?.country || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const err = await updateProfile(form);
    if (err) {
      showToast(err, 'error');
    } else {
      showToast('Profile updated');
    }
    setLoading(false);
  };

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-surface-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-surface-900 mb-8 animate-fade-in-up">My Profile</h1>

        <div className="bg-white rounded-2xl border border-surface-100 p-6 sm:p-8 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-surface-100">
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-xl font-bold text-brand-700">
              {getInitials(profile?.full_name || 'U')}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">{profile?.full_name || 'User'}</h2>
              <p className="text-sm text-surface-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
                <Phone className="w-4 h-4" /> Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
                <MapPin className="w-4 h-4" /> Address
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Country</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary gap-2 w-full disabled:opacity-50">
              {loading ? <Spinner size="sm" className="border-white/30 border-t-white" /> : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
