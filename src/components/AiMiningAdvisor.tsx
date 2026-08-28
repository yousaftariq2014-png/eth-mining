import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Lightbulb, 
  RefreshCw, 
  Check, 
  HelpCircle,
  X,
  MessageSquare
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface AiMiningAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiMiningAdvisor: React.FC<AiMiningAdvisorProps> = ({
  isOpen,
  onClose,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Welcome to HashForge AI Mining Intelligence! Ask me anything regarding optimal coin profitability, ASIC/GPU undervolting, electricity arbitrage, or Stratum telemetry troubleshooting.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    "Which coin is most profitable for ASICs with $0.05/kWh power?",
    "How to safely undervolt RTX 4090 for maximum J/TH efficiency?",
    "What is the operational difference between PPS+ and PPLNS?",
    "How do I optimize Kaspa kHeavyHash mining hashrate?",
  ];

  const handleSend = async (questionText?: string) => {
    const q = questionText || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          language: 'en',
          userContext: {
            platform: 'HashForge Pro',
            activeAlgos: ['SHA-256', 'kHeavyHash', 'Etchash', 'RandomX'],
          },
        }),
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.advice || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: "Could not reach the AI advisor service. Please check your network connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0e1422] border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{t.ai_title}</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gemini Powered
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.ai_subtitle}</p>
            </div>
          </div>
          
          <button
            id="close-ai-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#090d16]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm whitespace-pre-line'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1.5 font-mono ${
                      isUser ? 'text-slate-950/70 text-right' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl rounded-bl-none bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Analyzing silicon telemetry & cryptoeconomics...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Query Pill Suggestions */}
        <div className="px-6 py-2 bg-[#0c121e] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-500 uppercase font-mono shrink-0">
            {t.quick_prompts}:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-[#111827] border-t border-slate-800 flex items-center gap-2"
        >
          <input
            id="ai-query-input"
            type="text"
            placeholder={t.ai_placeholder}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 bg-[#090d16] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
          />
          <button
            id="ai-send-btn"
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.ai_send}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
