import React from 'react';
import { Printer, X, CheckCircle, Phone, MapPin } from 'lucide-react';

export default function ReceiptModal({ order, settings, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = settings?.currency_symbol || '₹';
  const shopName = settings?.shop_name || 'Shahi Biryani Darbar';
  const tagline = settings?.tagline || 'Authentic Dum Biryani & Kebabs';
  const address = settings?.address || 'Shop #12, Food Street Market';
  const phone = settings?.phone || '+91 98765 43210';
  const fssaiOrGst = settings?.fssai_or_gst || '';
  const receiptFooter = settings?.receipt_footer || 'Thank you for dining with us! Please visit again 🍛';

  const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:max-w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white text-center relative print:hidden">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 mb-2">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-wide">Order Confirmed!</h2>
          <p className="text-amber-100 text-xs mt-0.5">Order #{order.order_number}</p>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 space-y-4 print:p-2 print:text-black">
          {/* Dynamic Restaurant Brand */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <h3 className="font-bold text-base tracking-wider uppercase font-sans text-amber-700 print:text-black">
              {shopName}
            </h3>
            <p className="text-[11px] text-slate-500 print:text-black">{tagline}</p>
            {address && (
              <p className="text-[10px] text-slate-400 print:text-black mt-0.5">{address}</p>
            )}
            {phone && (
              <p className="text-[10px] text-slate-400 print:text-black">Ph: {phone}</p>
            )}
            {fssaiOrGst && (
              <p className="text-[9px] text-slate-400 print:text-black font-semibold mt-0.5">{fssaiOrGst}</p>
            )}
          </div>

          {/* Order Details Header */}
          <div className="grid grid-cols-2 gap-1 text-[11px] pb-2 border-b border-slate-200">
            <div>
              <span className="text-slate-400">Order No: </span>
              <span className="font-bold">{order.order_number}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Type: </span>
              <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 print:bg-transparent print:p-0">
                {order.order_type}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Date: </span>
              <span>{formattedDate}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">{order.table_or_token ? 'Table/Token:' : 'Pay:'} </span>
              <span className="font-bold">{order.table_or_token || order.payment_method}</span>
            </div>
            {order.staff_name && (
              <div className="col-span-2 text-slate-500 text-[10px]">
                <span>Billed By: </span>
                <span className="font-semibold text-slate-700 print:text-black">{order.staff_name}</span>
              </div>
            )}
            {order.customer_name && (
              <div className="col-span-2 text-slate-600">
                <span>Customer: </span>
                <span className="font-semibold">{order.customer_name} {order.customer_phone ? `(${order.customer_phone})` : ''}</span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold border-b border-slate-300 pb-1 text-[11px]">
              <span>ITEM</span>
              <span className="w-10 text-center">QTY</span>
              <span className="w-16 text-right">TOTAL</span>
            </div>

            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px] py-0.5">
                <span className="truncate pr-2 font-sans font-medium text-slate-700 print:text-black">
                  {item.item_name}
                </span>
                <span className="w-10 text-center text-slate-500 font-bold">x{item.quantity}</span>
                <span className="w-16 text-right font-semibold">{currencySymbol}{item.total_price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Summary / Total */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1">
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Subtotal:</span>
              <span>{currencySymbol}{order.subtotal?.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 text-[11px]">
                <span>Discount:</span>
                <span>-{currencySymbol}{order.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1.5 print:text-black">
              <span>GRAND TOTAL:</span>
              <span className="text-base text-amber-700 print:text-black">{currencySymbol}{order.total_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Paid via:</span>
              <span className="font-bold text-slate-700 uppercase print:text-black">{order.payment_method}</span>
            </div>
          </div>

          {/* Custom Footer note */}
          <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 print:text-black">
            <p>{receiptFooter}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
