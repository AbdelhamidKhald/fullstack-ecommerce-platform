import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { slugify } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import type { Category } from '../../types';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', image_url: '', display_order: '0' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('display_order');
    setCategories((data as Category[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', description: '', image_url: '', display_order: '0' });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description, image_url: c.image_url, display_order: c.display_order.toString() });
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Categories</h1>
          <p className="text-surface-500 text-sm">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12"><Spinner /></div>
        ) : categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-surface-100 overflow-hidden group">
            <div className="aspect-video bg-surface-100 relative overflow-hidden">
              {cat.image_url && (
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-surface-900">{cat.name}</h3>
              <p className="text-sm text-surface-500 line-clamp-2 mt-1">{cat.description}</p>
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => openEdit(cat)} className="btn-ghost text-sm gap-1">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button onClick={() => handleDelete(cat.id)} className="btn-ghost text-sm gap-1 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[80px] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Display Order</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <button onClick={() => setModalOpen(false)} className="btn-outline text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary text-sm disabled:opacity-50">
              {saving ? <Spinner size="sm" className="border-white/30 border-t-white" /> : (editId ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
