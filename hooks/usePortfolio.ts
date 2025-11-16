import { useMemo, useEffect, useState, useCallback } from 'react';
import { Transaction, FII, HistoricalDataPoint } from '../types';
import { FIIMarketData } from '../services/geminiService';
import { TRANSACTIONS_STORAGE_KEY } from '../constants';

interface Holding {
  ticker: string;
  quantity: number;
  averagePrice: number;
}

interface PortfolioMetrics {
    holdings: Holding[];
    dividends: Transaction[];
    realizedGains: number;
    investedHistory: HistoricalDataPoint[];
}

export const usePortfolio = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const loadTransactions = () => {
            try {
                const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
                setTransactions(stored ? JSON.parse(stored) : []);
            } catch (e) {
                console.error("Failed to load or parse transactions:", e);
                setTransactions([]);
            }
        };

        loadTransactions();

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === TRANSACTIONS_STORAGE_KEY) {
                loadTransactions();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const { holdings, dividends, realizedGains, investedHistory } = useMemo((): PortfolioMetrics => {
        const holdingsCalc: { [key: string]: { quantity: number; totalCost: number } } = {};
        const investedHistoryMap = new Map<string, number>();
        let cumulativeInvestedCapital = 0;
        let totalRealizedGains = 0;

        const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedTxs.forEach(tx => {
            if (tx.type === 'Compra') {
                if (!holdingsCalc[tx.ticker]) holdingsCalc[tx.ticker] = { quantity: 0, totalCost: 0 };
                const cost = tx.quantity * tx.price;
                holdingsCalc[tx.ticker].quantity += tx.quantity;
                holdingsCalc[tx.ticker].totalCost += cost;
                cumulativeInvestedCapital += cost;
            } else if (tx.type === 'Venda') {
                const position = holdingsCalc[tx.ticker];
                if (position && position.quantity > 0) {
                    const averagePrice = position.totalCost / position.quantity;
                    const costOfSoldAssets = tx.quantity * averagePrice;
                    
                    totalRealizedGains += (tx.quantity * tx.price) - costOfSoldAssets;
                    
                    position.totalCost -= costOfSoldAssets;
                    position.quantity -= tx.quantity;

                    cumulativeInvestedCapital -= costOfSoldAssets;
                }
            }
            investedHistoryMap.set(tx.date, cumulativeInvestedCapital);
        });

        const finalHoldings = Object.entries(holdingsCalc)
            .filter(([, data]) => data.quantity > 0.0001) 
            .map(([ticker, data]) => ({
                ticker,
                quantity: data.quantity,
                averagePrice: data.quantity > 0 ? data.totalCost / data.quantity : 0,
            }));

        const finalDividends = transactions.filter(tx => tx.type === 'Dividendo');
        
        const finalInvestedHistory = Array.from(investedHistoryMap.entries())
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


        return { 
            holdings: finalHoldings, 
            dividends: finalDividends, 
            realizedGains: totalRealizedGains, 
            investedHistory: finalInvestedHistory 
        };
    }, [transactions]);
    
    const combineHoldingsWithMarketData = useCallback((marketData: FIIMarketData[]): FII[] => {
        const marketDataMap = new Map(marketData.map(d => [d.ticker, d]));
        return holdings.map(holding => {
            const data = marketDataMap.get(holding.ticker);
            return {
                ...holding,
                name: data?.name || 'Carregando nome...',
                currentPrice: data?.currentPrice || 0,
            };
        }).filter(fii => fii.currentPrice > 0);
    }, [holdings]);

    return { holdings, transactions, dividends, realizedGains, investedHistory, combineHoldingsWithMarketData };
};