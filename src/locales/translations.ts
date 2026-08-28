import { Language } from '../types';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    brand_title: "HashForge Pro",
    brand_tagline: "Simple & Powerful Crypto Mining",
    live_status: "Stratum Live",
    dashboard: "Mining Dashboard",
    rig_manager: "Rig Manager",
    cloud_mining: "Cloud Hashrate",
    calculator: "Profit Calculator",
    stratum_pools: "Pools & Stratum",
    hardware_lab: "Hardware Lab",
    wallet_payouts: "Wallet & Payouts",
    ai_advisor: "AI Mining Advisor",
    
    // Auth & Navigation
    login: "Log In",
    signup: "Sign Up Free",
    logout: "Log Out",
    demo_login: "⚡ 1-Click Instant Demo Login",
    create_account: "Create Free Mining Account",
    welcome_back: "Welcome Back",
    email_label: "Email Address",
    password_label: "Password",
    fullname_label: "Full Name",
    already_have_account: "Already have an account?",
    dont_have_account: "Don't have an account?",
    signup_bonus: "🎁 Free 10 TH/s Hashrate Bonus On Signup!",
    hero_headline: "Start Mining Bitcoin & Crypto in 60 Seconds",
    hero_subtitle: "No expensive hardware or complex setups needed. Register in seconds, get free 10 TH/s bonus, and withdraw daily crypto earnings directly to your wallet.",
    start_free_mining: "Start Free Mining Now",
    view_live_plans: "Explore Cloud Plans",
    step1_title: "1. Free Quick Signup",
    step1_desc: "Create your account in 10 seconds. Get 10 TH/s starter hashrate immediately.",
    step2_title: "2. Automatic 24/7 Mining",
    step2_desc: "Hydro-cooled renewable clusters mine Bitcoin and Kaspa around the clock.",
    step3_title: "3. Direct Instant Payout",
    step3_desc: "Withdraw your mined coins with 0% fee straight to your personal wallet or Lightning.",
    member_dashboard: "My Mining Portal",
    home: "Home",
    go_to_dashboard: "Go to Dashboard",
    
    // Overview Metrics
    active_hashrate: "Total Active Hashrate",
    active_workers: "Active Miners / Rigs",
    daily_est_revenue: "24h Est. Gross Yield",
    power_consumption: "Total Power Draw",
    efficiency_metric: "Average Efficiency",
    unpaid_balance: "Unpaid Mining Balance",
    
    // Actions
    start_mining: "Start Mining",
    pause_mining: "Pause Cluster",
    overclock_btn: "Tuning / OC",
    add_rig: "Deploy New Rig",
    buy_hashrate: "Purchase Hash Contract",
    withdraw_btn: "Instant Payout",
    calculate_roi: "Calculate Profit",
    ask_ai: "Consult Mining AI",
    
    // Status
    status_mining: "Mining Active",
    status_idle: "Idle / Standby",
    status_overheating: "Thermal Warning",
    status_maintenance: "Maintenance",
    
    // Rig Cards
    temp: "Temp",
    fans: "Fan Speed",
    shares: "Shares (A/R)",
    uptime: "Uptime",
    algo: "Algorithm",
    
    // Terminal
    live_terminal: "Stratum PoW Terminal",
    clear_logs: "Clear Console",
    auto_scroll: "Auto Scroll",
    terminal_connected: "Connected to Stratum Master Node",
    
    // Payout modal
    payout_title: "Instant Wallet Payout",
    payout_desc: "Direct zero-fee mining balance withdrawal to your external crypto wallet or Lightning node.",
    enter_address: "Destination Wallet Address",
    amount_to_withdraw: "Withdrawal Amount",
    network_fee: "Network Gas Fee",
    confirm_withdrawal: "Confirm & Broadcast Tx",
    recent_transactions: "Recent Payout Ledger",
    
    // AI Advisor
    ai_title: "HashForge AI Mining Intelligence",
    ai_subtitle: "Ask deep questions about coin profitability, undervolting, electricity arbitrage, and hardware setups.",
    ai_placeholder: "e.g., Which coin is most profitable for RTX 4090 with $0.06/kWh power?",
    ai_send: "Ask Advisor",
    quick_prompts: "Quick Strategic Queries",
    
    // Footer / Notification
    stratum_ready: "Global Stratum Gateway operational with 99.98% SLA",
  }
};
