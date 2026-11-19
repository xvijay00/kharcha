import React, { useState, useMemo } from 'react';
import { useParties } from '../../hooks/useParties';
import { AddPartyModal } from './AddPartyModal';
import { PartyDetailModal } from './PartyDetailModal';
import { formatCurrency, getInitials } from '../../lib/utils';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
} from 'lucide-react';
import type { Party, PartyType } from '../../types';

export function KhataPage() {
  const [activeTab, setActiveTab] = useState<PartyType>('customer');
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const { parties, loading, refreshParties, getWhatsAppReminderUrl } = useParties(activeTab);

  // Compute aggregate totals
  const totals = useMemo(() => {
    let toReceive = 0; // Customer owes
    let toPay = 0;     // Shop owes supplier

    for (const p of parties) {
      const bal = Number(p.current_balance);
      if (p.type === 'customer') {
        if (bal > 0) toReceive += bal;
      } else {
        if (bal > 0) toPay += bal;
      }
    }

    return { toReceive, toPay };
  }, [parties]);

  // Client search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return parties;
    const q = search.toLowerCase();
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q))
    );
  }, [parties, search]);

  return (
    <div className="space-y-4 pb-12 max-w-lg mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Khata (Credit Ledger)</h2>
          <p className="text-xs text-gray-500">Customer & Supplier Udhaar-Jama hisab</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Aggregate Balance Banner */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>You Will Get (Lena)</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-700">
            {formatCurrency(totals.toReceive)}
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5 text-rose-800 text-xs font-bold uppercase tracking-wider mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>You Will Pay (Dena)</span>
          </div>
          <p className="text-xl font-extrabold text-rose-700">
            {formatCurrency(totals.toPay)}
          </p>
        </div>
      </div>

      {/* Customer vs Supplier Tabs */}
      <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('customer')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'customer'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Customers ({parties.filter((p) => p.type === 'customer').length})
        </button>
        <button
          onClick={() => setActiveTab('supplier')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'supplier'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Suppliers ({parties.filter((p) => p.type === 'supplier').length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab === 'customer' ? 'customers' : 'suppliers'} by name or phone...`}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
      </div>

      {/* Party List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-gray-50 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No {activeTab}s registered</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              {search ? 'Try a different search term' : 'Add your first customer to track their udhaar'}
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add {activeTab === 'customer' ? 'Customer' : 'Supplier'}</span>
            </button>
          </div>
        ) : (
          filtered.map((party) => {
            const bal = Number(party.current_balance);
            const isCustomer = party.type === 'customer';
            const whatsappUrl = getWhatsAppReminderUrl(party);

            return (
              <div
                key={party.id}
                onClick={() => setSelectedParty(party)}
                className="p-3.5 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(party.name)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{party.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      {party.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{party.phone}</span>
                        </span>
                      ) : (
                        <span>No phone</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={`font-extrabold text-sm ${
                        bal > 0
                          ? isCustomer
                            ? 'text-rose-600'
                            : 'text-rose-600'
                          : bal < 0
                          ? 'text-emerald-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {formatCurrency(Math.abs(bal))}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {bal > 0 ? (isCustomer ? 'Due / Udhaar' : 'Payable') : bal < 0 ? 'Advance' : 'Settled'}
                    </p>
                  </div>

                  {whatsappUrl && bal > 0 && isCustomer && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}

                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Party Modal */}
      <AddPartyModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        defaultType={activeTab}
        onSuccess={refreshParties}
      />

      {/* Party Detail & Statement Modal */}
      <PartyDetailModal
        party={selectedParty}
        isOpen={Boolean(selectedParty)}
        onClose={() => setSelectedParty(null)}
        onUpdated={refreshParties}
      />
    </div>
  );
}
