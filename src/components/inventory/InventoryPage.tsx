import React, { useState, useMemo } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useBusiness } from '../../hooks/useBusiness';
import { ProductFormModal } from './ProductFormModal';
import { StockAdjustModal } from './StockAdjustModal';
import { formatCurrency } from '../../lib/utils';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Barcode,
  Layers,
  Calendar,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import type { Product } from '../../types';

export function InventoryPage() {
  const { currentBusiness } = useBusiness();
  const { products, lowStockProducts, expiringSoonBatches, loading, deleteProduct, refreshProducts } =
    useProducts();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'expiring'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);

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

  // Filtered product list
  const filtered = useMemo(() => {
    let list = products;
    if (filter === 'low_stock') {
      list = lowStockProducts;
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.salt_composition && p.salt_composition.toLowerCase().includes(q))
    );
  }, [products, lowStockProducts, filter, search]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete product "${name}" from inventory?`)) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory & Stock</h2>
          <p className="text-xs text-gray-500">Products, stock tracking & alerts</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setFilter(filter === 'low_stock' ? 'all' : 'low_stock')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            filter === 'low_stock'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
              : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 mb-0.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Low Stock</span>
          </div>
          <p className="text-lg font-extrabold text-gray-900">{lowStockProducts.length} items</p>
        </button>

        <button
          onClick={() => setFilter(filter === 'expiring' ? 'all' : 'expiring')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            filter === 'expiring'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-0.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Expiring Soon</span>
          </div>
          <p className="text-lg font-extrabold text-gray-900">
            {expiringSoonBatches.length} batches
          </p>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item name, barcode, or salt..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
      </div>

      {/* Product List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-white rounded-2xl border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No items found</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              {search ? 'Try clearing your search query' : 'Add your first product to catalog'}
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Product</span>
            </button>
          </div>
        ) : (
          filtered.map((prod) => {
            const isLow = Number(prod.stock_qty) <= Number(prod.min_stock_alert);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between hover:border-gray-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-900">{prod.name}</h4>
                      {prod.is_schedule_h && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-800 rounded">
                          Schedule H
                        </span>
                      )}
                    </div>

                    {prod.salt_composition && (
                      <p className="text-xs text-blue-600 mt-0.5 font-medium">
                        {prod.salt_composition}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      {prod.barcode && (
                        <span className="flex items-center gap-0.5 font-mono">
                          <Barcode className="w-3.5 h-3.5" />
                          {prod.barcode}
                        </span>
                      )}
                      <span>•</span>
                      <span>Unit: {prod.unit}</span>
                      {prod.gst_rate > 0 && <span>• GST: {prod.gst_rate}%</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-extrabold text-emerald-600">
                      {formatCurrency(Number(prod.selling_price))}
                    </p>
                    <div
                      className={`text-xs font-bold mt-0.5 px-2 py-0.5 rounded-full inline-block ${
                        isLow
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {prod.stock_qty} {prod.unit}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-50 text-xs">
                  <span className="text-[11px] text-gray-400">
                    Min alert: {prod.min_stock_alert} {prod.unit}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAdjustProduct(prod)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold active:scale-95 transition-all flex items-center gap-1"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Adjust Stock</span>
                    </button>

                    <button
                      onClick={() => handleDelete(prod.id, prod.name)}
                      className="p-1.5 text-gray-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Product Modal */}
      <ProductFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={refreshProducts}
      />

      {/* Adjust Stock Modal */}
      <StockAdjustModal
        product={adjustProduct}
        isOpen={Boolean(adjustProduct)}
        onClose={() => setAdjustProduct(null)}
        onSuccess={refreshProducts}
      />
    </div>
  );
}
