import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, FolderTree, LayoutGrid, List,
  ChevronUp, ChevronDown, Package, ImageOff,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { slugify, cn } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import type { Category } from '../../types';

type ViewMode = 'grid' | 'list';

export default function AdminCategories() {
  useDocumentTitle('Categories — Admin');

  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', image_url: '', display_order: '0' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [reordering, setReordering] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('products').select('category_id'),
    ]);
    setCategories((cats as Category[]) || []);
    const counts: Record<string, number> = {};
    (prods || []).forEach((p: { category_id: string | null }) => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });
    setProductCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filtered categories
  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  // Stats
  const totalProducts = useMemo(
    () => Object.values(productCounts).reduce((s, n) => s + n, 0),
    [productCounts],
  );

  // CRUD
  const openCreate = () => {
    setEditId(null);
    const nextOrder = categories.length ? Math.max(...categories.map((c) => c.display_order)) + 1 : 0;
    setForm({ name: '', description: '', image_url: '', display_order: nextOrder.toString() });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      description: c.description,
      image_url: c.image_url,
      display_order: c.display_order.toString(),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      slug: slugify(form.name),
      description: form.description,
      image_url: form.image_url,
      display_order: parseInt(form.display_order),
    };

    if (editId) {
      await supabase.from('categories').update(payload).eq('id', editId);
      showToast('Category updated');
    } else {
      await supabase.from('categories').insert(payload);
      showToast('Category created');
    }
    setSaving(false);
    setModalOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    showToast('Category deleted');
    fetchCategories();
  };

  // Reorder
  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= categories.length) return;
    const a = categories[index];
    const b = categories[swapIndex];
    setReordering(a.id);
    await Promise.all([
      supabase.from('categories').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('categories').update({ display_order: a.display_order }).eq('id', b.id),
    ]);
    await fetchCategories();
    setReordering(null);
  };

  // Image preview validity
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Categories</h1>
          <p className="text-surface-500 text-sm mt-0.5">Organize your product catalog</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-surface-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <FolderTree className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{categories.length}</p>
            <p className="text-xs text-surface-500">Total Categories</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{totalProducts}</p>
            <p className="text-xs text-surface-500">Total Products</p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search + View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="flex items-center bg-white rounded-xl border border-surface-100 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid' ? 'bg-surface-100 text-surface-900' : 'text-surface-400 hover:text-surface-600',
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'list' ? 'bg-surface-100 text-surface-900' : 'text-surface-400 hover:text-surface-600',
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
            <FolderTree className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mb-1">No categories yet</h3>
          <p className="text-sm text-surface-500 mb-6 max-w-sm">
            Categories help organize your products. Add your first category to get started.
          </p>
          <button onClick={openCreate} className="btn-primary gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add your first category
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-8 h-8 text-surface-300 mb-3" />
          <p className="text-surface-500 text-sm">No categories match &ldquo;{search}&rdquo;</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => {
            const catIndex = categories.findIndex((c) => c.id === cat.id);
            return (
              <div key={cat.id} className="bg-white rounded-2xl border border-surface-100 overflow-hidden group">
                <div className="aspect-video bg-surface-100 relative overflow-hidden">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-surface-300" />
                    </div>
                  )}
                  <span className="badge absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-surface-700 text-xs">
                    {productCounts[cat.id] || 0} {(productCounts[cat.id] || 0) === 1 ? 'product' : 'products'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-surface-900 truncate">{cat.name}</h3>
                      <p className="text-sm text-surface-500 line-clamp-2 mt-1">{cat.description}</p>
                    </div>
                    {/* Reorder buttons */}
                    {!search && (
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => handleReorder(catIndex, 'up')}
                          disabled={catIndex === 0 || reordering === cat.id}
                          className="p-1 rounded hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5 text-surface-500" />
                        </button>
                        <button
                          onClick={() => handleReorder(catIndex, 'down')}
                          disabled={catIndex === categories.length - 1 || reordering === cat.id}
                          className="p-1 rounded hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-surface-500" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={() => openEdit(cat)} className="btn-ghost text-sm gap-1">
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="btn-ghost text-sm gap-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-100 text-xs text-surface-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Description</th>
                <th className="px-4 py-3 font-medium text-center">Products</th>
                <th className="px-4 py-3 font-medium text-center">Order</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.map((cat) => {
                const catIndex = categories.findIndex((c) => c.id === cat.id);
                return (
                  <tr key={cat.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-100 overflow-hidden shrink-0">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageOff className="w-4 h-4 text-surface-300" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-surface-900 truncate">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-surface-500 truncate max-w-xs">{cat.description}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="badge text-xs">{productCounts[cat.id] || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {!search && (
                          <>
                            <button
                              onClick={() => handleReorder(catIndex, 'up')}
                              disabled={catIndex === 0 || reordering === cat.id}
                              className="p-1 rounded hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronUp className="w-3.5 h-3.5 text-surface-500" />
                            </button>
                            <button
                              onClick={() => handleReorder(catIndex, 'down')}
                              disabled={catIndex === categories.length - 1 || reordering === cat.id}
                              className="p-1 rounded hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronDown className="w-3.5 h-3.5 text-surface-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(cat)} className="btn-ghost text-sm gap-1">
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="btn-ghost text-sm gap-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Electronics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="Brief description of this category"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Image URL</label>
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="input-field"
              placeholder="https://example.com/image.jpg"
            />
            {form.image_url && isValidUrl(form.image_url) && (
              <div className="mt-2 w-20 h-20 rounded-lg border border-surface-100 overflow-hidden bg-surface-50">
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Display Order</label>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <button onClick={() => setModalOpen(false)} className="btn-outline text-sm">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? <Spinner size="sm" className="border-white/30 border-t-white" /> : (editId ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
