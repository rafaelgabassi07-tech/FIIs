import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, FII } from '../types';
import { FIIMarketData } from '../services/geminiService';

interface Holding {
  ticker: string;
  quantity: number;
  averagePrice: number;
}

export const usePortfolio = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const loadTransactions = () => {
            try {
                const stored = localStorage.getItem('fii-transactions');
                setTransactions(stored ? JSON.parse(stored) : []);
            } catch (e) {
                console.error("Failed to load or parse transactions:", e);
                setTransactions([]);
            }
        };

        loadTransactions();

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'fii-transactions') {
                loadTransactions();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const holdings = useMemo((): Holding[] => {
        const portfolio: { [key: string]: { quantity: number; totalCost: number } } = {};

        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (const tx of sortedTransactions) {
            if (tx.type === 'Dividendo') continue;

            if (!portfolio[tx.ticker]) {
                portfolio[tx.ticker] = { quantity: 0, totalCost: 0 };
            }
            if (tx.type === 'Compra') {
                portfolio[tx.ticker].quantity += tx.quantity;
                portfolio[tx.ticker].totalCost += tx.quantity * tx.price;
            } else { // Venda
                const currentPosition = portfolio[tx.ticker];
                if (currentPosition.quantity > 0) {
                    const averagePrice = currentPosition.totalCost / currentPosition.quantity;
                    currentPosition.totalCost -= tx.quantity * averagePrice;
                }
                currentPosition.quantity -= tx.quantity;
            }
        }

        return Object.entries(portfolio)
            .filter(([, data]) => data.quantity > 0.0001) 
            .map(([ticker, data]) => ({
                ticker,
                quantity: data.quantity,
                averagePrice: data.quantity > 0 ? data.totalCost / data.quantity : 0,
            }));
    }, [transactions]);

    const dividends = useMemo((): Transaction[] => {
        return transactions.filter(tx => tx.type === 'Dividendo');
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

    return { holdings, transactions, dividends, combineHoldingsWithMarketData };
};