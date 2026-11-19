import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useProducts } from '../../hooks/useProducts';
import { useBusiness } from '../../hooks/useBusiness';
import { useToast } from '../ui/Toast';
import { getDefaultUnits } from '../../lib/business-seeds';
import {
  Package,
  Barcode,
  IndianRupee,
  Layers,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProductFormModal({ isOpen, onClose, onSuccess }: ProductFormModalProps) {
  const { currentBusiness } = useBusiness();
  const { addProduct } = useProducts();
  const { toast } = useToast();

  const businessType = currentBusiness?.business_type || 'grocery';
  const modules = currentBusiness?.settings?.modules || {
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
  };

  const defaultUnits = getDefaultUnits(businessType);

  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstRate, setGstRate] = useState<number>(0);
  const [unit, setUnit] = useState<string>(defaultUnits[0] || 'pcs');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('5');

  // Medical specific
  const [saltComposition, setSaltComposition] = useState('');
  const [isScheduleH, setIsScheduleH] = useState(false);

  // Batches / IMEIs
  const [batchList, setBatchList] = useState<
    Array<{ batch_or_imei: string; expiry_date?: string; mfg_date?: string }>
  >([]);
  const [newBatchCode, setNewBatchCode] = useState('');
  const [newExpiry, setNewExpiry] = useState('');

  const [loading, setLoading] = useState(false);

  const handleAddBatch = () => {
    if (!newBatchCode.trim()) return;
    setBatchList((prev) => [
      ...prev,
      {
        batch_or_imei: newBatchCode.trim(),
        expiry_date: newExpiry || undefined,
      },
    ]);
    setNewBatchCode('');
    setNewExpiry('');
  };

  const handleRemoveBatch = (index: number) => {
    setBatchList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const sPrice = parseFloat(sellingPrice);
    if (isNaN(sPrice) || sPrice < 0) {
      toast.error('Please enter a valid selling price');
      return;
    }

    try {
      setLoading(true);
      await addProduct(
        {
          name: name.trim(),
          barcode: barcode.trim() || null,
          sku: sku.trim() || null,
          hsn_code: hsnCode.trim() || null,
          gst_rate: Number(gstRate) || 0,
          unit,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : 0,
          selling_price: sPrice,
          stock_qty: stockQty ? parseFloat(stockQty) : 0,
          min_stock_alert: minStockAlert ? parseFloat(minStockAlert) : 0,
          track_batches: modules.batches,
          track_imei: modules.imei,
          salt_composition: modules.salt_composition ? saltComposition || null : null,
          is_schedule_h: modules.schedule_h ? isScheduleH : false,
        },
        batchList.length > 0 ? batchList : undefined
      );

      toast.success(`Product "${name}" added to inventory!`);
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add product';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Item / Product" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Item Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Basmati Rice 1kg, Paracetamol 500mg, iPhone 15"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Barcode / EAN
              </label>
              <div className="relative">
                <Barcode className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan or enter code"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-semibold"
              >
                {defaultUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-3">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Pricing & Stock Levels
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Current Stock Qty
              </label>
              <input
                type="number"
                step="any"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Low Stock Alert At
              </label>
              <input
                type="number"
                step="any"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                placeholder="5"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-rose-600 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="e.g., 3004"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Medical Specific Fields */}
        {modules.salt_composition && (
          <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-3">
            <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              Pharmacy & Drug Details
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Salt Composition / Generic Name
              </label>
              <input
                type="text"
                value={saltComposition}
                onChange={(e) => setSaltComposition(e.target.value)}
                placeholder="e.g., Paracetamol IP 500mg + Caffeine 30mg"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {modules.schedule_h && (
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isScheduleH}
                  onChange={(e) => setIsScheduleH(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Schedule H / Prescription Required Drug
                </span>
              </label>
            )}
          </div>
        )}

        {/* Batch / IMEI Entry Section */}
        {(modules.batches || modules.imei) && (
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-3">
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              {modules.imei ? 'IMEI / Serial Numbers' : 'Batch Numbers & Expiry'}
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newBatchCode}
                onChange={(e) => setNewBatchCode(e.target.value)}
                placeholder={modules.imei ? 'Enter 15-digit IMEI' : 'Batch No. (e.g., BT-2024)'}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {modules.batches && (
                <input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}
              <button
                type="button"
                onClick={handleAddBatch}
                className="px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {batchList.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {batchList.map((b, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-xs"
                  >
                    <span className="font-mono font-semibold text-gray-800">{b.batch_or_imei}</span>
                    {b.expiry_date && (
                      <span className="text-[11px] text-gray-500">Exp: {b.expiry_date}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveBatch(idx)}
                      className="text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save to Inventory</span>}
        </button>
      </form>
    </Modal>
  );
}
