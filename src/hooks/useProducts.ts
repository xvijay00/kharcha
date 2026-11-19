import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { db } from '../db/dexie';
import { useBusiness } from './useBusiness';
import { useOnlineStatus } from './useOnlineStatus';
import type { Product, ProductBatchSerial } from '../types';

export function useProducts() {
  const { currentBusiness } = useBusiness();
  const { isOnline } = useOnlineStatus();

  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<ProductBatchSerial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!currentBusiness) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('name');

      if (fetchErr) {
        console.warn('Network error loading products, using Dexie cache:', fetchErr);
        const cached = await db.cachedProducts
          .where('business_id')
          .equals(currentBusiness.id)
          .toArray();

        // Convert Dexie cache back to Product array
        const converted: Product[] = cached.map((c) => ({
          id: c.id,
          business_id: c.business_id,
          name: c.name,
          sku: c.sku,
          barcode: c.barcode,
          hsn_code: null,
          gst_rate: 0,
          unit: c.unit,
          purchase_price: 0,
          selling_price: c.selling_price,
          stock_qty: c.stock_qty,
          min_stock_alert: 5,
          track_batches: false,
          track_imei: false,
          salt_composition: null,
          is_schedule_h: false,
        }));
        setProducts(converted);
      } else if (data) {
        setProducts(data);
        // Cache to Dexie
        try {
          await db.cachedProducts.where('business_id').equals(currentBusiness.id).delete();
          for (const p of data) {
            await db.cachedProducts.put({
              id: p.id,
              business_id: p.business_id,
              name: p.name,
              barcode: p.barcode,
              sku: p.sku,
              selling_price: Number(p.selling_price),
              stock_qty: Number(p.stock_qty),
              unit: p.unit,
            });
          }
        } catch (cErr) {
          console.warn('Failed to cache products to Dexie:', cErr);
        }
      }

      // Also fetch batches if batch/IMEI tracking enabled
      const { data: batchData } = await supabase
        .from('product_batches_serials')
        .select('*')
        .eq('business_id', currentBusiness.id);

      if (batchData) setBatches(batchData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentBusiness]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (
    productData: Omit<Product, 'id' | 'business_id'>,
    batchOrImeiList?: Array<{ batch_or_imei: string; expiry_date?: string; mfg_date?: string }>
  ): Promise<Product> => {
    if (!currentBusiness) throw new Error('No active business');

    const payload = {
      ...productData,
      business_id: currentBusiness.id,
    };

    if (!isOnline) {
      const localId = crypto.randomUUID();
      const localProd: Product = { ...payload, id: localId };
      setProducts((prev) => [...prev, localProd]);
      await db.cachedProducts.put({
        id: localId,
        business_id: currentBusiness.id,
        name: localProd.name,
        barcode: localProd.barcode,
        sku: localProd.sku,
        selling_price: Number(localProd.selling_price),
        stock_qty: Number(localProd.stock_qty),
        unit: localProd.unit,
      });
      return localProd;
    }

    const { data, error: insertErr } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Insert batches / IMEIs if provided
    if (batchOrImeiList && batchOrImeiList.length > 0) {
      const batchPayloads = batchOrImeiList.map((b) => ({
        business_id: currentBusiness.id,
        product_id: data.id,
        batch_or_imei: b.batch_or_imei,
        expiry_date: b.expiry_date || null,
        mfg_date: b.mfg_date || null,
        status: 'in_stock' as const,
      }));

      await supabase.from('product_batches_serials').insert(batchPayloads);
    }

    setProducts((prev) => [...prev, data]);
    return data;
  };

  const updateStock = async (productId: string, newQty: number, adjustmentType: 'add' | 'wastage' | 'set') => {
    if (!currentBusiness) throw new Error('No active business');

    const target = products.find((p) => p.id === productId);
    if (!target) return;

    let finalQty = newQty;
    if (adjustmentType === 'add') finalQty = Number(target.stock_qty) + newQty;
    if (adjustmentType === 'wastage') finalQty = Math.max(0, Number(target.stock_qty) - newQty);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock_qty: finalQty } : p))
    );

    if (isOnline) {
      await supabase
        .from('products')
        .update({ stock_qty: finalQty })
        .eq('id', productId);
    }
    await db.cachedProducts.update(productId, { stock_qty: finalQty });
  };

  const deleteProduct = async (id: string) => {
    if (!currentBusiness) throw new Error('No active business');

    if (isOnline) {
      await supabase.from('products').delete().eq('id', id);
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    await db.cachedProducts.delete(id);
  };

  // Low stock products filter
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => Number(p.stock_qty) <= Number(p.min_stock_alert));
  }, [products]);

  // Expiring soon batches (within 30 days)
  const expiringSoonBatches = useMemo(() => {
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    return batches.filter((b) => {
      if (!b.expiry_date || b.status !== 'in_stock') return false;
      const exp = new Date(b.expiry_date);
      return exp >= today && exp <= in30Days;
    });
  }, [batches]);

  return {
    products,
    batches,
    lowStockProducts,
    expiringSoonBatches,
    loading,
    error,
    addProduct,
    updateStock,
    deleteProduct,
    refreshProducts: fetchProducts,
  };
}
