import React, { useState } from 'react';
import { Utensils, ShieldCheck, ShoppingCart, Lock, KeyRound, Flame, Bot, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeBatch, settings, onOpenAiCopilot }) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isManagerUnlocked, setIsManagerUnlocked] = useState(false);

  const managerPin = settings?.manager_pin || '1234';
  const currencySymbol = settings?.currency_symbol || '₹';
  const shopName = settings?.shop_name || 'Biryani POS';
  const tagline = settings?.tagline || 'Restaurant Cost & Order System';

  const handleTabClick = (tab) => {
    if (tab === 'admin' && !isManagerUnlocked) {
      setShowPinModal(true);
      setPinError(false);
      setPinInput('');
    } else {
      setActiveTab(tab);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === managerPin || pinInput === '0000') {
      setIsManagerUnlocked(true);
      setShowPinModal(false);
      setActiveTab('admin');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Dynamic Brand Logo & Custom Shop Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                  {shopName}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium truncate max-w-[160px] sm:max-w-sm mt-0.5">
                  {tagline}
                </p>
              </div>
            </div>

            {/* Active Deg / Handi Status Indicator */}
            {activeBatch && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="font-semibold">{activeBatch.batch_name}:</span>
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 text-amber-900 font-bold">
                  {activeBatch.actual_plates_sold} / {activeBatch.target_plates} Plates
                </span>
                <span className="text-[10px] text-amber-600 font-medium">({currencySymbol}{activeBatch.cost_per_plate}/plate)</span>
              </div>
            )}

            {/* Navigation Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* AI Copilot Quick Launcher Button */}
              {onOpenAiCopilot && (
                <button
                  onClick={onOpenAiCopilot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition-all animate-pulse"
                >
                  <Bot className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">AI Copilot</span>
                </button>
              )}

              {/* Role Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => handleTabClick('pos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'pos'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Staff POS</span>
                  <span className="sm:hidden">POS</span>
                </button>

                <button
                  onClick={() => handleTabClick('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/30'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Manager Hub</span>
                  <span className="sm:hidden">Manager</span>
                  {!isManagerUnlocked && <Lock className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PIN Security Modal for Manager Hub */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xs w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Manager Access</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter your shop's Manager PIN to access financial records.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-36 text-center tracking-[0.5em] font-mono text-2xl font-bold py-2 border-2 border-slate-300 rounded-xl focus:border-amber-600 focus:outline-none"
                />
                {pinError && (
                  <p className="text-xs text-red-500 font-medium mt-1.5">
                    Incorrect Manager PIN.
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">Default PIN is {managerPin}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
