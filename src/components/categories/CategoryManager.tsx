import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../ui/Toast';
import { Plus, Trash2, FolderPlus, Tag, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import type { CategoryType } from '../../types';

export function CategoryManager() {
  const { categories, incomeCategories, expenseCategories, loading, addCategory, deleteCategory } =
    useCategories();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [newCatName, setNewCatName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const activeList = activeTab === 'income' ? incomeCategories : expenseCategories;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    // Check duplicate
    if (activeList.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning(`Category "${trimmed}" already exists.`);
      return;
    }

    try {
      setSubmitting(true);
      await addCategory(trimmed, activeTab);
      toast.success(`Category "${trimmed}" added!`);
      setNewCatName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add category';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await deleteCategory(id);
        toast.success(`Category "${name}" deleted.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not delete category';
        toast.error(msg);
      }
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Category Manager</h2>
        <p className="text-xs text-gray-500">Organize your business revenue & expense heads</p>
      </div>

      {/* Income / Expense Tabs */}
      <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl">
        <button
          onClick={() => setActiveTab('expense')}
          className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'expense'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Expense Categories ({expenseCategories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'income'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Income Categories ({incomeCategories.length})</span>
        </button>
      </div>

      {/* Add Category Form */}
      <form onSubmit={handleAdd} className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder={`Add new ${activeTab} category...`}
            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !newCatName.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>Add</span>
        </button>
      </form>

      {/* Categories List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse h-10 bg-gray-50 rounded-xl" />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-2">
              <FolderPlus className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No categories found</p>
            <p className="text-xs text-gray-400 mt-0.5">Add your first custom category above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeList.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold ${
                      activeTab === 'income'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {cat.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{cat.name}</p>
                    <p className="text-[11px] text-gray-400 capitalize">{cat.type}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-2 text-gray-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
