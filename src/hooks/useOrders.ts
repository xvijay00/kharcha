import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useBusiness } from './useBusiness';
import { useAuth } from './useAuth';
import { useOnlineStatus } from './useOnlineStatus';
import { enqueueTransaction } from '../db/sync';
import type { OrderBooking, OrderItem, OrderStatus, PaymentMode, Transaction } from '../types';

export function useOrders() {
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const [orders, setOrders] = useState<OrderBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!currentBusiness) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('orders_bookings')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchErr) {
        console.warn('Network error loading orders:', fetchErr);
      } else if (data) {
        setOrders(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentBusiness]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Create or Update Order/Booking
  const saveOrder = async (
    orderData: Omit<OrderBooking, 'id' | 'business_id' | 'created_at'>,
    existingId?: string
  ): Promise<OrderBooking> => {
    if (!currentBusiness) throw new Error('No active business');

    const payload = {
      ...orderData,
      business_id: currentBusiness.id,
      created_at: new Date().toISOString(),
    };

    if (existingId) {
      // Update
      const { data, error: updateErr } = await supabase
        .from('orders_bookings')
        .update(payload)
        .eq('id', existingId)
        .select()
        .single();

      if (updateErr) throw updateErr;
      setOrders((prev) => prev.map((o) => (o.id === existingId ? data : o)));
      return data;
    } else {
      // Insert
      const { data, error: insertErr } = await supabase
        .from('orders_bookings')
        .insert(payload)
        .select()
        .single();

      if (insertErr) {
        // Fallback local
        const localId = crypto.randomUUID();
        const localOrder: OrderBooking = { ...payload, id: localId };
        setOrders((prev) => [localOrder, ...prev]);
        return localOrder;
      }

      setOrders((prev) => [data, ...prev]);
      return data;
    }
  };

  // Complete & Bill Order (Generates Transaction and closes order)
  const completeBill = async (
    orderId: string,
    items: OrderItem[],
    totalAmount: number,
    paymentMode: PaymentMode,
    customerName?: string | null
  ) => {
    if (!currentBusiness) throw new Error('No active business');

    // 1. Mark order as billed
    await supabase
      .from('orders_bookings')
      .update({ status: 'billed' })
      .eq('id', orderId);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'billed' } : o))
    );

    // 2. Insert into transactions table
    const txPayload: Omit<Transaction, 'id' | 'sync_status'> = {
      business_id: currentBusiness.id,
      type: 'in',
      amount: totalAmount,
      payment_mode: paymentMode,
      category_id: null,
      party_id: null,
      receipt_url: null,
      note: `POS Bill #${orderId.slice(0, 6)} ${customerName ? `(${customerName})` : ''}`,
      created_by: user?.id || 'pos-user',
      created_at: new Date().toISOString(),
    };

    if (isOnline) {
      await supabase.from('transactions').insert({ ...txPayload, sync_status: 'synced' });
    } else {
      await enqueueTransaction(txPayload);
    }
  };

  return {
    orders,
    loading,
    error,
    saveOrder,
    completeBill,
    refreshOrders: fetchOrders,
  };
}
