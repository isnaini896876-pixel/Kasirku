import React from 'react';
import { Zap, Send, QrCode, ShoppingBag } from 'lucide-react';
import { TabType } from '../types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'token', label: 'Token PLN', icon: Zap },
    { id: 'transfer', label: 'Transfer', icon: Send },
    { id: 'qris', label: 'QRIS Pay', icon: QrCode },
    { id: 'toko', label: 'Toko & Suara', icon: ShoppingBag },
  ];

  return (
    <div className="grid grid-cols-4 bg-slate-200/80 p-1 rounded-xl gap-1 mb-3.5 no-print shadow-inner">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-bold transition-all ${
              isActive
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
