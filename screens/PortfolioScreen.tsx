import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { FII, HistoricalDataPoint } from '../types';
import { fetchFIIMarketData, FIIMarketData, fetchFIIHistoricalData } from '../services/geminiService';
import { TrendingUp, TrendingDown, DollarSign, LoaderCircle, AlertTriangle, ChevronDown } from 'lucide-react';

const basePortfolio = [
  { ticker: 'MXRF11', quantity: 150, averagePrice: 10.15 },
  { ticker: 'HGLG11', quantity: 30, averagePrice: 165.40 },
  { ticker: 'XPML11', quantity: 50, averagePrice: 110.20 },
  { ticker: 'KNCR11', quantity: 80, averagePrice: 102.50 },
];

const chartPeriods = {
    '1M': { days: 30, label: '1 Mês' },
    '3M': { days: 90, label: '3 Meses' },
    '6M': { days: 180, label: '6 Meses' },
    '1A': { days: 365, label: '1 Ano' },
};
type ChartPeriodKey = keyof typeof chartPeriods;

const InteractiveChart: React.FC<{ data: HistoricalDataPoint[]; color: string; height?: number; }> = ({ data, color, height = 200 }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; data: HistoricalDataPoint } | null>(null);

    const { path, areaPath, width, points } = useMemo(() => {
        if (!data || data.length < 2) return { path: '', areaPath: '', width: 0, points: [] };
        const w = 500;
        const h = height;
        const padding = 5;

        const values = data.map(d => d.value);
        const dates = data.map(d => new Date(d.date).getTime());

        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        
        const valueRange = maxVal - minVal;
        const dateRange = maxDate - minDate;

        const getX = (date: number) => (dateRange > 0 ? ((date - minDate) / dateRange) * (w - padding * 2) + padding : w / 2);
        const getY = (value: number) => (h - padding) - (valueRange > 0 ? ((value - minVal) / valueRange) * (h - padding * 2) : h / 2);
        
        const mappedPoints = data.map(d => ({ x: getX(new Date(d.date).getTime()), y: getY(d.value) }));
        
        let pathStr = `M ${mappedPoints[0].x} ${mappedPoints[0].y}`;
        mappedPoints.slice(1).forEach(p => { pathStr += ` L ${p.x} ${p.y}`; });
        
        let areaPathStr = pathStr + ` L ${mappedPoints[mappedPoints.length - 1].x} ${h} L ${mappedPoints[0].x} ${h} Z`;

        return { path: pathStr, areaPath: areaPathStr, width: w, points: mappedPoints };
    }, [data, height]);

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || points.length === 0) return;
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / rect.width) * width;

        const closestPointIndex = points.reduce((closest, point, index) => {
            const dist = Math.abs(point.x - mouseX);
            const closestDist = Math.abs(points[closest].x - mouseX);
            return dist < closestDist ? index : closest;
        }, 0);

        const pointData = data[closestPointIndex];
        setTooltip({ x: points[closestPointIndex].x, y: points[closestPointIndex].y, data: pointData });
    };

    if (!data || data.length < 2) {
        return <div style={{height: `${height}px`}} className="flex items-center justify-center text-content-200 bg-base-300/50 rounded-lg"><p>Dados insuficientes para exibir o gráfico.</p></div>;
    }
    
    return (
        <div className="relative">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTooltip(null)}
                className="w-full h-auto"
            >
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#gradient-${color})`} />
                <path d={path} fill="none" stroke={color} strokeWidth="2" />
                {tooltip && (
                    <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={color} stroke="white" strokeWidth="2" />
                )}
            </svg>
            {tooltip && (
                <div className="absolute bg-base-100 text-content-100 p-2 rounded-md shadow-lg text-xs pointer-events-none" style={{
                    left: `${(tooltip.x / width) * 100}%`,
                    top: `${(tooltip.y / height) * 100}%`,
                    transform: `translate(-50%, -120%)`,
                }}>
                    <div>{new Date(tooltip.data.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
                    <div className="font-bold">{tooltip.data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
            )}
        </div>
    );
};

const LoadingSpinner: React.FC<{text?: string, subtext?: string}> = ({text, subtext}) => (
  <div className="flex flex-col items-center justify-center text-center p-8 text-content-200">
    <LoaderCircle className="animate-spin h-12 w-12 text-brand-primary mb-4" />
    <p className="font-semibold">{text || "Carregando..."}</p>
    {subtext && <p className="text-sm">{subtext}</p>}
  </div>
);

const ErrorDisplay: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 mt-10 bg-base-200 rounded-lg shadow-md">
      <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
      <h3 className="text-xl font-semibold text-content-100">Ops! Algo deu errado</h3>
      <p className="text-sm text-content-200 mt-2 mb-6 max-w-sm">
          Não conseguimos buscar os dados. Por favor, verifique sua conexão e tente novamente.
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
  const [portfolio, setPortfolio] = useState<FII[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<HistoricalDataPoint[]>([]);
  const [individualHistories, setIndividualHistories] = useState<Record<string, HistoricalDataPoint[]>>({});
  const [selectedFii, setSelectedFii] = useState<string | null>(null);
  
  const [chartPeriod, setChartPeriod] = useState<ChartPeriodKey>('1M');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (periodKey: ChartPeriodKey) => {
    setIsLoading(true);
    setIsChartLoading(true);
    setError(null);
    try {
      // 1. Fetch current market data
      const tickers = basePortfolio.map(fii => fii.ticker);
      const marketData: FIIMarketData[] = await fetchFIIMarketData(tickers);
      const marketDataMap = new Map(marketData.map(data => [data.ticker, data]));

      const fullPortfolioData: FII[] = basePortfolio.map(baseFii => {
        const data = marketDataMap.get(baseFii.ticker);
        return { ...baseFii, name: data?.name || 'Nome não encontrado', currentPrice: data?.currentPrice || 0 };
      }).filter(fii => fii.currentPrice > 0);
      setPortfolio(fullPortfolioData);
      setIsLoading(false);

      // 2. Fetch historical data in parallel
      const periodInDays = chartPeriods[periodKey].days;
      const historyPromises = basePortfolio.map(fii => fetchFIIHistoricalData(fii.ticker, periodInDays));
      const histories = await Promise.all(historyPromises);

      const individualHistoryMap: Record<string, HistoricalDataPoint[]> = {};
      basePortfolio.forEach((fii, index) => {
        individualHistoryMap[fii.ticker] = histories[index];
      });
      setIndividualHistories(individualHistoryMap);
      
      // 3. Aggregate portfolio history
      const portfolioHistoryMap = new Map<string, number>();
      basePortfolio.forEach((fii, index) => {
          const quantity = fii.quantity;
          const history = histories[index];
          history.forEach(dataPoint => {
              const currentValue = portfolioHistoryMap.get(dataPoint.date) || 0;
              portfolioHistoryMap.set(dataPoint.date, currentValue + dataPoint.value * quantity);
          });
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
  }, []);

  useEffect(() => {
    loadData(chartPeriod);
  }, [loadData, chartPeriod]);
  
  const handleFiiSelect = (ticker: string) => {
      setSelectedFii(prev => (prev === ticker ? null : ticker));
  };

  const totalValue = portfolio.reduce((acc, fii) => acc + (fii.quantity * fii.currentPrice), 0);

  const renderContent = () => {
    if (isLoading && portfolio.length === 0) {
      return <LoadingSpinner text="Sincronizando com o mercado..." subtext="Buscando cotações atuais para seus ativos."/>;
    }
    if (error) {
      return <ErrorDisplay message={error} onRetry={() => loadData(chartPeriod)} />;
    }
    return (
      <div className="flex flex-col gap-8">
        <div className="bg-brand-primary text-white p-6 rounded-xl shadow-lg flex flex-col items-start w-full">
            <div className="flex items-center"><DollarSign size={28}/><h2 className="text-xl font-semibold ml-2">Patrimônio Total</h2></div>
          <p className="text-4xl font-bold mt-2">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        
        <div className="bg-base-200 p-4 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-content-100 mb-4">Desempenho da Carteira</h3>
             <div className="flex justify-center space-x-1 sm:space-x-2 bg-base-300 p-1 rounded-lg mb-4">
                {(Object.keys(chartPeriods) as ChartPeriodKey[]).map(key => (
                    <button key={key} onClick={() => setChartPeriod(key)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-full ${chartPeriod === key ? 'bg-brand-primary text-white shadow' : 'text-content-200 hover:bg-base-100'}`}>
                        {chartPeriods[key].label}
                    </button>
                ))}
            </div>
            {isChartLoading ? <LoadingSpinner text="Calculando desempenho..."/> : <InteractiveChart data={portfolioHistory} color="#10B981" />}
        </div>

        <div>
            <h3 className="text-xl font-semibold text-content-100 mb-4">Meus Ativos</h3>
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
