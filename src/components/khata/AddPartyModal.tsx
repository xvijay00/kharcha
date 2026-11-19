import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useParties } from '../../hooks/useParties';
import { useToast } from '../ui/Toast';
import { User, Phone, IndianRupee, Loader2 } from 'lucide-react';
import type { PartyType } from '../../types';

interface AddPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: PartyType;
  onSuccess?: () => void;
}

export function AddPartyModal({
  isOpen,
  onClose,
  defaultType = 'customer',
  onSuccess,
}: AddPartyModalProps) {
  const { addParty } = useParties();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<PartyType>(defaultType);
  const [openingBalance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter name');
      return;
    }

    try {
      setLoading(true);
      const parsedBalance = openingBalance ? parseFloat(openingBalance) : 0;
      await addParty(name, phone || null, type, parsedBalance);
      toast.success(`${type === 'customer' ? 'Customer' : 'Supplier'} added!`);
      setName('');
      setPhone('');
      setOpeningBalance('');
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add party';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Khata Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setType('customer')}
            className={`py-2 rounded-lg transition-all ${
              type === 'customer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Customer (Grahak)
          </button>
          <button
            type="button"
            onClick={() => setType('supplier')}
            className={`py-2 rounded-lg transition-all ${
              type === 'supplier'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Supplier (Vyapari)
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ramesh Kumar, Gupta Traders"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Phone / Mobile (for WhatsApp reminders)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 9876543210"
              maxLength={10}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Old Balance / Opening Balance (₹) (Optional)
          </label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="number"
              step="any"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
        </button>
      </form>
    </Modal>
  );
}
