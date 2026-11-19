import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useProducts } from '../../hooks/useProducts';
import { useToast } from '../ui/Toast';
import { Plus, Minus, RotateCcw, Loader2 } from 'lucide-react';
import type { Product } from '../../types';

interface StockAdjustModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StockAdjustModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: StockAdjustModalProps) {
  const { updateStock } = useProducts();
  const { toast } = useToast();

  const [mode, setMode] = useState<'add' | 'wastage' | 'set'>('add');
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(qty);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      await updateStock(product.id, val, mode);
      toast.success(
        mode === 'add'
          ? `Added +${val} ${product.unit} to stock`
          : mode === 'wastage'
          ? `Recorded -${val} ${product.unit} wastage`
          : `Stock adjusted to ${val} ${product.unit}`
      );
      setQty('');
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stock adjustment failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust Stock: ${product.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Current In Stock:</span>
          <span className="font-extrabold text-sm text-gray-900">
            {product.stock_qty} {product.unit}
          </span>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('add')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              mode === 'add' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stock</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('wastage')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              mode === 'wastage' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Wastage</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('set')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              mode === 'set' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Set Exact</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            {mode === 'add'
              ? `Quantity to Add (${product.unit})`
              : mode === 'wastage'
              ? `Spoilage / Damaged Quantity (${product.unit})`
              : `New Total Stock Count (${product.unit})`}
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder={`Enter ${product.unit}`}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !qty}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Update Stock</span>}
        </button>
      </form>
    </Modal>
  );
}
