import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, AlertTriangle, CheckCircle, 
  Flame, Receipt, Utensils, Calendar, X, RefreshCw, 
  ArrowRight, FileText, ChevronRight
} from 'lucide-react';
import VoiceInput from './VoiceInput';

export default function AiCopilot({ settings, onOpenBatchModal, onSwitchTab, onClose }) {
  const currencySymbol = settings?.currency_symbol || '₹';

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 🍛 Welcome to ${settings?.shop_name || 'Biryani'} AI Copilot!\n\nI am your **AI Restaurant Business & Kitchen Intelligence Partner**.\n\nAsk me anything or tap one of the quick actions below:`,
      action: null,
      data: null,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [logSuccessMsg, setLogSuccessMsg] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendQuery = async (queryText) => {
    const q = queryText || inputText;
    if (!q.trim() || isLoading) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) throw new Error('Failed to get AI response');
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          type: data.type,
          data: data.data,
          action: data.action,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Sorry, I could not process that request. Please try again.',
          type: 'error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLogExpenses = async (items) => {
    if (!items || items.length === 0) return;
    try {
      const res = await fetch('/api/ai/auto-log-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, payment_method: 'Cash' }),
      });
      if (!res.ok) throw new Error('Failed to auto-log expenses');
      setLogSuccessMsg('✅ Line items successfully saved to Shop Expenses!');
      setTimeout(() => setLogSuccessMsg(''), 4000);
    } catch (e) {
      alert('Error auto-logging expenses');
    }
  };

  const quickPrompts = [
    {
      label: '📊 Today\'s Profit & Loss',
      query: 'Analyze today\'s sales, expenses, and net profit margin.',
    },
    {
      label: '🌅 Morning Prep Briefing',
      query: 'Give me the morning prep briefing and recommend how many plates to cook today to avoid waste.',
    },
    {
      label: '👨‍🍳 Scale Recipe to 75 Plates',
      query: 'Scale Chicken Dum Biryani recipe to 75 plates with exact ingredients and dum timing.',
    },
    {
      label: '🧾 Check Supplier Invoice',
      query: 'Check this grocery bill for price spikes:\nChicken 15kg @ 195\nBasmati rice 20kg @ 95\nCommercial Gas 1 cyl 1800\nOnion 10kg @ 72',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col h-[600px] max-h-[85vh] overflow-hidden">
      {/* Copilot Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                {settings?.shop_name || 'Biryani'} AI Copilot
              </h3>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/20 uppercase tracking-wider text-amber-100">
                RAG v1.2
              </span>
            </div>
            <p className="text-[11px] text-amber-100 font-medium">
              Grounded in live shop sales, batch costs & recipes
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Prompts Carousel */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200/80 overflow-x-auto flex gap-1.5 scrollbar-none">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(p.query)}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-xl border border-amber-200/80 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 text-[11px] font-semibold whitespace-nowrap shadow-2xs transition-colors flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-2xs ${
                m.role === 'user'
                  ? 'bg-amber-600 text-white font-medium rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none font-sans'
              }`}
            >
              {/* Markdown Content Formatter */}
              <div className="prose prose-xs max-w-none text-xs space-y-1.5 whitespace-pre-wrap">
                {m.content}
              </div>

              {/* Action Buttons for AI Responses */}
              {m.type === 'invoice_scanner' && m.data?.items && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAutoLogExpenses(m.data.items)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Auto-Log {m.data.items.length} Items to Expenses</span>
                  </button>
                </div>
              )}

              {m.type === 'recipe_scaler' && onOpenBatchModal && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap gap-2">
                  <button
                    onClick={onOpenBatchModal}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Open Deg Cooking Modal</span>
                  </button>
                </div>
              )}

              {m.type === 'prep_briefing' && onSwitchTab && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap gap-2">
                  <button
                    onClick={() => onSwitchTab('batches')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>View Today's Cooking Degs</span>
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {m.role === 'user' ? 'You' : 'AI Copilot'}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs py-2 bg-slate-50 border border-slate-200 rounded-xl px-3 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>Analyzing shop ledger & recipe data...</span>
          </div>
        )}

        {logSuccessMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{logSuccessMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box with Voice Mic */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <VoiceInput
          onTranscript={(text) => handleSendQuery(text)}
          isListening={isListening}
          setIsListening={setIsListening}
        />

        <input
          type="text"
          placeholder={isListening ? 'Listening to voice...' : 'Ask about profit, recipe scaling, supplier bill...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none transition-colors"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className={`p-2 rounded-xl text-white font-bold transition-all shadow-xs ${
            !inputText.trim() || isLoading
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
