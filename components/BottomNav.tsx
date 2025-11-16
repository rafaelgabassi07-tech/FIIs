
import React from 'react';
import { Tab } from '../types';
import { Wallet, ArrowLeftRight, Newspaper, Menu } from 'lucide-react';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const navItems = [
  { id: Tab.Carteira, icon: Wallet },
  { id: Tab.Transacoes, icon: ArrowLeftRight },
  { id: Tab.Noticias, icon: Newspaper },
  { id: Tab.Menu, icon: Menu },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 shadow-lg">
      <div className="flex justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors duration-200 ${
                isActive ? 'text-brand-primary' : 'text-content-200 hover:text-content-100'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{item.id}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;