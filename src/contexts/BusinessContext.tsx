import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { db } from '../db/dexie';
import { useAuth } from './AuthContext';
import type { Business, BusinessFormData, BusinessType } from '../types';

export interface BusinessContextType {
  businesses: Business[];
  currentBusiness: Business | null;
  loading: boolean;
  setCurrentBusiness: (id: string) => void;
  refreshBusinesses: () => Promise<void>;
  createBusiness: (data: BusinessFormData) => Promise<string>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const CURRENT_BIZ_KEY = 'kharcha_current_business_id';

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshBusinesses = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setCurrentBusinessState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Query businesses via membership table
      const { data, error } = await supabase
        .from('business_members')
        .select(`
          business_id,
          role,
          businesses (
            id,
            owner_id,
            name,
            business_type,
            gstin,
            address,
            settings,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.warn('Network error fetching businesses from Supabase, checking offline cache:', error);
        // Fallback to Dexie cached businesses
        const cached = await db.cachedBusinesses.toArray();
        if (cached.length > 0) {
          const bizList: Business[] = cached.map((b) => ({
            id: b.id,
            owner_id: b.owner_id,
            name: b.name,
            business_type: b.business_type as BusinessType,
            gstin: null,
            address: null,
            settings: {
              modules: {
                inventory: true,
                weight_billing: false,
                wastage: false,
                tables: false,
                rooms: false,
                kot: false,
                imei: false,
                repair_jobs: false,
                batches: false,
                schedule_h: false,
                salt_composition: false,
              },
            },
            created_at: new Date().toISOString(),
          }));
          setBusinesses(bizList);
          handleActiveSelection(bizList);
        }
      } else if (data) {
        const bizList: Business[] = [];
        for (const item of data) {
          if (item.businesses) {
            const b = item.businesses as unknown as Business;
            bizList.push(b);
          }
        }
        setBusinesses(bizList);

        // Update Dexie cache for offline use
        try {
          await db.cachedBusinesses.clear();
          for (const b of bizList) {
            await db.cachedBusinesses.put({
              id: b.id,
              owner_id: b.owner_id,
              name: b.name,
              business_type: b.business_type as BusinessType,
            });
          }
        } catch (cacheErr) {
          console.warn('Failed to update Dexie cached businesses:', cacheErr);
        }

        handleActiveSelection(bizList);
      }
    } catch (err) {
      console.error('Error in refreshBusinesses:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleActiveSelection = (bizList: Business[]) => {
    if (bizList.length === 0) {
      setCurrentBusinessState(null);
      localStorage.removeItem(CURRENT_BIZ_KEY);
      return;
    }

    const savedId = localStorage.getItem(CURRENT_BIZ_KEY);
    const matched = bizList.find((b) => b.id === savedId);
    if (matched) {
      setCurrentBusinessState(matched);
    } else {
      setCurrentBusinessState(bizList[0]);
      localStorage.setItem(CURRENT_BIZ_KEY, bizList[0].id);
    }
  };

  useEffect(() => {
    refreshBusinesses();
  }, [refreshBusinesses]);

  const setCurrentBusiness = (id: string) => {
    const matched = businesses.find((b) => b.id === id);
    if (matched) {
      setCurrentBusinessState(matched);
      localStorage.setItem(CURRENT_BIZ_KEY, matched.id);
    }
  };

  const createBusiness = async (data: BusinessFormData): Promise<string> => {
    if (!user) throw new Error('Must be logged in to create a business');

    const { data: newId, error } = await supabase.rpc('create_business_with_defaults', {
      p_name: data.name,
      p_business_type: data.business_type,
      p_gstin: data.gstin || null,
      p_address: data.address || null,
    });

    if (error) {
      console.error('RPC create_business_with_defaults failed:', error);
      throw error;
    }

    await refreshBusinesses();
    if (newId) {
      setCurrentBusiness(newId as string);
      return newId as string;
    }
    return '';
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        currentBusiness,
        loading,
        setCurrentBusiness,
        refreshBusinesses,
        createBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextType {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
