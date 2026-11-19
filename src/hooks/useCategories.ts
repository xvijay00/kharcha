import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { db } from '../db/dexie';
import { useBusiness } from './useBusiness';
import { getDefaultCategories } from '../lib/business-seeds';
import type { Category, CategoryType } from '../types';

export function useCategories() {
  const { currentBusiness } = useBusiness();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!currentBusiness) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('categories')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('name');

      if (fetchErr) {
        console.warn('Network error loading categories from Supabase, checking Dexie cache:', fetchErr);
        // Fallback to Dexie cache
        const cached = await db.cachedCategories
          .where('business_id')
          .equals(currentBusiness.id)
          .toArray();

        if (cached.length > 0) {
          setCategories(cached);
        } else {
          // If neither is present, use fallback from seed
          const seeded = getDefaultCategories(currentBusiness.business_type);
          const mockCategories: Category[] = [
            ...seeded.income.map((name, i) => ({
              id: `seed-in-${i}`,
              business_id: currentBusiness.id,
              parent_id: null,
              name,
              type: 'income' as CategoryType,
            })),
            ...seeded.expense.map((name, i) => ({
              id: `seed-out-${i}`,
              business_id: currentBusiness.id,
              parent_id: null,
              name,
              type: 'expense' as CategoryType,
            })),
          ];
          setCategories(mockCategories);
        }
      } else if (data) {
        setCategories(data);
        // Update local Dexie cache
        try {
          await db.cachedCategories.where('business_id').equals(currentBusiness.id).delete();
          for (const c of data) {
            await db.cachedCategories.put({
              id: c.id,
              business_id: c.business_id,
              name: c.name,
              type: c.type,
              parent_id: c.parent_id,
            });
          }
        } catch (cErr) {
          console.warn('Failed to cache categories to Dexie:', cErr);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentBusiness]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories]
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const addCategory = async (name: string, type: CategoryType, parentId?: string | null) => {
    if (!currentBusiness) throw new Error('No active business');

    const newCategory = {
      business_id: currentBusiness.id,
      name: name.trim(),
      type,
      parent_id: parentId || null,
    };

    const { data, error: insertErr } = await supabase
      .from('categories')
      .insert(newCategory)
      .select()
      .single();

    if (insertErr) {
      // Optimistic offline insert to local state and Dexie
      const localId = crypto.randomUUID();
      const localCat: Category = {
        id: localId,
        business_id: currentBusiness.id,
        name: name.trim(),
        type,
        parent_id: parentId || null,
      };
      setCategories((prev) => [...prev, localCat]);
      await db.cachedCategories.put(localCat);
      return localCat;
    }

    if (data) {
      setCategories((prev) => [...prev, data]);
      await db.cachedCategories.put(data);
    }
    return data;
  };

  const deleteCategory = async (id: string) => {
    if (!currentBusiness) throw new Error('No active business');

    // First check if any transactions use this category
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      throw new Error(`Cannot delete category: ${count} transactions are associated with it.`);
    }

    const { error: delErr } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (delErr) {
      throw delErr;
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    await db.cachedCategories.delete(id);
  };

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    error,
    addCategory,
    deleteCategory,
    refreshCategories: fetchCategories,
  };
}
