import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PosView from './components/PosView';
import AdminView from './components/AdminView';
import AiCopilot from './components/AiCopilot';
import BatchModal from './components/BatchModal';
import { api } from './api';
import { AlertCircle, RefreshCw, Bot } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' or 'admin'
  const [menuItems, setMenuItems] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  const [settings, setSettings] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global AI Copilot Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [showBatchModalFromAi, setShowBatchModalFromAi] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [menu, batches, shopSettings, staff] = await Promise.all([
        api.getMenu(false),
        api.getBatches(),
        api.getSettings(),
        api.getStaff(true),
      ]);
      setMenuItems(menu);
      setSettings(shopSettings);
      setStaffList(staff);
      const active = batches.find((b) => b.status === 'Active') || null;
      setActiveBatch(active);
    } catch (err) {
      console.error('Failed to load application data:', err);
      setError('Cannot connect to Biryani backend server. Ensure FastAPI is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-500 selection:text-white relative">
      {/* Top Navigation with dynamic branding & AI Copilot launcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeBatch={activeBatch}
        settings={settings}
        onOpenAiCopilot={() => setShowAiModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {isLoading && menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-sm font-medium text-slate-600">Loading {settings?.shop_name || 'Biryani POS'}...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-red-800">Connection Error</h3>
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Retry Connection
            </button>
          </div>
        ) : activeTab === 'pos' ? (
          <PosView
            menuItems={menuItems.filter((i) => i.is_active)}
            activeBatch={activeBatch}
            settings={settings}
            staffList={staffList}
            onOrderCreated={loadData}
          />
        ) : (
          <AdminView
            menuItems={menuItems}
            settings={settings}
            onDataChanged={loadData}
          />
        )}
      </main>

      {/* Floating AI Copilot Trigger Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          onClick={() => setShowAiModal(true)}
          className="group flex items-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95"
        >
          <Bot className="w-5 h-5 text-amber-300 animate-bounce" />
          <span>Ask AI Copilot</span>
        </button>
      </div>

      {/* Global AI Copilot Modal Overlay */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 print:hidden animate-in fade-in duration-150">
          <div className="max-w-2xl w-full">
            <AiCopilot
              settings={settings}
              onClose={() => setShowAiModal(false)}
              onOpenBatchModal={() => {
                setShowAiModal(false);
                setShowBatchModalFromAi(true);
              }}
              onSwitchTab={(subtab) => {
                setShowAiModal(false);
                setActiveTab('admin');
              }}
            />
          </div>
        </div>
      )}

      {/* Batch Modal triggered from AI recipe scaler */}
      {showBatchModalFromAi && (
        <BatchModal
          settings={settings}
          onClose={() => setShowBatchModalFromAi(false)}
          onBatchCreated={loadData}
        />
      )}

      {/* Footer */}
      <footer className="py-3 px-4 border-t border-slate-200 bg-white text-center text-[11px] text-slate-400 print:hidden">
        <span>🍗 {settings?.shop_name || 'Biryani POS'} • Restaurant POS & AI Cost Intelligence System • Made with React & Python</span>
      </footer>
    </div>
  );
}
