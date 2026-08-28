import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Headphones, 
  Sparkles, 
  CheckCheck, 
  ShieldCheck, 
  Paperclip,
  Smile,
  Bot
} from 'lucide-react';
import { Language } from '../types';

interface LiveSupportProps {
  language?: Language;
}

interface ChatMessage {
  id: string;
  sender: 'support' | 'user';
  text: string;
  timestamp: string;
  avatar?: string;
}

export const LiveSupportWidget: React.FC<LiveSupportProps> = ({ language = 'en' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'support',
      text: 'Hello! 👋 Welcome to HashForge Pro 24/7 Live Support. How can we assist you with cloud mining packages, rig setup, or payouts today?',
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: now,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsAgentTyping(true);

    // Dynamic support response
    setTimeout(() => {
      setIsAgentTyping(false);
      const lower = userText.toLowerCase();
      let reply = "Thank you for reaching out! Our mining specialist is looking into this. For instant activation, you can check our $100 Starter Package or connect your wallet directly.";

      if (lower.includes('package') || lower.includes('plan') || lower.includes('price') || lower.includes('100') || lower.includes('cost')) {
        reply = "Our cloud mining packages start from just $100 (Bronze Tier, 25 TH/s) up to $2,500 (Diamond Enterprise, 850 TH/s). All packages feature daily automated payouts and zero maintenance fees!";
      } else if (lower.includes('payout') || lower.includes('withdraw') || lower.includes('money') || lower.includes('wallet')) {
        reply = "Payouts are processed instantly with zero platform fees! You can withdraw your mined BTC, KAS, ETC, LTC, DOGE or XMR anytime directly to your external address via the Wallet tab.";
      } else if (lower.includes('start') || lower.includes('how') || lower.includes('free') || lower.includes('bonus')) {
        reply = "Getting started takes 60 seconds: Simply sign up to receive your free starter bonus hashrate, choose a cloud package or deploy custom hardware to begin earning PoW rewards.";
      } else if (lower.includes('kaspa') || lower.includes('btc') || lower.includes('bitcoin')) {
        reply = "We offer dedicated Stratum v2 hydro-cooled clusters for both Bitcoin (SHA-256) and Kaspa (kHeavyHash) with up to 310% projected annual ROI.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `support-${Date.now()}`,
          sender: 'support',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Widget Button (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        
        {/* Chat Window */}
        {isOpen && (
          <div className="mb-3 w-[92vw] sm:w-96 rounded-3xl bg-[#0f172a] border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 flex flex-col h-[490px]">
            
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#17233f] via-[#111a30] to-[#0c1220] p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0f172a] rounded-full"></span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>HashForge Live Support</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      ONLINE
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Typically replies in under 1 minute</p>
                </div>
              </div>

              <button
                id="close-live-support-btn"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Security Guarantee Strip */}
            <div className="bg-slate-900/90 py-1.5 px-4 border-b border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official 24/7 Mining Engineer Desk</span>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#0b101b]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl p-3 leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none shadow-md shadow-amber-500/10'
                        : 'bg-[#18233c] text-slate-200 border border-slate-700/80 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 px-1 font-mono">
                    <span>{m.timestamp}</span>
                    {m.sender === 'user' && <CheckCheck className="w-3 h-3 text-amber-500" />}
                  </div>
                </div>
              ))}

              {isAgentTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs bg-[#18233c] border border-slate-700/80 w-fit p-3 rounded-2xl rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px] text-slate-400">Mining Specialist is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-3 py-2 bg-[#0c1220] border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setInputMessage('What are the $100 package details?')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] whitespace-nowrap border border-slate-700/60 cursor-pointer"
              >
                $100 Starter Pack
              </button>
              <button
                type="button"
                onClick={() => setInputMessage('How do daily payouts work?')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] whitespace-nowrap border border-slate-700/60 cursor-pointer"
              >
                Daily Payouts
              </button>
              <button
                type="button"
                onClick={() => setInputMessage('How to setup my mining rig?')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] whitespace-nowrap border border-slate-700/60 cursor-pointer"
              >
                Rig Setup
              </button>
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#0f172a] border-t border-slate-800 flex items-center gap-2">
              <input
                id="live-support-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                id="send-live-support-btn"
                type="submit"
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        )}

        {/* Floating Bubble Icon */}
        <button
          id="open-live-support-bubble-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-bold shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/40"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-slate-950" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 fill-slate-950 text-slate-950" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#070a11]"></span>
              </span>
            </>
          )}
        </button>

      </div>
    </>
  );
};
