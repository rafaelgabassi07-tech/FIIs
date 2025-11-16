
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { FII, HistoricalDataPoint } from '../types';
import { fetchFIIsFullData, FIIMarketData } from '../services/geminiService';
import { TrendingUp, TrendingDown, Wallet, Landmark, HandCoins, BarChart, ChevronDown, Archive, Gift, PieChart } from 'lucide-react';
import { usePortfolio } from '../hooks/usePortfolio';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import InteractiveChart from '../components/InteractiveChart';
import AllocationPieChart from '../components/AllocationPieChart';
import StatCard from '../components/StatCard';

const chartPeriods = {
    '1M': { days: 30, label: '1 Mês' },
    '3M': { days: 90, label: '3 Meses' },
    '6M': { days: 180, label: '6 Meses' },
    '1A': { days: 365, label: '1 Ano' },
};
type ChartPeriodKey = keyof typeof chartPeriods;

const PortfolioCard: React.FC<{ 
    fii: FII, 
    isSelected: boolean,
    onSelect: () => void,
    chartData: HistoricalDataPoint[] | null,
    isChartLoading: boolean
}> = ({ fii, isSelected, onSelect, chartData, isChartLoading }) => {
  const totalInvested = fii.quantity * fii.averagePrice;
  const currentTotal = fii.quantity * fii.currentPrice;
  const profitLoss = currentTotal - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  const isPositive = profitLoss >= 0;

  return (
    <div className="bg-base-200 rounded-lg shadow-md overflow-hidden">
        <div onClick={onSelect} className="p-4 flex items-center space-x-4 cursor-pointer">
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
             <ChevronDown size={24} className={`text-content-200 transition-transform duration-300 ${isSelected ? 'rotate-180' : ''}`} />
        </div>
        <div className={`transition-all duration-500 ease-in-out ${isSelected ? 'max-h-96' : 'max-h-0'}`}>
            <div className="px-4 pb-4">
                {isChartLoading && <LoadingSpinner text="Carregando histórico..." />}
                {chartData && <InteractiveChart data={chartData} color="#10B981" height={150} />}
            </div>
        </div>
    </div>
  );
};

const PortfolioScreen: React.FC = () => {
  const { holdings, dividends, realizedGains, investedHistory, combineHoldingsWithMarketData } = usePortfolio();
  const [portfolio, setPortfolio] = useState<FII[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<HistoricalDataPoint[]>([]);
  const [individualHistories, setIndividualHistories] = useState<Record<string, HistoricalDataPoint[]>>({});
  const [selectedFii, setSelectedFii] = useState<string | null>(null);
  
  const [chartPeriod, setChartPeriod] = useState<ChartPeriodKey>('1M');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (periodKey: ChartPeriodKey) => {
    if (holdings.length === 0) {
      setIsLoading(false);
      setIsChartLoading(false);
      setPortfolio([]);
      setPortfolioHistory([]);
      setIndividualHistories({});
      return;
    }

    setIsLoading(true);
    setIsChartLoading(true);
    setError(null);
    try {
      const tickers = holdings.map(h => h.ticker);
      const periodInDays = chartPeriods[periodKey].days;
      
      const fullDataMap = await fetchFIIsFullData(tickers, periodInDays);
      
      const marketData: FIIMarketData[] = Object.values(fullDataMap).map(data => ({
          ticker: data.ticker,
          name: data.name,
          currentPrice: data.currentPrice,
      }));
      
      const fullPortfolioData = combineHoldingsWithMarketData(marketData);
      setPortfolio(fullPortfolioData);
      setIsLoading(false); 

      const individualHistoryMap: Record<string, HistoricalDataPoint[]> = {};
      Object.keys(fullDataMap).forEach(ticker => {
          individualHistoryMap[ticker] = fullDataMap[ticker].history;
      });
      setIndividualHistories(individualHistoryMap);
      
      const portfolioHistoryMap = new Map<string, number>();
      holdings.forEach(h => {
          const quantity = h.quantity;
          const history = individualHistoryMap[h.ticker];
          if (history) {
            history.forEach(dataPoint => {
                const currentValue = portfolioHistoryMap.get(dataPoint.date) || 0;
                portfolioHistoryMap.set(dataPoint.date, currentValue + dataPoint.value * quantity);
            });
          }
      });
      
      const aggregatedHistory = Array.from(portfolioHistoryMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setPortfolioHistory(aggregatedHistory);

    } catch (err) {
      if (err instanceof Error) { setError(err.message); } 
      else { setError('Ocorreu um erro desconhecido.'); }
    } finally {
      setIsLoading(false);
      setIsChartLoading(false);
    }
  }, [holdings, combineHoldingsWithMarketData]);

  useEffect(() => {
    loadData(chartPeriod);
  }, [loadData, chartPeriod]);
  
  const handleFiiSelect = (ticker: string) => {
      setSelectedFii(prev => (prev === ticker ? null : ticker));
  };
  
  const alignedInvestedHistory = useMemo(() => {
    if (portfolioHistory.length === 0 || investedHistory.length === 0) return [];

    // Fix: Explicitly type the Map to ensure correct type inference for keys and values.
    // This resolves issues where sortedInvestedTimestamps elements were inferred as 'unknown'.
    const investedMap = new Map<number, number>(investedHistory.map(p => [new Date(p.date).getTime(), p.value]));
    const sortedInvestedTimestamps = Array.from(investedMap.keys()).sort((a,b) => a - b);

    let lastInvestedValue = 0;
    const firstPortfolioTimestamp = new Date(portfolioHistory[0].date).getTime();
    
    // Find the invested value right before the chart's period starts
    const initialInvestedTimestamps = sortedInvestedTimestamps.filter(t => t < firstPortfolioTimestamp);
     if (initialInvestedTimestamps.length > 0) {
        lastInvestedValue = investedMap.get(initialInvestedTimestamps[initialInvestedTimestamps.length - 1])!;
    }

    return portfolioHistory.map(p => {
        const currentTimestamp = new Date(p.date).getTime();
        const relevantTimestamps = sortedInvestedTimestamps.filter(t => t > (currentTimestamp - 86400000) && t <= currentTimestamp);
        
        if (relevantTimestamps.length > 0) {
            lastInvestedValue = investedMap.get(relevantTimestamps[relevantTimestamps.length - 1])!;
        }
        return { date: p.date, value: lastInvestedValue };
    });
  }, [portfolioHistory, investedHistory]);

  const portfolioSummary = useMemo(() => {
    const totalValue = portfolio.reduce((acc, fii) => acc + (fii.quantity * fii.currentPrice), 0);
    const totalCost = portfolio.reduce((acc, fii) => acc + (fii.quantity * fii.averagePrice), 0);
    const totalDividendsReceived = dividends.reduce((acc, tx) => acc + tx.price, 0);

    const totalReceived = totalDividendsReceived + realizedGains;
    
    // Total Return = (Current Value - Total Cost Basis) + Total Received (Dividends + Realized Gains)
    const totalReturn = (totalValue - totalCost) + totalReceived;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    const isTotalPositive = totalReturn >= 0;

    return { totalValue, totalCost, totalReceived, totalReturn, totalReturnPercent, isTotalPositive };
  }, [portfolio, dividends, realizedGains]);

  const { totalValue, totalCost, totalReceived, totalReturn, totalReturnPercent, isTotalPositive } = portfolioSummary;
  
  const allocationData = useMemo(() => {
    return portfolio.map(fii => ({
      ticker: fii.ticker,
      value: fii.quantity * fii.currentPrice,
    }));
  }, [portfolio]);

  const dividendsByPeriod = useMemo(() => {
    if (!dividends) return [];
    
    const periodInDays = chartPeriods[chartPeriod].days;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodInDays);
    
    return dividends.filter(tx => new Date(tx.date) >= cutoffDate);
  }, [dividends, chartPeriod]);

  const totalDividendsInPeriod = useMemo(() => {
      return dividendsByPeriod.reduce((acc, tx) => acc + tx.price, 0);
  }, [dividendsByPeriod]);

  const dividendsByFiiInPeriod = useMemo(() => {
      const byFii: Record<string, number> = {};
      for (const tx of dividendsByPeriod) {
          byFii[tx.ticker] = (byFii[tx.ticker] || 0) + tx.price;
      }
      return Object.entries(byFii).sort((a, b) => b[1] - a[1]);
  }, [dividendsByPeriod]);

  const renderContent = () => {
    if (isLoading && holdings.length > 0) {
      return <LoadingSpinner text="Sincronizando com o mercado..." subtext="Buscando cotações atuais para seus ativos."/>;
    }
    if (error) {
      return <ErrorDisplay message="Não conseguimos buscar os dados. Por favor, verifique sua conexão e tente novamente." details={error} onRetry={() => loadData(chartPeriod)} />;
    }
    if (holdings.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-10 text-content-200 bg-base-200 rounded-lg shadow-md">
              <Archive size={48} className="mb-4 text-brand-primary" />
              <h3 className="text-xl font-semibold text-content-100">Sua carteira está vazia</h3>
              <p className="text-sm mt-2 max-w-sm">
                  Acesse a aba <span className="font-bold text-brand-primary">Transações</span> para adicionar seus ativos e começar a acompanhar seus investimentos.
              </p>
          </div>
      );
    }
    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={Wallet} 
            label="Patrimônio Atual" 
            value={totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          />
          <StatCard 
            icon={Landmark} 
            label="Custo Total" 
            value={totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          />
           <StatCard 
            icon={HandCoins} 
            label="Total Recebido" 
            value={totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            subValue="Divs + Vendas"
            iconColorClass="text-yellow-400"
          />
          <StatCard 
            icon={BarChart} 
            label="Rentabilidade Total" 
            value={totalReturn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            subValue={`${isTotalPositive ? '+' : ''}${totalReturnPercent.toFixed(2)}%`}
            iconColorClass={isTotalPositive ? 'text-green-400' : 'text-red-400'}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-base-200 p-4 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-content-100 mb-4">Evolução do Patrimônio</h3>
               <div className="flex justify-center space-x-1 sm:space-x-2 bg-base-300 p-1 rounded-lg mb-4">
                  {(Object.keys(chartPeriods) as ChartPeriodKey[]).map(key => (
                      <button key={key} onClick={() => setChartPeriod(key)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-full ${chartPeriod === key ? 'bg-brand-primary text-white shadow' : 'text-content-200 hover:bg-base-100'}`}>
                          {chartPeriods[key].label}
                      </button>
                  ))}
              </div>
              {isChartLoading ? <LoadingSpinner text="Calculando desempenho..."/> : <InteractiveChart data={portfolioHistory} investedData={alignedInvestedHistory} color="#10B981" />}
          </div>
           <div className="lg:col-span-2 bg-base-200 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                    <PieChart size={24} className="text-content-100" />
                    <h3 className="text-xl font-semibold text-content-100">Alocação de Ativos</h3>
                </div>
                {isChartLoading ? <LoadingSpinner text="Calculando alocação..."/> : <AllocationPieChart data={allocationData} />}
            </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-content-100 mb-4">Meus Dividendos ({chartPeriods[chartPeriod].label})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-base-200 p-4 rounded-xl shadow-lg">
                <div className="flex items-center text-content-200">
                  <Gift size={20} className="mr-2 text-yellow-400"/>
                  <p className="text-md">Total Recebido no Período</p>
                </div>
                <p className="text-3xl font-bold text-yellow-400 mt-1">
                    {totalDividendsInPeriod.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
            <div className="space-y-2">
                {dividendsByFiiInPeriod.length > 0 ? (
                    dividendsByFiiInPeriod.slice(0,3).map(([ticker, amount]) => (
                        <div key={ticker} className="bg-base-200 p-3 rounded-lg flex justify-between items-center shadow-sm h-full">
                            <span className="font-bold text-content-100">{ticker}</span>
                            <span className="font-semibold text-green-400">
                                + {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-4 bg-base-200 rounded-lg shadow-sm h-full flex items-center justify-center">
                        <p className="text-content-200">Nenhum dividendo registrado neste período.</p>
                    </div>
                )}
            </div>
          </div>
        </div>

        <div>
            <h3 className="text-xl font-semibold text-content-100 mb-4 mt-8">Meus Ativos</h3>
            <div className="space-y-4">
                {portfolio.map(fii => 
                    <PortfolioCard 
                        key={fii.ticker} 
                        fii={fii} 
                        isSelected={selectedFii === fii.ticker}
                        onSelect={() => handleFiiSelect(fii.ticker)}
                        chartData={individualHistories[fii.ticker]}
                        isChartLoading={isChartLoading && selectedFii === fii.ticker}
                    />
                )}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <ScreenHeader title="Carteira" subtitle="Seu patrimônio e desempenho" />
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default PortfolioScreen;
