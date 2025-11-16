import React, { useState, useEffect, useMemo } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { Transaction } from '../types';
import { Plus, Trash2, Inbox, ArrowDown, ArrowUp, Gift } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { TRANSACTIONS_STORAGE_KEY } from '../constants';

const TransactionsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (error) {
      console.error("Failed to parse transactions from localStorage", error);
    }
  }, []);

  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(newTransactions));
  };
  
  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: new Date().toISOString() + Math.random(),
    };
    const updatedTransactions = [...transactions, newTransaction].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveTransactions(updatedTransactions);
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
        const updatedTransactions = transactions.filter(t => t.id !== id);
        saveTransactions(updatedTransactions);
    }
  };

  const sortedTransactions = useMemo(() => 
    [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );

  return (
    <>
      <div className="relative">
        <ScreenHeader title="Transações" subtitle="Histórico de movimentações" />
        <div className="p-4 pb-24">
          {sortedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 mt-10 text-content-200">
              <Inbox size={48} className="mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma Transação</h3>
              <p className="text-sm">Clique no botão '+' para adicionar sua primeira compra ou venda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTransactions.map((tx) => {
                const isBuy = tx.type === 'Compra';
                const isDividend = tx.type === 'Dividendo';
                return (
                  <div key={tx.id} className="bg-base-200 p-4 rounded-lg flex items-center justify-between shadow">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBuy ? 'bg-green-500/20' : isDividend ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                            {isBuy ? <ArrowDown className="text-green-400" size={20} /> : isDividend ? <Gift className="text-yellow-400" size={20}/> : <ArrowUp className="text-red-400" size={20} />}
                        </div>
                        <div>
                            <p className="font-bold text-lg text-content-100">{tx.ticker}</p>
                            <p className="text-sm text-content-200">
                                {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </p>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                       {isDividend ? (
                          <p className="font-semibold text-yellow-400">
                              + {tx.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                       ) : (
                           <>
                               <p className={`font-semibold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                                   {isBuy ? '+' : '-'} {tx.quantity} @ {tx.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                               </p>
                               <p className="text-sm text-content-200">
                                   Total: {(tx.quantity * tx.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                               </p>
                           </>
                       )}
                    </div>
                     <button onClick={() => handleDeleteTransaction(tx.id)} className="text-content-200 hover:text-red-400 ml-2 p-2 rounded-full hover:bg-base-300">
                        <Trash2 size={18} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-6 bg-brand-primary hover:bg-brand-secondary text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-primary"
          aria-label="Adicionar nova transação"
        >
          <Plus size={28} />
        </button>
      </div>

      {isModalOpen && <TransactionModal onClose={() => setIsModalOpen(false)} onAdd={handleAddTransaction} />}
    </>
  );
};

export default TransactionsScreen;
