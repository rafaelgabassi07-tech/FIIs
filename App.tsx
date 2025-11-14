
import React, { useState } from 'react';
import BottomNav from './components/BottomNav';
import { Tab } from './types';
import PortfolioScreen from './screens/PortfolioScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import NewsScreen from './screens/NewsScreen';
import MenuScreen from './screens/MenuScreen';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Carteira);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Carteira:
        return <PortfolioScreen />;
      case Tab.Transacoes:
        return <TransactionsScreen />;
      case Tab.Noticias:
        return <NewsScreen />;
      case Tab.Menu:
        return <MenuScreen />;
      default:
        return <PortfolioScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans">
      <main className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
