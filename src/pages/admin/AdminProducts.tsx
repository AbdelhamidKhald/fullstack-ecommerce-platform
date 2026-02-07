import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Star, ImageOff, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice, cn, slugify } from '../../lib/utils';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
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

type StatusFilter = 'all' | 'active' | 'inactive' | 'featured';

const PAGE_SIZE = 10;

export default function AdminProducts() {
  useDocumentTitle('Products — Admin');

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Stats (fetched once, independent of filters)
  const [stats, setStats] = useState({ total: 0, active: 0, featured: 0, outOfStock: 0 });

  const { categories } = useCategories();
  const { showToast } = useToast();
  const debouncedSearch = useDebounce(search, 300);

  const fetchStats = useCallback(async () => {
    const { count: total } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: featured } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_featured', true);
    const { count: outOfStock } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock_quantity', 0);
    setStats({
      total: total ?? 0,
      active: active ?? 0,
      featured: featured ?? 0,
      outOfStock: outOfStock ?? 0,
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, category:categories(name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (debouncedSearch) {
      query = query.ilike('name', `%${debouncedSearch}%`);
    }
    if (categoryFilter) {
      query = query.eq('category_id', categoryFilter);
    }
    if (statusFilter === 'active') query = query.eq('is_active', true);
    else if (statusFilter === 'inactive') query = query.eq('is_active', false);
    else if (statusFilter === 'featured') query = query.eq('is_featured', true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count } = await query;
    setProducts((data as Product[]) || []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [debouncedSearch, categoryFilter, statusFilter, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [debouncedSearch, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
      else showToast('Product updated', 'success');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) showToast(error.message, 'error');
      else showToast('Product created', 'success');
    }

    setSaving(false);
    setModalOpen(false);
    fetchProducts();
    fetchStats();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    showToast('Product deleted', 'success');
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    fetchProducts();
    fetchStats();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} product(s)? This cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await supabase.from('products').delete().in('id', Array.from(selectedIds));
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast(`${selectedIds.size} product(s) deleted`, 'success');
      setSelectedIds(new Set());
    }
    setDeleting(false);
    fetchProducts();
    fetchStats();
  };

  const imagePreviewUrls = useMemo(() => {
    return form.images.split('\n').filter(Boolean);
  }, [form.images]);

  const statusButtons: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'featured', label: 'Featured' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Products</h1>
          <p className="text-surface-500 text-sm">Manage your product catalog</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Products', value: stats.total, color: 'text-surface-900' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Featured', value: stats.featured, color: 'text-amber-600' },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-surface-100 p-4">
            <p className="text-xs font-medium text-surface-500 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-field pl-12"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Status Toggle Buttons */}
      <div className="flex items-center gap-1 mb-6 bg-surface-50 rounded-xl p-1 w-fit">
        {statusButtons.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
              statusFilter === s.key
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="px-6 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-brand-600 rounded"
                  />
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Product</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Price</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Stock</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Rating</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Package className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-500 font-medium">No products found</p>
                    <p className="text-surface-400 text-sm mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className={cn('hover:bg-surface-50/50 transition-colors', selectedIds.has(p.id) && 'bg-brand-50/30')}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 accent-brand-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-surface-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center">
                            <ImageOff className="w-4 h-4 text-surface-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-surface-900 truncate max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500">
                      {(p.category as { name: string } | undefined)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-surface-900">{formatPrice(p.price)}</td>
                    <td className="px-6 py-4">
                      <span className={cn('badge', p.stock_quantity === 0 ? 'bg-red-100 text-red-800' : p.stock_quantity < 10 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800')}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm text-surface-700">{(p.rating_avg ?? 0).toFixed(1)}</span>
                        {p.rating_count > 0 && (
                          <span className="text-xs text-surface-400">({p.rating_count})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('badge', p.is_active ? 'bg-green-100 text-green-800' : 'bg-surface-100 text-surface-600')}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {p.is_featured && (
                          <span className="badge bg-amber-100 text-amber-800">Featured</span>
                        )}
                      </div>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-ghost text-sm gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-surface-600 px-2">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-ghost text-sm gap-1 disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? <Spinner size="sm" className="border-white/30 border-t-white" /> : <Trash2 className="w-4 h-4" />}
            Delete selected ({selectedIds.size})
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-surface-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
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
            {imagePreviewUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imagePreviewUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="w-14 h-14 rounded-lg object-cover border border-surface-200 bg-surface-50"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>
            )}
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
