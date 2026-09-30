import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Flame, Utensils, 
  Receipt, Plus, RefreshCw, Calendar, PieChart, Layers, 
  Clock, CheckCircle, Trash2, Edit2, AlertTriangle, ShieldCheck,
  Settings, Users, UserPlus, Store, KeyRound, AlertOctagon,
  Sparkles, Save
} from 'lucide-react';
import { api } from '../api';
import BatchModal from './BatchModal';
import ExpenseModal from './ExpenseModal';
import MenuItemModal from './MenuItemModal';
import StaffModal from './StaffModal';

export default function AdminView({ menuItems, settings, onDataChanged }) {
  const currencySymbol = settings?.currency_symbol || '₹';

  const [activeSubTab, setActiveSubTab] = useState('pnl'); // 'pnl', 'batches', 'expenses', 'menu', 'settings'
  const [period, setPeriod] = useState('today');

  // Data states
  const [pnl, setPnl] = useState(null);
  const [plateBreakdown, setPlateBreakdown] = useState(null);
  const [batches, setBatches] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [batchTemplates, setBatchTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Shop Settings Form State
  const [shopForm, setShopForm] = useState({
    shop_name: settings?.shop_name || '',
    tagline: settings?.tagline || '',
    phone: settings?.phone || '',
    address: settings?.address || '',
    fssai_or_gst: settings?.fssai_or_gst || '',
    currency_symbol: settings?.currency_symbol || '₹',
    manager_pin: settings?.manager_pin || '1234',
    receipt_footer: settings?.receipt_footer || '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState('');

  // Modals
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Sync shop form when settings prop changes
  useEffect(() => {
    if (settings) {
      setShopForm({
        shop_name: settings.shop_name || '',
        tagline: settings.tagline || '',
        phone: settings.phone || '',
        address: settings.address || '',
        fssai_or_gst: settings.fssai_or_gst || '',
        currency_symbol: settings.currency_symbol || '₹',
        manager_pin: settings.manager_pin || '1234',
        receipt_footer: settings.receipt_footer || '',
      });
    }
  }, [settings]);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [pnlRes, breakdownRes, batchesRes, expensesRes, staffRes, templatesRes] = await Promise.all([
        api.getPnL(period),
        api.getPlateBreakdown(),
        api.getBatches(),
        api.getExpenses(),
        api.getStaff(false),
        api.getBatchTemplates(),
      ]);
      setPnl(pnlRes);
      setPlateBreakdown(breakdownRes);
      setBatches(batchesRes);
      setExpenses(expensesRes);
      setStaffList(staffRes);
      setBatchTemplates(templatesRes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [period]);

  const handleBatchStatus = async (batchId, newStatus) => {
    try {
      await api.updateBatch(batchId, { status: newStatus });
      fetchAdminData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to update batch');
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm('Delete this cooking batch record?')) return;
    try {
      await api.deleteBatch(batchId);
      fetchAdminData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete batch');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense entry?')) return;
    try {
      await api.deleteExpense(expenseId);
      fetchAdminData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm('Remove this menu item from POS?')) return;
    try {
      await api.deleteMenuItem(itemId);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await api.deleteStaff(staffId);
      fetchAdminData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete staff');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this saved recipe template?')) return;
    try {
      await api.deleteBatchTemplate(templateId);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete template');
    }
  };

  const handleSaveShopSettings = async (e) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      await api.updateSettings(shopForm);
      setSettingsSuccessMsg('Shop settings and profile updated successfully!');
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSettingsSuccessMsg(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetDemoData = async () => {
    const confirmation = prompt(
      'WARNING: This will wipe all orders, batches, and expenses so a new shop starts at Day 1 with 0 records.\nType "RESET" to confirm:'
    );
    if (confirmation !== 'RESET') return;

    try {
      await api.resetShopData(false);
      alert('All demo orders, batches, and expenses have been wiped! Clean store ready.');
      fetchAdminData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to reset data');
    }
  };

  const isProfitable = pnl && pnl.net_profit >= 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Manager Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {settings?.shop_name || 'Biryani Shop'} • Manager Hub
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time sales, batch ingredient costs, cooking gas usage, staff, and shop customization.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all"
          >
            <Flame className="w-4 h-4" />
            <span>+ Cook New Deg</span>
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>+ Add Expense</span>
          </button>

          <button
            onClick={fetchAdminData}
            title="Refresh Numbers"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none">
        {[
          { id: 'pnl', label: '📊 Financial P&L & Margins' },
          { id: 'batches', label: '🍲 Deg & Batch Cooking' },
          { id: 'expenses', label: '💸 Expense Tracker' },
          { id: 'menu', label: '🍛 Menu & Pricing' },
          { id: 'settings', label: '⚙️ Shop Profile & Staff' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all ${
              activeSubTab === tab.id
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: FINANCIAL P&L & ANALYTICS */}
      {activeSubTab === 'pnl' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl max-w-md">
            {[
              { id: 'today', label: 'Today (Live)' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all_time', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  period === p.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Orders Revenue</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                  {pnl?.total_orders || 0} Bills
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {currencySymbol}{pnl?.total_revenue?.toLocaleString('en-IN') || '0.00'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Avg Order: {currencySymbol}{pnl?.average_order_value || '0.00'}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Cooking Batches (COGS)</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 font-bold">
                  Deg Costs
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {currencySymbol}{pnl?.batch_cogs?.toLocaleString('en-IN') || '0.00'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Meat, Basmati Rice, Ghee & Spices
                </p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Gas & Operational Expenses</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold">
                  Overheads
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {currencySymbol}{pnl?.general_expenses?.toLocaleString('en-IN') || '0.00'}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>Gas consumed: {currencySymbol}{pnl?.gas_expenses || 0}</span>
                </p>
              </div>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${
              isProfitable
                ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-emerald-300'
                : 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-red-500/10 border-rose-300'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={isProfitable ? 'text-emerald-800' : 'text-rose-800'}>
                  {isProfitable ? 'NET PROFIT' : 'NET LOSS'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  isProfitable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {pnl?.net_profit_margin}% Margin
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  {isProfitable ? (
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-rose-600" />
                  )}
                  <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    isProfitable ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {currencySymbol}{Math.abs(pnl?.net_profit || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Gross Profit: {currencySymbol}{pnl?.gross_profit?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Cost-Per-Plate Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>Average Cost Per Plate Breakdown</span>
                  </h3>
                  <p className="text-xs text-slate-500">Based on recently logged Deg cooking batches</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Avg Plate Cost
                  </span>
                  <span className="text-lg font-black text-amber-600 font-mono">
                    {currencySymbol}{plateBreakdown?.average_cost_per_plate || '0.00'}
                  </span>
                </div>
              </div>

              {plateBreakdown?.ingredients?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No cooking batches recorded yet. Click "+ Cook New Deg" to start tracking.
                </p>
              ) : (
                <div className="space-y-3 pt-2">
                  {plateBreakdown?.ingredients?.map((ing, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{ing.name}</span>
                        <div className="space-x-2 font-mono">
                          <span className="text-slate-400">({ing.percentage}%)</span>
                          <span className="font-bold text-slate-900">{currencySymbol}{ing.cost_per_plate_share} / plate</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, ing.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span>Biryani Shop Business Strategy Check</span>
                </div>
                <ul className="mt-3 space-y-2.5 text-xs text-amber-900/90 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-700">1. Target Margin:</span>
                    <span>For Biryani outlets, your target Gross Margin should be between <strong>45% to 60%</strong>. If your plate cost is {currencySymbol}82, selling at {currencySymbol}160 gives a healthy 48.7% margin.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-700">2. Commercial LPG Gas:</span>
                    <span>A 19kg commercial LPG cylinder typically yields 3 to 4 big Degs (approx {currencySymbol}450-{currencySymbol}600 gas cost per Deg).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-700">3. Waste & Unsold Stock:</span>
                    <span>Check your Deg plates sold counter daily before closing. Leftovers can be repacked as combos or discounted on takeaway.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center justify-between text-xs text-amber-800">
                <span>Active Degs Cooking: <strong>{batches.filter(b => b.status === 'Active').length}</strong></span>
                <span>Plates Sold in Period: <strong>{pnl?.total_plates_sold || 0}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DEG & BATCH COOKING */}
      {activeSubTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Deg / Cooking Batches History
            </h3>
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Cook New Deg</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((batch) => {
              const platesSold = batch.actual_plates_sold || 0;
              const target = batch.target_plates || 1;
              const percentSold = Math.min(100, Math.round((platesSold / target) * 100));

              return (
                <div
                  key={batch.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{batch.batch_name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          batch.status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {batch.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(batch.cooked_at).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })} • {batch.biryani_type}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Cost Per Plate
                      </span>
                      <span className="font-mono font-black text-amber-600 text-lg">
                        {currencySymbol}{batch.cost_per_plate}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                      <span>Plates Sold: <strong>{platesSold} / {target}</strong></span>
                      <span className="font-mono">{percentSold}% Sold</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          percentSold >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1">
                    <span className="font-bold text-slate-700 block">Ingredients & Costs:</span>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {batch.ingredients?.map((ing, i) => (
                        <div key={i} className="flex justify-between border-b border-slate-200/60 pb-0.5">
                          <span className="truncate pr-1">{ing.ingredient_name}:</span>
                          <span className="font-mono font-bold text-slate-800 shrink-0">{currencySymbol}{ing.total_cost}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-1 font-bold text-slate-900 border-t border-slate-200 text-xs">
                      <span>Total Deg Cost:</span>
                      <span className="font-mono text-amber-700">{currencySymbol}{batch.total_cost.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {batch.status === 'Active' ? (
                      <button
                        onClick={() => handleBatchStatus(batch.id, 'Completed')}
                        className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
                      >
                        ✓ Mark Deg Finished
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Finished</span>
                    )}

                    <button
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EXPENSE TRACKER */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Shop Operational Expenses Log
              </h3>
              <p className="text-xs text-slate-500">Track gas refills, staff daily wages, rent & supplies</p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Record Expense</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Amount ({currencySymbol})</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No expenses logged yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          {new Date(exp.expense_date).toLocaleDateString('en-IN', {
                            month: 'short', day: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{exp.title}</span>
                          {exp.notes && <span className="text-[11px] text-slate-400">{exp.notes}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/50">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{exp.payment_method}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          {currencySymbol}{exp.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MENU & PRICING */}
      {activeSubTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Menu Items & Selling Prices
              </h3>
              <p className="text-xs text-slate-500">Update rates, add dishes, and review profit margins</p>
            </div>
            <button
              onClick={() => {
                setEditingMenuItem(null);
                setShowMenuModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Dish</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Est. Cost</th>
                    <th className="py-3 px-4 text-right">Gross Margin</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {menuItems.map((item) => {
                    const margin = item.price > 0 && item.cost_price > 0
                      ? Math.round(((item.price - item.cost_price) / item.price) * 100)
                      : null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          {item.description && (
                            <span className="text-[11px] text-slate-400 line-clamp-1">{item.description}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{item.category}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          {currencySymbol}{item.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {currencySymbol}{item.cost_price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {margin !== null ? (
                            <span className="font-bold text-emerald-600">
                              {margin}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.is_active ? 'Available' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingMenuItem(item);
                                setShowMenuModal(true);
                              }}
                              className="p-1 text-slate-500 hover:text-amber-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(item.id)}
                              className="p-1 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SHOP PROFILE, STAFF & CUSTOMIZATION */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          {/* Section 1: Shop Profile & Branding Form */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Shop Identity & Branding</h3>
                  <p className="text-xs text-slate-500">Customize the shop name, address, currency, and receipt header for your buyer</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveShopSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop / Restaurant Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aminia Biryani & Kebabs"
                    value={shopForm.shop_name}
                    onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tagline / Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. Authentic Kolkata Dum Biryani Since 1995"
                    value={shopForm.tagline}
                    onChange={(e) => setShopForm({ ...shopForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={shopForm.phone}
                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN / FSSAI License #</label>
                  <input
                    type="text"
                    placeholder="FSSAI: 12345678901234"
                    value={shopForm.fssai_or_gst}
                    onChange={(e) => setShopForm({ ...shopForm, fssai_or_gst: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    required
                    placeholder="₹, $, ৳, AED"
                    value={shopForm.currency_symbol}
                    onChange={(e) => setShopForm({ ...shopForm, currency_symbol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop Address (Printed on bill)</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 Park Circus, Near 7-Point, Kolkata - 700017"
                    value={shopForm.address}
                    onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thermal Receipt Footer Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Thank you for dining with us! Wi-Fi: biryani123"
                    value={shopForm.receipt_footer}
                    onChange={(e) => setShopForm({ ...shopForm, receipt_footer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Manager Security PIN */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">Manager Access PIN</span>
                    <span className="text-[11px] text-slate-500">Security PIN required to open this manager hub</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="1234"
                    value={shopForm.manager_pin}
                    onChange={(e) => setShopForm({ ...shopForm, manager_pin: e.target.value })}
                    className="w-24 text-center px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {settingsSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{settingsSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/25 flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Saving Settings...' : 'Save Shop Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Staff Management */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Shop Staff & Roles</h3>
                  <p className="text-xs text-slate-500">Add cashiers, master chefs, and waiters for order attribution</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingStaff(null);
                  setShowStaffModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>+ Add Staff</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {staffList.map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{member.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        member.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    {member.phone && (
                      <p className="text-xs text-slate-500 mt-1">Ph: {member.phone}</p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Daily Wage: <strong className="font-mono text-slate-800">{currencySymbol}{member.daily_wage}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => {
                        setEditingStaff(member);
                        setShowStaffModal(true);
                      }}
                      className="text-xs text-slate-600 hover:text-amber-600 font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Saved Deg Recipe Presets */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Custom Deg Recipe Templates</h3>
                <p className="text-xs text-slate-500">Saved cooking presets that populate ingredients automatically when cooking a Deg</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {batchTemplates.map((tpl) => (
                <div key={tpl.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{tpl.name}</span>
                    <span className="text-xs text-slate-500">
                      Target: <strong>{tpl.target_plates} plates</strong> • {tpl.biryani_type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500"
                    title="Delete Recipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Clean Slate for New Shop Onboarding */}
          <div className="p-5 sm:p-6 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              <span>Sell / Handover to New Shop Owner (Clean Slate)</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              When selling this software to a new Biryani shop client, click below to wipe all demo test orders, batches, and expenses. The custom menu items, staff, and shop branding will be preserved so the buyer begins on Day 1 with 0 orders.
            </p>
            <div>
              <button
                type="button"
                onClick={handleResetDemoData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Clear Demo Orders & Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showBatchModal && (
        <BatchModal
          settings={settings}
          onClose={() => setShowBatchModal(false)}
          onBatchCreated={() => {
            fetchAdminData();
            if (onDataChanged) onDataChanged();
          }}
        />
      )}

      {showExpenseModal && (
        <ExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onExpenseCreated={() => {
            fetchAdminData();
            if (onDataChanged) onDataChanged();
          }}
        />
      )}

      {showMenuModal && (
        <MenuItemModal
          item={editingMenuItem}
          onClose={() => setShowMenuModal(false)}
          onItemSaved={() => {
            fetchAdminData();
            if (onDataChanged) onDataChanged();
          }}
        />
      )}

      {showStaffModal && (
        <StaffModal
          staff={editingStaff}
          settings={settings}
          onClose={() => setShowStaffModal(false)}
          onStaffSaved={() => {
            fetchAdminData();
            if (onDataChanged) onDataChanged();
          }}
        />
      )}
    </div>
  );
}
