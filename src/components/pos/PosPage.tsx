import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../hooks/useBusiness';
import { useProducts } from '../../hooks/useProducts';
import { useOrders } from '../../hooks/useOrders';
import { useToast } from '../ui/Toast';
import { PrintableInvoice } from './PrintableInvoice';
import { PaymentModeSelector } from '../transactions/PaymentModeSelector';
import { formatCurrency } from '../../lib/utils';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Hotel,
  Receipt,
  FileCheck,
  CheckCircle2,
  User,
  Stethoscope,
  Clock,
  Printer,
} from 'lucide-react';
import type { OrderItem, PaymentMode } from '../../types';

export function PosPage() {
  const { currentBusiness } = useBusiness();
  const { products } = useProducts();
  const { orders, saveOrder, completeBill } = useOrders();
  const { toast } = useToast();

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

  // State
  const [selectedTable, setSelectedTable] = useState<string | null>(
    modules.tables ? 'T-1' : modules.rooms ? 'Room 101' : null
  );
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [lastBilledOrderId, setLastBilledOrderId] = useState<string>('');

  // Pre-defined tables or rooms
  const tableList = modules.tables
    ? ['T-1', 'T-2', 'T-3', 'T-4', 'T-5', 'T-6', 'T-7', 'T-8']
    : modules.rooms
    ? ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 201', 'Room 202']
    : [];

  // Add item to cart
  const addToCart = (product: (typeof products)[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        const nextQty = existing.qty + 1;
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, qty: nextQty, amount: nextQty * i.price }
            : i
        );
      } else {
        const price = Number(product.selling_price);
        return [
          ...prev,
          {
            product_id: product.id,
            name: product.name,
            qty: 1,
            unit: product.unit,
            price,
            amount: price,
            gst_rate: Number(product.gst_rate) || 0,
          },
        ];
      }
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product_id === productId) {
            const nextQty = i.qty + delta;
            return nextQty > 0
              ? { ...i, qty: nextQty, amount: nextQty * i.price }
              : null;
          }
          return i;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  // Calculations
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.amount, 0),
    [cart]
  );

  const { cgst, sgst, totalAmount } = useMemo(() => {
    let taxSum = 0;
    for (const item of cart) {
      if (item.gst_rate > 0) {
        const itemTax = (item.amount * item.gst_rate) / 100;
        taxSum += itemTax;
      }
    }
    const halfTax = taxSum / 2;
    return {
      cgst: halfTax,
      sgst: halfTax,
      totalAmount: subtotal + taxSum,
    };
  }, [cart, subtotal]);

  // Handle KOT (Kitchen Order Ticket)
  const handleSendKOT = async () => {
    if (cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    try {
      const order = await saveOrder({
        table_or_room_no: selectedTable,
        customer_name: customerName || null,
        doctor_name: doctorName || null,
        status: 'kot_sent',
        items: cart,
        subtotal,
        cgst,
        sgst,
        igst: 0,
        total_amount: totalAmount,
      });
      toast.success(`KOT sent to kitchen for ${selectedTable}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'KOT failed';
      toast.error(msg);
    }
  };

  // Handle Complete Bill & Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Add items to cart before billing');
      return;
    }

    try {
      const order = await saveOrder({
        table_or_room_no: selectedTable,
        customer_name: customerName || null,
        doctor_name: doctorName || null,
        status: 'open',
        items: cart,
        subtotal,
        cgst,
        sgst,
        igst: 0,
        total_amount: totalAmount,
      });

      await completeBill(
        order.id,
        cart,
        totalAmount,
        paymentMode,
        customerName || selectedTable || null
      );

      setLastBilledOrderId(order.id);
      setInvoiceModalOpen(true);
      toast.success('Bill generated and cash collected!');
      setCart([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout failed';
      toast.error(msg);
    }
  };

  // Filter products for catalog search
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.slice(0, 15);
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [products, search]);

  return (
    <div className="space-y-4 pb-16 max-w-lg mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">POS Billing Register</h2>
          <p className="text-xs text-gray-500">Quick counter sales & GST invoice</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
          <Receipt className="w-3.5 h-3.5" />
          <span>Active Register</span>
        </div>
      </div>

      {/* Table / Room Selector if Restaurant / Hotel */}
      {tableList.length > 0 && (
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            {modules.tables ? <Utensils className="w-3.5 h-3.5" /> : <Hotel className="w-3.5 h-3.5" />}
            <span>Select {modules.tables ? 'Table' : 'Room'}</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {tableList.map((tbl) => (
              <button
                key={tbl}
                type="button"
                onClick={() => setSelectedTable(tbl)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                  selectedTable === tbl
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Customer / Doctor Info Header */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name (optional)"
              className="w-full pl-8 pr-2 py-2 bg-gray-50 rounded-xl text-xs border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {modules.schedule_h || modules.salt_composition ? (
            <div className="relative">
              <Stethoscope className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Name (Prescription)"
                className="w-full pl-8 pr-2 py-2 bg-gray-50 rounded-xl text-xs border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="text-right flex items-center justify-end px-2 text-xs font-semibold text-gray-400">
              {selectedTable ? `Assigned: ${selectedTable}` : 'Counter Sale'}
            </div>
          )}
        </div>
      </div>

      {/* Item Quick Picker */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or scan barcode..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>

        {/* Product horizontal/grid chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="p-2.5 bg-white rounded-xl border border-gray-100 hover:border-blue-300 text-left transition-all active:scale-95 shadow-sm flex flex-col justify-between"
            >
              <div>
                <p className="font-semibold text-xs text-gray-900 truncate">{p.name}</p>
                <p className="text-[10px] text-gray-400">
                  {p.stock_qty} {p.unit} in stock
                </p>
              </div>
              <p className="text-xs font-bold text-emerald-600 mt-1">
                {formatCurrency(Number(p.selling_price))}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Invoice Summary Drawer */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <span>Bill Items ({cart.length})</span>
          </h3>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            <ShoppingCart className="w-8 h-8 mx-auto mb-1 opacity-30" />
            <span>Tap any product above to add to bill</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-gray-50">
            {cart.map((item) => (
              <div key={item.product_id} className="pt-2 flex items-center justify-between text-xs">
                <div className="max-w-[150px]">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400">
                    ₹{item.price} / {item.unit}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 text-gray-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 text-gray-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="w-16 text-right font-bold text-gray-900">
                    {formatCurrency(item.amount)}
                  </span>

                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="p-1 text-gray-300 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment mode */}
        {cart.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <PaymentModeSelector selected={paymentMode} onChange={setPaymentMode} />
          </div>
        )}

        {/* Bill Calculations */}
        {cart.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {cgst > 0 && (
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>CGST:</span>
                <span>+{formatCurrency(cgst)}</span>
              </div>
            )}
            {sgst > 0 && (
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>SGST:</span>
                <span>+{formatCurrency(sgst)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-gray-900 pt-1 border-t border-gray-200">
              <span>Grand Total:</span>
              <span className="text-blue-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        )}

        {/* POS Action Buttons */}
        <div className="flex gap-2 pt-1">
          {modules.kot && (
            <button
              onClick={handleSendKOT}
              disabled={cart.length === 0}
              className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Utensils className="w-4 h-4" />
              <span>Send KOT</span>
            </button>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Pay {formatCurrency(totalAmount)}</span>
          </button>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      <PrintableInvoice
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        business={currentBusiness}
        orderId={lastBilledOrderId}
        customerName={customerName}
        doctorName={doctorName}
        tableOrRoomNo={selectedTable}
        items={cart}
        subtotal={subtotal}
        cgst={cgst}
        sgst={sgst}
        totalAmount={totalAmount}
        paymentMode={paymentMode}
      />
    </div>
  );
}
