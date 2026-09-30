import React, { useState, useMemo } from 'react';
import { 
  Plus, Minus, Trash2, Search, ShoppingBag, Utensils, 
  CreditCard, Smartphone, Banknote, Clock, CheckCircle2,
  X, RefreshCw, AlertCircle, UserCheck
} from 'lucide-react';
import { api } from '../api';
import ReceiptModal from './ReceiptModal';

export default function PosView({ menuItems, activeBatch, settings, staffList = [], onOrderCreated }) {
  const currencySymbol = settings?.currency_symbol || '₹';

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Dine-in');
  const [tableOrToken, setTableOrToken] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [showRecentOrders, setShowRecentOrders] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract categories dynamically from menu items
  const categories = useMemo(() => {
    const cats = ['All'];
    menuItems.forEach((item) => {
      if (item.category && !cats.includes(item.category)) {
        cats.push(item.category);
      }
    });
    return cats;
  }, [menuItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          item_name: item.name,
          unit_price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menu_item_id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.menu_item_id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setTableOrToken('');
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - Number(discount || 0));
  }, [subtotal, discount]);

  // Place order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setErrorMsg('Please select at least one item');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const staffObj = staffList.find((s) => String(s.id) === String(selectedStaffId));

      const orderPayload = {
        order_type: orderType,
        table_or_token: tableOrToken.trim() || (orderType === 'Dine-in' ? 'Counter' : 'Takeaway'),
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        staff_id: staffObj ? staffObj.id : null,
        staff_name: staffObj ? `${staffObj.name} (${staffObj.role})` : null,
        payment_method: paymentMethod,
        discount: Number(discount || 0),
        notes: notes.trim() || null,
        items: cart.map((item) => ({
          menu_item_id: item.menu_item_id,
          item_name: item.item_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
        })),
      };

      const created = await api.createOrder(orderPayload);
      clearCart();
      setSelectedReceiptOrder(created);
      if (onOrderCreated) onOrderCreated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const orders = await api.getOrders(20);
      setRecentOrders(orders);
      setShowRecentOrders(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.cancelOrder(orderId);
      fetchRecentOrders();
      if (onOrderCreated) onOrderCreated();
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Banner on Mobile */}
      {activeBatch && (
        <div className="md:hidden mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold text-amber-900">{activeBatch.batch_name}</span>
            <p className="text-[11px] text-amber-700">Cost: {currencySymbol}{activeBatch.cost_per_plate}/plate</p>
          </div>
          <div className="font-mono bg-amber-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
            {activeBatch.actual_plates_sold} / {activeBatch.target_plates} Plates
          </div>
        </div>
      )}

      {/* POS Grid & Cart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Menu Items Selection (Cols: 7 or 8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dishes, drinks, sides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>

              <button
                onClick={fetchRecentOrders}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Recent Bills</span>
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat === 'All' ? '🔥 All Items' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredItems.map((item) => {
              const inCartItem = cart.find((i) => i.menu_item_id === item.id);
              const qtyInCart = inCartItem ? inCartItem.quantity : 0;

              return (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`group relative bg-white border rounded-2xl p-3 sm:p-4 text-left cursor-pointer transition-all duration-150 select-none flex flex-col justify-between hover:shadow-md hover:border-amber-400 active:scale-[0.98] ${
                    qtyInCart > 0 ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  {qtyInCart > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                      {qtyInCart}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
                      <span className="uppercase tracking-wider font-semibold text-amber-700/80">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-amber-700 transition-colors">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {currencySymbol}{item.price}
                    </span>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-amber-100 group-hover:bg-amber-600 group-hover:text-white text-amber-700 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Billing Cart */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sticky top-20 flex flex-col max-h-[calc(100vh-6rem)]">
          {/* Order Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-slate-900 text-base">Current Order</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cashier / Staff Selection */}
          {staffList.length > 0 && (
            <div className="py-2 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Billed By:</span>
              </span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">Counter / General</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Order Type Selector */}
          <div className="grid grid-cols-3 gap-1.5 py-2.5 border-b border-slate-100">
            {['Dine-in', 'Takeaway', 'Delivery'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                  orderType === type
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 py-2 border-b border-slate-100">
            <input
              type="text"
              placeholder={orderType === 'Dine-in' ? 'Table No. (e.g. 4)' : 'Token / Customer #'}
              value={tableOrToken}
              onChange={(e) => setTableOrToken(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Cust. Phone (opt)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-2 space-y-2 min-h-[130px] max-h-[200px]">
            {cart.length === 0 ? (
              <div className="text-center py-7 text-slate-400">
                <Utensils className="w-8 h-8 mx-auto mb-1 opacity-40" />
                <p className="text-xs">No items selected yet</p>
                <p className="text-[11px] text-slate-400">Tap menu items to add to order</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.menu_item_id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-amber-50/50 transition-colors text-xs"
                >
                  <div className="flex-1 pr-2 truncate">
                    <span className="font-semibold text-slate-800 block truncate">{item.item_name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{currencySymbol}{item.unit_price} each</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-slate-800 font-mono">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="w-14 text-right font-bold text-slate-900 font-mono">
                      {currencySymbol}{item.unit_price * item.quantity}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.menu_item_id)}
                      className="p-1 text-slate-400 hover:text-red-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2.5 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Payment Mode
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'Cash'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'Card'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
            </div>
          </div>

          {/* Bill Calculation */}
          <div className="pt-2.5 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Discount ({currencySymbol}):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-20 text-right px-2 py-0.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
              <span>Total Payable:</span>
              <span className="text-amber-700 font-mono">{currencySymbol}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-2 p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Punch Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || isSubmitting}
            className={`mt-3 w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
              cart.length === 0 || isSubmitting
                ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-[0.99] shadow-orange-500/25'
            }`}
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Punch Order • {currencySymbol}{grandTotal.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Recent Orders Modal */}
      {showRecentOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recent Bills & Orders</h3>
                <p className="text-xs text-slate-500">View slips, reprint, or cancel mistaken orders</p>
              </div>
              <button
                onClick={() => setShowRecentOrders(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {recentOrders.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-400">No orders recorded yet.</p>
              ) : (
                recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{ord.order_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          ord.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ord.status}
                        </span>
                        <span className="text-slate-400">({ord.order_type})</span>
                        {ord.staff_name && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {ord.staff_name}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {new Date(ord.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • Paid via {ord.payment_method}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm text-slate-900 font-mono">
                        {currencySymbol}{ord.total_amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => setSelectedReceiptOrder(ord)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-medium"
                      >
                        Receipt
                      </button>
                      {ord.status === 'Completed' && (
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          settings={settings}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}
