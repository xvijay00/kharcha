import React from 'react';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { Printer, CheckCircle2 } from 'lucide-react';
import type { OrderItem, Business } from '../../types';

interface PrintableInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business | null;
  orderId: string;
  customerName?: string | null;
  doctorName?: string | null;
  tableOrRoomNo?: string | null;
  items: OrderItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  paymentMode: string;
}

export function PrintableInvoice({
  isOpen,
  onClose,
  business,
  orderId,
  customerName,
  doctorName,
  tableOrRoomNo,
  items,
  subtotal,
  cgst,
  sgst,
  totalAmount,
  paymentMode,
}: PrintableInvoiceProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tax Invoice / Receipt" size="md">
      <div className="space-y-4">
        {/* Printable Area */}
        <div id="printable-receipt" className="bg-white p-4 border border-gray-200 rounded-xl font-mono text-xs text-gray-800 space-y-3">
          {/* Shop Header */}
          <div className="text-center pb-2 border-b border-dashed border-gray-300">
            <h3 className="text-base font-extrabold uppercase font-sans tracking-tight text-gray-900">
              {business?.name || 'Kharcha Shop'}
            </h3>
            {business?.address && <p className="text-[10px] text-gray-500 mt-0.5">{business.address}</p>}
            {business?.gstin && (
              <p className="text-[10px] font-bold text-gray-600 mt-0.5">GSTIN: {business.gstin}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5">
              {formatDate(new Date())} {formatTime(new Date())}
            </p>
          </div>

          {/* Meta details */}
          <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-gray-300">
            <div className="flex justify-between">
              <span>Bill No: #{orderId.slice(0, 8).toUpperCase()}</span>
              <span>Mode: {paymentMode.toUpperCase()}</span>
            </div>
            {customerName && <p>Customer: {customerName}</p>}
            {tableOrRoomNo && <p>Table/Room: {tableOrRoomNo}</p>}
            {doctorName && <p>Prescription/Doctor: Dr. {doctorName}</p>}
          </div>

          {/* Items Table */}
          <div className="space-y-1.5 pb-2 border-b border-dashed border-gray-300">
            <div className="grid grid-cols-12 text-[10px] font-bold text-gray-500 pb-1">
              <span className="col-span-6">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-2 text-right">RATE</span>
              <span className="col-span-2 text-right">AMT</span>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 text-[11px]">
                <span className="col-span-6 font-semibold truncate">{it.name}</span>
                <span className="col-span-2 text-center">
                  {it.qty} {it.unit}
                </span>
                <span className="col-span-2 text-right">₹{it.price}</span>
                <span className="col-span-2 text-right font-bold">₹{it.amount}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs pt-1">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
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
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-gray-400 pt-2">
            <p>Thank you for your visit!</p>
            <p>Powered by Kharcha PWA</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 h-12 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice / Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
