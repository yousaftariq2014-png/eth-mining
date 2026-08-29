import React, { useEffect } from 'react';
import { UserProfile } from '../types';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: any;
  }
}

interface LiveSupportProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: UserProfile | null;
}

export const LiveSupportWidget: React.FC<LiveSupportProps> = ({ isOpen, onClose, user }) => {
  // Sync logged in user profile with Tawk.to Live Chat
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Tawk_API) {
      if (user) {
        try {
          window.Tawk_API.setAttributes({
            name: user.name || user.email,
            email: user.email,
            plan: user.plan || `VIP ${user.vipLevel || 1}`,
            hashrate: `${user.hashrate || 0} GH/s`,
            balanceUsdt: `$${user.balanceUsdt?.toFixed(2) || '0.00'}`
          }, function(error: any) {
            if (error) console.error('Tawk attribute sync error:', error);
          });
        } catch (e) {
          // ignore
        }
      }
    }
  }, [user]);

  // If triggered via modal state
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.Tawk_API) {
      try {
        window.Tawk_API.maximize();
        if (onClose) onClose();
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen, onClose]);

  return null; // Tawk.to handles rendering its official floating widget
};
