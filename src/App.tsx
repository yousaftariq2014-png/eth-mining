import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { DepositPage } from './components/DepositPage';
import { ClientSmartDashboard } from './components/ClientSmartDashboard';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { LiveSupportWidget } from './components/LiveSupportWidget';

import { 
  UserProfile, 
  MiningPackage, 
  DepositRequest,
  WithdrawalRecordItem
} from './types';
import { MINING_PACKAGES, INITIAL_WITHDRAWAL_RECORDS } from './data/packagesData';
import { 
  fetchSupabaseUsers, 
  saveSupabaseUser, 
  fetchSupabaseDeposits, 
  insertSupabaseDeposit, 
  updateSupabaseDepositStatus,
  fetchSupabaseWithdrawals
} from './lib/supabase';

// Initial Demo Registered Clients
const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    id: 'user-demo-01',
    name: 'Alex Turner',
    email: 'alex.turner@gmail.com',
    isLoggedIn: true,
    joinedDate: '2026-08-28',
    plan: 'VIP 5 (VIP 5 Diamond Enterprise)',
    vipLevel: 5
  },
  {
    id: 'user-demo-02',
    name: 'Michael Chang',
    email: 'm.chang@crypto-fund.io',
    isLoggedIn: false,
    joinedDate: '2026-08-27',
    plan: 'VIP 4 (VIP 4 Megawatt Producer)',
    vipLevel: 4
  },
  {
    id: 'user-demo-03',
    name: 'Sarah Jenkins',
    email: 'sarah.j@blockcloud.net',
    isLoggedIn: false,
    joinedDate: '2026-08-26',
    plan: 'VIP 2 (VIP 2 Advanced Node)',
    vipLevel: 2
  },
  {
    id: 'user-demo-04',
    name: 'David Miller',
    email: 'dmiller@web3invest.org',
    isLoggedIn: false,
    joinedDate: '2026-08-25',
    plan: 'VIP 3 (VIP 3 Pro Cluster)',
    vipLevel: 3
  }
];

export default function App() {
  // 1. Current Authenticated Client User (saved in localStorage)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('hashforge_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Navigation State: 'home' | 'deposit' | 'dashboard' | 'admin'
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (window.location.hash === '#admin') return 'admin';
    const saved = localStorage.getItem('hashforge_user');
    return saved ? 'dashboard' : 'home';
  });

  // Listen for Hash Changes (e.g. #admin)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentTab('admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. 5 Mining Packages
  const [packages] = useState<MiningPackage[]>(MINING_PACKAGES);

  // 4. Selected Package for Deposit
  const [selectedPackage, setSelectedPackage] = useState<MiningPackage>(MINING_PACKAGES[1]); // default VIP 2

  // 5. Registered Users Database (persisted in localStorage & synced with Supabase)
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_registered_users');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DEMO_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hashforge_registered_users', JSON.stringify(registeredUsers));
    } catch {}
  }, [registeredUsers]);

  // 6. Deposit Requests & Approvals (persisted & synced with Supabase)
  const [deposits, setDeposits] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_deposits');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'dep-demo-01',
        userId: 'user-demo-01',
        userName: 'Alex Turner',
        packageId: 'pkg-vip-5',
        packageName: 'VIP 5 Diamond Enterprise',
        vipLevel: 5,
        amountUsd: 2500,
        network: 'TRC20',
        depositAddress: 'TQn9Y2khEsLJW1ChV8N8N6uG2X734fjk',
        senderTxid: 'TX892746194723049182374928172948',
        status: 'approved',
        createdAt: '2026-08-28 10:15:00',
        approvedAt: '2026-08-28 10:20:00'
      },
      {
        id: 'dep-demo-02',
        userId: 'user-demo-02',
        userName: 'Michael Chang',
        packageId: 'pkg-vip-4',
        packageName: 'VIP 4 Megawatt Producer',
        vipLevel: 4,
        amountUsd: 1000,
        network: 'TRC20',
        depositAddress: 'TQn9Y2khEsLJW1ChV8N8N6uG2X734fjk',
        senderTxid: 'TX489201948201948201948201948201',
        status: 'pending',
        createdAt: '2026-08-28 14:10:00'
      },
      {
        id: 'dep-demo-03',
        userId: 'user-demo-03',
        userName: 'Sarah Jenkins',
        packageId: 'pkg-vip-2',
        packageName: 'VIP 2 Advanced Node',
        vipLevel: 2,
        amountUsd: 250,
        network: 'ERC20',
        depositAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        senderTxid: '0x3847a98b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
        status: 'pending',
        createdAt: '2026-08-28 14:32:00'
      }
    ];
  });

  // Save deposits to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hashforge_deposits', JSON.stringify(deposits));
    } catch {}
  }, [deposits]);

  // 7. Withdrawals Records
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecordItem[]>(INITIAL_WITHDRAWAL_RECORDS);

  // -------------------------------------------------------------------
  // LIVE SUPABASE DATA SYNC ON MOUNT
  // -------------------------------------------------------------------
  useEffect(() => {
    async function loadDataFromSupabase() {
      try {
        // Sync Users
        const remoteUsers = await fetchSupabaseUsers();
        if (remoteUsers && remoteUsers.length > 0) {
          setRegisteredUsers(prev => {
            const combined = [...remoteUsers];
            prev.forEach(localU => {
              if (!combined.some(u => u.email.toLowerCase() === localU.email.toLowerCase())) {
                combined.push(localU);
              }
            });
            return combined;
          });
        }

        // Sync Deposits
        const remoteDeposits = await fetchSupabaseDeposits();
        if (remoteDeposits && remoteDeposits.length > 0) {
          setDeposits(prev => {
            const combined = [...remoteDeposits];
            prev.forEach(localD => {
              if (!combined.some(d => d.id === localD.id)) {
                combined.push(localD);
              }
            });
            return combined;
          });
        }

        // Sync Withdrawals
        const remoteWithdrawals = await fetchSupabaseWithdrawals();
        if (remoteWithdrawals && remoteWithdrawals.length > 0) {
          setWithdrawalRecords(remoteWithdrawals);
        }
      } catch (err) {
        console.warn('Supabase initial fetch silent fallback:', err);
      }
    }

    loadDataFromSupabase();
  }, []);

  // 8. Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isLiveSupportOpen, setIsLiveSupportOpen] = useState<boolean>(false);

  // User Actions
  const handleOpenAuth = (mode: 'login' | 'signup', targetPkg?: MiningPackage) => {
    if (targetPkg) {
      setSelectedPackage(targetPkg);
    }
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStorage.setItem('hashforge_user', JSON.stringify(loggedInUser));

    // Also ensure user is in registeredUsers database
    setRegisteredUsers(prev => {
      if (!prev.some(u => u.email.toLowerCase() === loggedInUser.email.toLowerCase())) {
        return [loggedInUser, ...prev];
      }
      return prev;
    });

    // Save to Supabase Cloud
    saveSupabaseUser(loggedInUser);

    if (selectedPackage) {
      setCurrentTab('deposit');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hashforge_user');
    setUser(null);
    setCurrentTab('home');
  };

  const handleSelectPackage = (pkg: MiningPackage) => {
    setSelectedPackage(pkg);
    if (!user) {
      handleOpenAuth('signup', pkg);
    } else {
      setCurrentTab('deposit');
    }
  };

  // Submit new deposit from client
  const handleSubmitDeposit = (newDeposit: DepositRequest) => {
    setDeposits(prev => [newDeposit, ...prev]);
    // Save to Supabase Cloud
    insertSupabaseDeposit(newDeposit);
  };

  // Admin approves a deposit from Admin Portal
  const handleAdminApproveDeposit = (depositId: string) => {
    const approvedTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setDeposits(prev =>
      prev.map(d => {
        if (d.id === depositId) {
          return {
            ...d,
            status: 'approved',
            approvedAt: approvedTimestamp
          };
        }
        return d;
      })
    );

    // Sync approval to Supabase
    updateSupabaseDepositStatus(depositId, 'approved', approvedTimestamp);

    // Update user VIP level in registered users database & active user session
    const targetDeposit = deposits.find(d => d.id === depositId);
    if (targetDeposit) {
      // Update registered users list
      setRegisteredUsers(prev =>
        prev.map(u => {
          if (u.id === targetDeposit.userId || u.name === targetDeposit.userName) {
            const updated = {
              ...u,
              vipLevel: targetDeposit.vipLevel,
              plan: `VIP ${targetDeposit.vipLevel} (${targetDeposit.packageName})`
            };
            saveSupabaseUser(updated);
            return updated;
          }
          return u;
        })
      );

      // If active user is this client, update their local session
      if (user && (user.id === targetDeposit.userId || user.name === targetDeposit.userName)) {
        const updatedUser: UserProfile = {
          ...user,
          vipLevel: targetDeposit.vipLevel,
          plan: `VIP ${targetDeposit.vipLevel} (${targetDeposit.packageName})`
        };
        setUser(updatedUser);
        localStorage.setItem('hashforge_user', JSON.stringify(updatedUser));
        saveSupabaseUser(updatedUser);
      }
    }
  };

  // Admin rejects a deposit
  const handleAdminRejectDeposit = (depositId: string) => {
    setDeposits(prev =>
      prev.map(d => (d.id === depositId ? { ...d, status: 'rejected' } : d))
    );
    // Sync rejection to Supabase
    updateSupabaseDepositStatus(depositId, 'rejected');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header - Shown ONLY for client pages (Home / Deposit / Dashboard) */}
      {currentTab !== 'admin' && (
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          user={user}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW 1: HOME PAGE (5 PACKAGES & PUBLIC PRESENTATION) */}
        {currentTab === 'home' && (
          <HomePage
            packages={packages}
            user={user}
            onOpenAuth={handleOpenAuth}
            onSelectPackage={handleSelectPackage}
            onOpenLiveSupport={() => setIsLiveSupportOpen(true)}
          />
        )}

        {/* VIEW 2: DEPOSIT & RECHARGE PAGE */}
        {currentTab === 'deposit' && (
          <DepositPage
            selectedPackage={selectedPackage}
            user={user || {
              id: 'guest',
              name: 'Client User',
              email: 'client@hashforge.io',
              isLoggedIn: true,
              joinedDate: '2026-08-28',
              plan: 'VIP 1',
              vipLevel: 1
            }}
            onBack={() => setCurrentTab('home')}
            onSubmitDeposit={handleSubmitDeposit}
            pendingDeposits={deposits}
            onGoToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {/* VIEW 3: CLIENT DASHBOARD (LIVE MINING PROFIT & SMART PRODUCTION) */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <ClientSmartDashboard
              user={user || {
                id: 'guest',
                name: 'VIP Miner',
                email: 'miner@hashforge.io',
                isLoggedIn: true,
                joinedDate: '2026-08-28',
                plan: 'VIP 5 Diamond',
                vipLevel: 5
              }}
              packages={packages}
              onSelectPackage={handleSelectPackage}
              onOpenLiveSupport={() => setIsLiveSupportOpen(true)}
              pendingDeposits={deposits}
            />
          </div>
        )}

        {/* VIEW 4: DEDICATED SEPARATE ADMIN PORTAL & APPROVAL CONSOLE */}
        {currentTab === 'admin' && (
          <AdminPortal
            onBackToClientApp={() => {
              window.location.hash = '';
              setCurrentTab(user ? 'dashboard' : 'home');
            }}
            deposits={deposits}
            onApproveDeposit={handleAdminApproveDeposit}
            onRejectDeposit={handleAdminRejectDeposit}
            registeredUsers={registeredUsers}
            packages={packages}
            withdrawalRecords={withdrawalRecords}
          />
        )}

      </main>

      {/* Footer with Discreet Admin Portal Link at bottom */}
      <footer className="border-t border-slate-900 bg-[#060912] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 ETH2.0 Smart Production. All rights reserved.</span>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => {
                window.location.hash = 'admin';
                setCurrentTab('admin');
              }}
              className="text-slate-600 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 font-mono"
            >
              <span>🔒 Admin Portal</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Floating Live Support Widget */}
      <LiveSupportWidget
        isOpen={isLiveSupportOpen}
        onClose={() => setIsLiveSupportOpen(false)}
      />

    </div>
  );
}
