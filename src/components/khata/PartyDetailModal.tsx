import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { useParties } from '../../hooks/useParties';
import { useTransactions } from '../../hooks/useTransactions';
import { useToast } from '../ui/Toast';
import { formatCurrency, formatTime, formatDate } from '../../lib/utils';
import {
  Phone,
  MessageCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Loader2,
  FileText,
  IndianRupee,
} from 'lucide-react';
import type { Party, PaymentMode } from '../../types';

interface PartyDetailModalProps {
  party: Party | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function PartyDetailModal({
  party,
  isOpen,
  onClose,
  onUpdated,
}: PartyDetailModalProps) {
  const { recordPartyEntry, deleteParty, getWhatsAppReminderUrl } = useParties();
  const { transactions } = useTransactions();
  const { toast } = useToast();

  const [actionType, setActionType] = useState<'give' | 'got' | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!party) return null;

  // Filter transactions for this specific party
  const partyTransactions = transactions.filter((t) => t.party_id === party.id);

  const isCustomer = party.type === 'customer';
  const balance = Number(party.current_balance);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      await recordPartyEntry(party.id, actionType!, val, paymentMode, note);
      toast.success(
        actionType === 'give'
          ? `Udhaar ₹${val} recorded`
          : `Payment ₹${val} received`
      );
      setActionType(null);
      setAmount('');
      setNote('');
      onUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Entry failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${party.name}'s account?`)) {
      try {
        await deleteParty(party.id);
        toast.success('Account deleted');
        onClose();
        onUpdated?.();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Delete failed';
        toast.error(msg);
      }
    }
  };

  const whatsappUrl = getWhatsAppReminderUrl(party);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={party.name} size="lg">
      <div className="space-y-4">
        {/* Profile Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                {isCustomer ? 'Customer' : 'Supplier'}
              </span>
              {party.phone && (
                <span className="text-xs text-blue-100 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {party.phone}
                </span>
              )}
            </div>
            <p className="text-2xl font-extrabold mt-2 tracking-tight">
              {formatCurrency(Math.abs(balance))}
            </p>
            <p className="text-xs text-blue-100 mt-0.5 font-medium">
              {balance > 0
                ? isCustomer
                  ? 'Aapko lena hai (You will get)'
                  : 'Aapko dena hai (You will pay)'
                : balance < 0
                ? 'Advance payment'
                : 'Hisab Barabar (Settled)'}
            </p>
          </div>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>

        {/* Action Buttons: Give Udhaar / Got Jama */}
        {actionType === null ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActionType('give')}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{isCustomer ? 'Udhaar Diya (Gave)' : 'Paisa Diya (Paid)'}</span>
            </button>
            <button
              onClick={() => setActionType('got')}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{isCustomer ? 'Paisa Mila (Got)' : 'Maal Aaya (Received)'}</span>
            </button>
          </div>
        ) : (
          /* Entry Form */
          <form
            onSubmit={handleRecord}
            className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-700 uppercase tracking-wider">
                {actionType === 'give' ? 'Recording Udhaar (Give)' : 'Recording Payment (Got)'}
              </span>
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>

            <div className="relative">
              <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['cash', 'upi', 'bank'] as PaymentMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 rounded-lg border font-semibold capitalize ${
                    paymentMode === mode
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Remark / Item description (optional)"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={submitting || !amount}
              className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
                actionType === 'give' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Entry</span>}
            </button>
          </form>
        )}

        {/* Ledger Passbook Entries */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Ledger Statement ({partyTransactions.length} entries)
          </p>

          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-56 overflow-y-auto shadow-sm">
            {partyTransactions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                <FileText className="w-5 h-5 mx-auto mb-1 opacity-50" />
                No past entries with this account
              </div>
            ) : (
              partyTransactions.map((tx) => (
                <div key={tx.id} className="p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-gray-800">{tx.note || 'Khata Transaction'}</p>
                    <p className="text-[10px] text-gray-400">
                      {formatDate(tx.created_at)} • {formatTime(tx.created_at)} • {tx.payment_mode.toUpperCase()}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${
                      tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'in' ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Party Action */}
        <div className="pt-2 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleDelete}
            className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 px-2 py-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
