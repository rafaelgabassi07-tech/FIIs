import React, { useState, useEffect, useCallback } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { FII } from '../types';
import { fetchFIIMarketData, FIIMarketData } from '../services/geminiService';
import { TrendingUp, TrendingDown, DollarSign, LoaderCircle, AlertTriangle } from 'lucide-react';

// Dados base da carteira do usuário (sem dados de mercado)
const basePortfolio = [
  { ticker: 'MXRF11', quantity: 150, averagePrice: 10.15 },
  { ticker: 'HGLG11', quantity: 30, averagePrice: 165.40 },
  { ticker: 'XPML11', quantity: 50, averagePrice: 110.20 },
  { ticker: 'KNCR11', quantity: 80, averagePrice: 102.50 },
];

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-center p-8 text-content-200">
    <LoaderCircle className="animate-spin h-12 w-12 text-brand-primary mb-4" />
    <p className="font-semibold">Sincronizando com o mercado...</p>
    <p className="text-sm">Buscando cotações atuais para seus ativos.</p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 mt-10 bg-base-200 rounded-lg shadow-md">
      <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
      <h3 className="text-xl font-semibold text-content-100">Ops! Algo deu errado</h3>
      <p className="text-sm text-content-200 mt-2 mb-6 max-w-sm">
          Não conseguimos buscar os dados atualizados da sua carteira. Por favor, verifique sua conexão com a internet e tente novamente.
      </p>
      <button
        onClick={onRetry}
        className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
      >
        Tentar Novamente
      </button>
      <p className="text-xs text-base-300 mt-4 italic">Detalhe: {message}</p>
    </div>
  );


const PortfolioCard: React.FC<{ fii: FII }> = ({ fii }) => {
  const totalInvested = fii.quantity * fii.averagePrice;
  const currentTotal = fii.quantity * fii.currentPrice;
  const profitLoss = currentTotal - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  const isPositive = profitLoss >= 0;

  return (
    <div className="bg-base-200 rounded-lg shadow-md p-4 flex items-center space-x-4">
      <div className="w-12 h-12 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-xl text-white flex-shrink-0">
        {fii.ticker.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div>
            <p className="font-bold text-lg text-content-100">{fii.ticker}</p>
            <p className="text-sm text-content-200 truncate">{fii.name}</p>
          </div>
          <div className="text-left sm:text-right flex-shrink-0 sm:pl-2 mt-2 sm:mt-0">
            <p className="font-semibold text-lg text-content-100">
              {currentTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <div className={`flex items-center sm:justify-end text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
              <span>{profitLossPercent.toFixed(2)}%</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-content-200 mt-2 flex justify-between">
          <span>{fii.quantity} Cotas</span>
          <span>PM: {fii.averagePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      </div>
    </div>
  );
};

const PortfolioScreen: React.FC = () => {
  const [portfolio, setPortfolio] = useState<FII[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tickers = basePortfolio.map(fii => fii.ticker);
      const marketData: FIIMarketData[] = await fetchFIIMarketData(tickers);
      
      const marketDataMap = new Map(marketData.map(data => [data.ticker, data]));

      const fullPortfolioData: FII[] = basePortfolio.map(baseFii => {
        const data = marketDataMap.get(baseFii.ticker);
        return {
          ...baseFii,
          name: data?.name || 'Nome não encontrado',
          currentPrice: data?.currentPrice || 0,
        };
      }).filter(fii => fii.currentPrice > 0); 

      setPortfolio(fullPortfolioData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const totalValue = portfolio.reduce((acc, fii) => acc + (fii.quantity * fii.currentPrice), 0);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return <ErrorDisplay message={error} onRetry={loadPortfolio} />;
    }
    return (
      <div className="flex flex-col gap-8">
        {/* Card de Patrimônio Total - Ocupa a linha inteira */}
        <div className="bg-brand-primary text-white p-6 rounded-xl shadow-lg flex flex-col items-start w-full">
            <div className="flex items-center">
                <DollarSign size={28}/>
                <h2 className="text-xl font-semibold ml-2">Patrimônio Total</h2>
            </div>
          <p className="text-4xl font-bold mt-2">
            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        
        {/* Seção Meus Ativos - Fica abaixo do patrimônio */}
        <div>
            <h3 className="text-xl font-semibold text-content-100 mb-4">Meus Ativos</h3>
            <div className="space-y-4">
                {portfolio.map(fii => <PortfolioCard key={fii.ticker} fii={fii} />)}
            </div>
        </div>
      </div>
    );
  };


  return (
    <div>
      <ScreenHeader title="Carteira" subtitle="Seu patrimônio em FIIs" />
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default PortfolioScreen;