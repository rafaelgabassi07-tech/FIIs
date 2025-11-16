import React, { useState, useEffect, useMemo } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { Transaction } from '../types';
import { Plus, Trash2, Inbox, ArrowDown, ArrowUp, Gift, Pencil } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { TRANSACTIONS_STORAGE_KEY } from '../constants';

const TransactionsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
    const sorted = newTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(sorted);
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(sorted));
  };
  
  const handleSaveTransaction = (transactionData: Omit<Transaction, 'id'> | Transaction) => {
    let updatedTransactions;
    if ('id' in transactionData) { // Editing existing
        updatedTransactions = transactions.map(t => t.id === transactionData.id ? transactionData : t);
    } else { // Adding new
        const newTransaction: Transaction = {
          ...transactionData,
          id: new Date().toISOString() + Math.random(),
        };
        updatedTransactions = [...transactions, newTransaction];
    }
    saveTransactions(updatedTransactions);
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
        const updatedTransactions = transactions.filter(t => t.id !== id);
        saveTransactions(updatedTransactions);
    }
  };
  
  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };


  return (
    <>
      <div className="relative">
        <ScreenHeader title="Transações" subtitle="Histórico de movimentações" />
        <div className="p-4 pb-24">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 mt-10 text-content-200">
              <Inbox size={48} className="mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma Transação</h3>
              <p className="text-sm">Clique no botão '+' para adicionar sua primeira compra ou venda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isBuy = tx.type === 'Compra';
                const isDividend = tx.type === 'Dividendo';
                return (
                  <div key={tx.id} className="bg-base-200 p-4 rounded-lg flex items-center justify-between shadow">
                    <div className="flex items-center gap-4 flex-grow min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isBuy ? 'bg-green-500/20' : isDividend ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                            {isBuy ? <ArrowDown className="text-green-400" size={20} /> : isDividend ? <Gift className="text-yellow-400" size={20}/> : <ArrowUp className="text-red-400" size={20} />}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-lg text-content-100 truncate">{tx.ticker}</p>
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
                    <div className="flex items-center flex-shrink-0">
                        <button onClick={() => handleOpenEditModal(tx)} className="text-content-200 hover:text-brand-primary ml-2 p-2 rounded-full hover:bg-base-300">
                           <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDeleteTransaction(tx.id)} className="text-content-200 hover:text-red-400 ml-1 p-2 rounded-full hover:bg-base-300">
                           <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        <button
          onClick={handleOpenAddModal}
          className="fixed bottom-24 right-6 bg-brand-primary hover:bg-brand-secondary text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-primary"
          aria-label="Adicionar nova transação"
        >
          <Plus size={28} />
        </button>
      </div>

      {isModalOpen && <TransactionModal onClose={handleCloseModal} onSubmit={handleSaveTransaction} transactionToEdit={editingTransaction} />}
    </>
  );
};

export default TransactionsScreen;