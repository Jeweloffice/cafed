import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { api } from '../api';

const ROLES = ['Cashier', 'Head Chef / Ustad', 'Waiter / Server', 'Manager', 'Helper / Cleaner', 'Delivery Rider'];

export default function StaffModal({ staff, settings, onClose, onStaffSaved }) {
  const isEditing = Boolean(staff);
  const currencySymbol = settings?.currency_symbol || '₹';

  const [name, setName] = useState(staff?.name || '');
  const [role, setRole] = useState(staff?.role || 'Cashier');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [dailyWage, setDailyWage] = useState(staff?.daily_wage || '');
  const [isActive, setIsActive] = useState(staff?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter staff name');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const payload = {
        name: name.trim(),
        role,
        phone: phone.trim() || null,
        daily_wage: Number(dailyWage || 0),
        is_active: isActive,
      };

      if (isEditing) {
        await api.updateStaff(staff.id, payload);
      } else {
        await api.createStaff(payload);
      }

      if (onStaffSaved) onStaffSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserPlus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <p className="text-xs text-slate-400">Manage cashiers, cooks, and waiters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Staff Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma, Ustad Karim"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Role / Job Title</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Daily Wage ({currencySymbol})</label>
              <input
                type="number"
                min="0"
                placeholder="500"
                value={dailyWage}
                onChange={(e) => setDailyWage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
            <input
              type="text"
              placeholder="+91 98765 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="font-semibold text-slate-700">Active Staff Member (Can bill orders)</span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Staff' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
