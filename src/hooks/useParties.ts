import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { db } from '../db/dexie';
import { useBusiness } from './useBusiness';
import { useAuth } from './useAuth';
import { useOnlineStatus } from './useOnlineStatus';
import { enqueueTransaction } from '../db/sync';
import type { Party, PartyType, PaymentMode, Transaction } from '../types';

export function useParties(filterType?: PartyType) {
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParties = useCallback(async () => {
    if (!currentBusiness) {
      setParties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('parties')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('name');

      if (filterType) {
        query = query.eq('type', filterType);
      }

      const { data, error: fetchErr } = await query;

      if (fetchErr) {
        console.warn('Network error loading parties, loading from Dexie:', fetchErr);
        let cached = await db.cachedParties
          .where('business_id')
          .equals(currentBusiness.id)
          .toArray();

        if (filterType) {
          cached = cached.filter((p) => p.type === filterType);
        }
        setParties(cached as Party[]);
      } else if (data) {
        setParties(data);
        // Cache to Dexie
        try {
          await db.cachedParties.where('business_id').equals(currentBusiness.id).delete();
          for (const p of data) {
            await db.cachedParties.put(p);
          }
        } catch (cErr) {
          console.warn('Failed to cache parties to Dexie:', cErr);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching parties';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, filterType]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  // Add party
  const addParty = async (
    name: string,
    phone: string | null,
    type: PartyType,
    openingBalance: number = 0
  ): Promise<Party> => {
    if (!currentBusiness) throw new Error('No active business');

    const partyPayload = {
      business_id: currentBusiness.id,
      name: name.trim(),
      phone: phone?.trim() || null,
      type,
      current_balance: openingBalance,
    };

    if (!isOnline) {
      const localId = crypto.randomUUID();
      const localParty: Party = {
        ...partyPayload,
        id: localId,
      };
      setParties((prev) => [...prev, localParty]);
      await db.cachedParties.put(localParty);
      return localParty;
    }

    const { data, error: insertErr } = await supabase
      .from('parties')
      .insert(partyPayload)
      .select()
      .single();

    if (insertErr) throw insertErr;

    setParties((prev) => [...prev, data]);
    await db.cachedParties.put(data);

    // If opening balance > 0, record initial transaction
    if (openingBalance > 0) {
      const txType = type === 'customer' ? 'in' : 'out';
      await recordPartyEntry(
        data.id,
        type === 'customer' ? 'give' : 'got',
        openingBalance,
        'cash',
        'Opening Balance'
      );
    }

    return data;
  };

  // Record Udhaar (give) or Jama (got)
  const recordPartyEntry = async (
    partyId: string,
    action: 'give' | 'got',
    amount: number,
    paymentMode: PaymentMode,
    note?: string
  ) => {
    if (!currentBusiness) throw new Error('No active business');
    const targetParty = parties.find((p) => p.id === partyId);
    if (!targetParty) throw new Error('Party not found');

    const userId = user?.id || 'offline-user';
    const nowISO = new Date().toISOString();

    // Determine balance delta:
    // Customer: 'give' (Udhaar diya) -> balance increases (+ve = customer owes shop)
    //           'got' (Paisa mila)   -> balance decreases
    // Supplier: 'give' (Paisa diya)  -> balance decreases (-ve or 0)
    //           'got' (Maal liya)    -> balance increases (+ve = shop owes supplier)
    let newBalance = Number(targetParty.current_balance);
    let txType: 'in' | 'out';

    if (targetParty.type === 'customer') {
      if (action === 'give') {
        newBalance += amount;
        txType = 'out'; // Goods/credit given out
      } else {
        newBalance -= amount;
        txType = 'in'; // Money collected in
      }
    } else {
      // Supplier
      if (action === 'give') {
        newBalance -= amount; // Paid supplier
        txType = 'out';
      } else {
        newBalance += amount; // Material received on credit
        txType = 'in';
      }
    }

    // 1. Update party balance
    setParties((prev) =>
      prev.map((p) => (p.id === partyId ? { ...p, current_balance: newBalance } : p))
    );

    if (isOnline) {
      await supabase
        .from('parties')
        .update({ current_balance: newBalance })
        .eq('id', partyId);
    }
    await db.cachedParties.update(partyId, { current_balance: newBalance });

    // 2. Insert transaction record
    const txPayload: Omit<Transaction, 'id' | 'sync_status'> = {
      business_id: currentBusiness.id,
      type: txType,
      amount,
      payment_mode: paymentMode,
      category_id: null,
      party_id: partyId,
      receipt_url: null,
      note: note || (action === 'give' ? 'Udhaar / Credit' : 'Payment Received'),
      created_by: userId,
      created_at: nowISO,
    };

    if (!isOnline) {
      await enqueueTransaction(txPayload);
    } else {
      await supabase.from('transactions').insert({ ...txPayload, sync_status: 'synced' });
    }
  };

  const deleteParty = async (id: string) => {
    if (!currentBusiness) throw new Error('No active business');

    if (isOnline) {
      const { error: delErr } = await supabase.from('parties').delete().eq('id', id);
      if (delErr) throw delErr;
    }

    setParties((prev) => prev.filter((p) => p.id !== id));
    await db.cachedParties.delete(id);
  };

  // WhatsApp reminder generator
  const getWhatsAppReminderUrl = (party: Party): string => {
    if (!party.phone) return '';
    const cleanPhone = party.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const shopName = currentBusiness?.name || 'Hamari Dukan';
    const amount = Math.abs(party.current_balance);

    const message = encodeURIComponent(
      `Namaste ${party.name} ji,\n\nYeh ${shopName} ki taraf se reminder hai. Aapka kul baki hisaab ₹${amount} hai. Kripya samay par bhugtan karein.\n\nDhanyawad,\n${shopName}`
    );

    return `https://wa.me/${phoneWithCountry}?text=${message}`;
  };

  return {
    parties,
    loading,
    error,
    addParty,
    recordPartyEntry,
    deleteParty,
    getWhatsAppReminderUrl,
    refreshParties: fetchParties,
  };
}
