
import { useState, useEffect, useMemo } from 'react';
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
            if (!portfolio[tx.ticker]) {
                portfolio[tx.ticker] = { quantity: 0, totalCost: 0 };
            }
            if (tx.type === 'Compra') {
                const existingQty = portfolio[tx.ticker].quantity;
                const existingTotalCost = portfolio[tx.ticker].totalCost;
                
                const newQty = existingQty + tx.quantity;
                const newTotalCost = existingTotalCost + (tx.quantity * tx.price);

                portfolio[tx.ticker].quantity = newQty;
                portfolio[tx.ticker].totalCost = newTotalCost;

            } else { // Venda
                portfolio[tx.ticker].quantity -= tx.quantity;
            }
        }

        return Object.entries(portfolio)
            .filter(([, data]) => data.quantity > 0.0001) // Use a small threshold for floating point issues
            .map(([ticker, data]) => ({
                ticker,
                quantity: data.quantity,
                averagePrice: data.totalCost / (data.quantity + transactions.filter(t => t.ticker === ticker && t.type === 'Venda').reduce((acc, t) => acc + t.quantity, 0)),
            }));
    }, [transactions]);

    const combineHoldingsWithMarketData = (marketData: FIIMarketData[]): FII[] => {
        const marketDataMap = new Map(marketData.map(d => [d.ticker, d]));
        return holdings.map(holding => {
            const data = marketDataMap.get(holding.ticker);
            return {
                ...holding,
                name: data?.name || 'Carregando nome...',
                currentPrice: data?.currentPrice || 0,
            };
        }).filter(fii => fii.currentPrice > 0);
    };

    return { holdings, transactions, combineHoldingsWithMarketData };
};
