import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Zap,
  ShieldCheck,
  Coins,
  DollarSign,
  Lock,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'all' | 'deposits' | 'mining' | 'withdrawals' | 'flash' | 'security';
  question: string;
  answer: string;
  tag: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'mining',
    question: 'How does cloud mining on HashForge generate daily yield?',
    answer: 'When you purchase a mining package, our proprietary Stratum V2 cluster dynamically provisions high-efficiency ASIC and GPU hashrate in our Zurich, Reykjavik, and Quebec data centers. You earn block rewards every 6 hours proportional to your allocated hashrate, which can be held in ETH or instantly converted to USDT.',
    tag: 'Protocol'
  },
  {
    id: 'faq-2',
    category: 'deposits',
    question: 'What cryptocurrencies are supported for deposits and contracts?',
    answer: 'We support USDT over the TRC20 (Tron) and ERC20 (Ethereum) networks. TRC20 is recommended for minimal gas fees and sub-minute confirmations. Once your transaction hash is submitted, our system automatically routes your hashrate within minutes.',
    tag: 'Deposits'
  },
  {
    id: 'faq-3',
    category: 'withdrawals',
    question: 'How fast are USDT withdrawals and is there a withdrawal fee?',
    answer: 'Withdrawals are processed 24/7 with zero platform fees. Daily mining earnings and completed 48-hour Flash payouts can be withdrawn directly to any TRC20/ERC20 wallet address. Average blockchain transaction broadcast time is under 15 minutes.',
    tag: 'Withdrawals'
  },
  {
    id: 'faq-4',
    category: 'flash',
    question: 'What is the 48-Hour Flash Mining Contract and how does it work?',
    answer: 'Flash contracts are accelerated, high-yield mining pools that lock your principal for exactly 48 hours. During this period, enterprise clusters direct maximum surge hashrate to your node. After 48 hours, 100% of your initial capital plus high-yield lump-sum profit unlocks automatically for one-click withdrawal.',
    tag: 'Flash 48H'
  },
  {
    id: 'faq-5',
    category: 'security',
    question: 'How is user capital and data isolated and secured?',
    answer: 'HashForge utilizes a non-custodial smart routing architecture. Client accounts are strictly isolated with dedicated authentication tokens and automated 2-minute inactivity lockouts. Proof-of-Reserves are audited on-chain with 100% full asset backing.',
    tag: 'Security'
  },
  {
    id: 'faq-6',
    category: 'mining',
    question: 'Can I swap my mined Ethereum directly to USDT inside the platform?',
    answer: 'Yes. Our built-in Zero-Slippage Exchange allows you to convert mined ETH to USDT instantly at real-time market rates without needing an external exchange like Binance or Coinbase. Converted USDT is credited directly to your withdrawal wallet.',
    tag: 'Exchange'
  },
  {
    id: 'faq-7',
    category: 'deposits',
    question: 'Where can I get an official invoice or certificate for my deposit?',
    answer: 'Every approved deposit automatically generates a cryptographically signed SHA-256 Invoice & Proof of Hashrate Certificate. You can view, download as an offline document, or print your official certificate directly from your Dashboard Deposit History at any time.',
    tag: 'Receipts'
  }
];

export const MiningFaqSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'deposits' | 'mining' | 'withdrawals' | 'flash' | 'security'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <section id="faq-section" className="p-6 sm:p-10 rounded-3xl bg-[#090e1c] border border-slate-800/90 shadow-2xl space-y-8 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Knowledge Base & Support</span>
        </div>
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          Frequently Asked Questions
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
          Everything you need to know about cloud mining contracts, payouts, and platform security.
        </p>
      </div>

      {/* Search Bar & Category Filters */}
      <div className="max-w-3xl mx-auto space-y-4 relative z-10">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g., withdrawals, flash 48h, minimum deposit, receipt)..."
            className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-amber-500/60 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'mining', label: 'Mining Yields' },
            { id: 'deposits', label: 'Deposits' },
            { id: 'withdrawals', label: 'Withdrawals' },
            { id: 'flash', label: '48H Flash' },
            { id: 'security', label: 'Security & SLA' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-semibold ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Accordion FAQ List */}
      <div className="max-w-3xl mx-auto space-y-3 relative z-10">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-mono text-xs">
            No matching questions found. Please try another search term or contact 24/7 live support.
          </div>
        ) : (
          filteredFaqs.map(faq => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-[#11192e] border-amber-500/40 shadow-xl shadow-amber-500/5'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-900 text-amber-400 border border-slate-800 shrink-0">
                      {faq.tag}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {faq.question}
                    </h4>
                  </div>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                    isExpanded
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 rotate-180'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/50 mt-1">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </section>
  );
};
