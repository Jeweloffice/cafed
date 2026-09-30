import React, { useState } from 'react';
import { X, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { api } from '../api';

const CATEGORIES = ['Biryani', 'Starters & Gravies', 'Desserts', 'Beverages'];

export default function MenuItemModal({ item, onClose, onItemSaved }) {
  const isEditing = Boolean(item);
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || 'Biryani');
  const [price, setPrice] = useState(item?.price || '');
  const [costPrice, setCostPrice] = useState(item?.cost_price || '');
  const [description, setDescription] = useState(item?.description || '');
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price || Number(price) <= 0) {
      setErrorMsg('Please enter a valid item name and selling price');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const payload = {
        name: name.trim(),
        category,
        price: Number(price),
        cost_price: Number(costPrice || 0),
        description: description.trim() || null,
        is_active: isActive,
      };

      if (isEditing) {
        await api.updateMenuItem(item.id, payload);
      } else {
        await api.createMenuItem(payload);
      }

      if (onItemSaved) onItemSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <p className="text-xs text-amber-100">Set customer price and kitchen cost</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mutton Biryani (Special), Chicken Chaap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="₹ 160"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Estimated Cost Price (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="₹ 75 (for margin)"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">Available in POS</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Served with 1 pc chicken, 1 egg, and spiced aloo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none resize-none"
            />
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
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-sm"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
