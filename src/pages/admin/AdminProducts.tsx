import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice, cn, slugify } from '../../lib/utils';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import type { Product } from '../../types';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  compare_at_price: string;
  category_id: string;
  stock_quantity: string;
  is_featured: boolean;
  is_active: boolean;
  images: string;
}

const emptyForm: ProductForm = {
  name: '', description: '', price: '', compare_at_price: '',
  category_id: '', stock_quantity: '0', is_featured: false, is_active: true, images: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { categories } = useCategories();
  const { showToast } = useToast();
  const debouncedSearch = useDebounce(search, 300);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, category:categories(name)').order('created_at', { ascending: false });
    if (debouncedSearch) {
      query = query.ilike('name', `%${debouncedSearch}%`);
    }
    const { data } = await query;
    setProducts((data as Product[]) || []);
    setLoading(false);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      compare_at_price: p.compare_at_price?.toString() || '',
      category_id: p.category_id || '',
      stock_quantity: p.stock_quantity.toString(),
      is_featured: p.is_featured,
      is_active: p.is_active,
      images: (p.images || []).join('\n'),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      slug: slugify(form.name),
      description: form.description,
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      category_id: form.category_id || null,
      stock_quantity: parseInt(form.stock_quantity),
      is_featured: form.is_featured,
      is_active: form.is_active,
      images: form.images.split('\n').filter(Boolean),
    };

    if (editId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editId);
      if (error) showToast(error.message, 'error');
      else showToast('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) showToast(error.message, 'error');
      else showToast('Product created');
    }

    setSaving(false);
    setModalOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    showToast('Product deleted');
    fetchProducts();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Products</h1>
          <p className="text-surface-500 text-sm">{products.length} products</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="input-field pl-12"
        />
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Product</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Price</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Stock</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || ''} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="text-sm font-medium text-surface-900 truncate max-w-[200px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-500">
                    {(p.category as { name: string } | undefined)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-surface-900">{formatPrice(p.price)}</td>
                  <td className="px-6 py-4">
                    <span className={cn('badge', p.stock_quantity < 10 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800')}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('badge', p.is_active ? 'bg-green-100 text-green-800' : 'bg-surface-100 text-surface-600')}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4 text-surface-500" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[80px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Price ($)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Compare at Price ($)</label>
              <input type="number" step="0.01" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Stock Quantity</label>
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Image URLs (one per line)</label>
            <textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="input-field min-h-[80px] resize-none font-mono text-xs" placeholder="https://..." />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-brand-600 rounded" />
              <span className="text-sm text-surface-700">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-brand-600 rounded" />
              <span className="text-sm text-surface-700">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <button onClick={() => setModalOpen(false)} className="btn-outline text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.price} className="btn-primary text-sm gap-2 disabled:opacity-50">
              {saving ? <Spinner size="sm" className="border-white/30 border-t-white" /> : (editId ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
