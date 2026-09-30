import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Flame, Calculator, Sparkles, BookmarkPlus } from 'lucide-react';
import { api } from '../api';

export default function BatchModal({ settings, onClose, onBatchCreated }) {
  const currencySymbol = settings?.currency_symbol || '₹';

  const [batchName, setBatchName] = useState('Lunch Deg #1 - Chicken Dum');
  const [biryaniType, setBiryaniType] = useState('Chicken Dum Biryani');
  const [targetPlates, setTargetPlates] = useState(45);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [templates, setTemplates] = useState([]);

  const [ingredients, setIngredients] = useState([
    { ingredient_name: 'Basmati Rice (Daawat / India Gate)', quantity: 9, unit: 'kg', unit_price: 95 },
    { ingredient_name: 'Fresh Broiler Chicken', quantity: 10, unit: 'kg', unit_price: 160 },
    { ingredient_name: 'Commercial LPG Cooking Gas', quantity: 0.25, unit: 'cylinder', unit_price: 1800 },
    { ingredient_name: 'Pure Desi Ghee & Mustard Oil', quantity: 1.5, unit: 'liter', unit_price: 220 },
    { ingredient_name: 'Biryani Khada Masala, Saffron & Keora', quantity: 1, unit: 'pack', unit_price: 240 },
    { ingredient_name: 'Onions (Barista), Potatoes & Curd', quantity: 4, unit: 'kg', unit_price: 55 },
    { ingredient_name: 'Packaging Boxes & Foil Containers', quantity: 45, unit: 'pcs', unit_price: 6 },
  ]);

  // Load saved shop recipes
  const loadTemplates = async () => {
    try {
      const res = await api.getBatchTemplates();
      setTemplates(res);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Apply recipe preset
  const applyTemplate = (tpl) => {
    setBatchName(tpl.name);
    setBiryaniType(tpl.biryani_type);
    setTargetPlates(tpl.target_plates);
    try {
      const parsed = JSON.parse(tpl.ingredients_json);
      setIngredients(parsed);
    } catch (e) {
      console.error('Failed to parse template ingredients', e);
    }
  };

  // Save current ingredients as custom shop recipe
  const handleSaveAsRecipe = async () => {
    const recipeName = prompt('Enter a name for this custom shop recipe:', `${biryaniType} (${targetPlates} Plates)`);
    if (!recipeName) return;

    try {
      setIsSavingPreset(true);
      await api.createBatchTemplate({
        name: recipeName,
        biryani_type: biryaniType,
        target_plates: Number(targetPlates),
        ingredients_json: JSON.stringify(ingredients),
      });
      setSuccessMsg('Recipe saved to your shop presets!');
      loadTemplates();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to save recipe');
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = field === 'quantity' || field === 'unit_price' ? Number(value) : value;
    setIngredients(updated);
  };

  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      { ingredient_name: '', quantity: 1, unit: 'kg', unit_price: 0 },
    ]);
  };

  const removeIngredientRow = (index) => {
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  // Real-time calculations
  const totalCost = ingredients.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  }, 0);

  const costPerPlate = targetPlates > 0 ? (totalCost / targetPlates).toFixed(2) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (ingredients.length === 0) {
      setErrorMsg('Please specify at least one ingredient/gas cost');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const payload = {
        batch_name: batchName,
        biryani_type: biryaniType,
        target_plates: Number(targetPlates),
        notes: notes.trim() || null,
        ingredients: ingredients.map((ing) => ({
          ingredient_name: ing.ingredient_name,
          quantity: Number(ing.quantity),
          unit: ing.unit,
          unit_price: Number(ing.unit_price),
          total_cost: Number(ing.quantity) * Number(ing.unit_price),
        })),
      };

      await api.createBatch(payload);
      if (onBatchCreated) onBatchCreated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Cook New Biryani Deg / Batch</h2>
              <p className="text-xs text-amber-100">Calculate exact gas, rice, meat & packaging cost per plate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Shop Recipe Presets */}
          {templates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Saved Shop Recipes:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {templates.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyTemplate(p)}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Basic Batch Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Batch / Deg Label</label>
              <input
                type="text"
                required
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g. Lunch Deg #1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Dish Type</label>
              <input
                type="text"
                required
                value={biryaniType}
                onChange={(e) => setBiryaniType(e.target.value)}
                placeholder="e.g. Chicken Dum Biryani"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Expected Plates (Target)</label>
              <input
                type="number"
                min="1"
                required
                value={targetPlates}
                onChange={(e) => setTargetPlates(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Raw Materials & Cooking Cost Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                Raw Materials Consumed in this Pot
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveAsRecipe}
                  disabled={isSavingPreset}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Save as Shop Recipe</span>
                </button>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              <div className="grid grid-cols-12 gap-2 bg-slate-100 p-2 font-bold text-slate-600 text-[11px]">
                <div className="col-span-5">Ingredient / Gas / Packaging</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2 text-right">Rate ({currencySymbol})</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-slate-50">
                  <div className="col-span-5">
                    <input
                      type="text"
                      required
                      placeholder="Ingredient name"
                      value={ing.ingredient_name}
                      onChange={(e) => handleIngredientChange(idx, 'ingredient_name', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                      className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="kg">kg</option>
                      <option value="cylinder">cylinder</option>
                      <option value="liter">liter</option>
                      <option value="pack">pack</option>
                      <option value="pcs">pcs</option>
                      <option value="lump sum">lump sum</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder={`${currencySymbol} Rate`}
                      value={ing.unit_price}
                      onChange={(e) => handleIngredientChange(idx, 'unit_price', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-right"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Per Plate Calculation Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-500 font-medium">Automatic Deg Cost Calculation:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    {currencySymbol}{totalCost.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500">for {targetPlates} plates</span>
                </div>
              </div>
            </div>

            <div className="text-center sm:text-right bg-white px-4 py-2 rounded-xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Cost Per Plate:
              </span>
              <span className="text-2xl font-black text-amber-700 font-mono">
                {currencySymbol}{costPerPlate}
              </span>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Cook Shift (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Cooked by Ustad Karim; Dum duration 45 mins"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {successMsg && (
            <p className="text-emerald-600 font-bold">{successMsg}</p>
          )}

          {errorMsg && (
            <p className="text-red-600 font-semibold">{errorMsg}</p>
          )}

          {/* Action Footer */}
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
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold shadow-md shadow-orange-500/20"
            >
              {isSubmitting ? 'Saving Deg...' : 'Save & Activate Deg'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
