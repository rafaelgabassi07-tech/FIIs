
import React, { useState, useEffect } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { Transaction } from '../types';
import { Plus, Trash2, X, Inbox, ArrowDown, ArrowUp } from 'lucide-react';

const TransactionModal: React.FC<{
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}> = ({ onClose, onAdd }) => {
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'Compra' | 'Venda'>('Compra');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !quantity || !price || !date) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    const numQuantity = parseFloat(quantity);
    const numPrice = parseFloat(price);
    if (isNaN(numQuantity) || numQuantity <= 0 || isNaN(numPrice) || numPrice <= 0) {
      setError('Quantidade e preço devem ser números positivos.');
      return;
    }
    setError('');
    onAdd({
      ticker: ticker.toUpperCase().trim(),
      type,
      quantity: numQuantity,
      price: numPrice,
      date,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-200 rounded-lg shadow-xl w-full max-w-md relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-3 right-3 text-content-200 hover:text-content-100">
          <X size={24} />
        </button>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-content-100">Nova Transação</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ticker" className="block text-sm font-medium text-content-200 mb-1">Ticker do Ativo</label>
              <input
                id="ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Ex: MXRF11"
                className="w-full bg-base-300 border border-base-100 rounded-md px-3 py-2 text-content-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                maxLength={6}
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-content-200 mb-2">Tipo de Operação</label>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setType('Compra')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md border-2 transition-colors ${type === 'Compra' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-base-300 border-transparent text-content-200'}`}>
                        <ArrowDown size={16} /> Compra
                    </button>
                    <button type="button" onClick={() => setType('Venda')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md border-2 transition-colors ${type === 'Venda' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-base-300 border-transparent text-content-200'}`}>
                        <ArrowUp size={16} /> Venda
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-content-200 mb-1">Quantidade</label>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="10"
                  className="w-full bg-base-300 border border-base-100 rounded-md px-3 py-2 text-content-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-content-200 mb-1">Preço (R$)</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="10.50"
                  className="w-full bg-base-300 border border-base-100 rounded-md px-3 py-2 text-content-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-content-200 mb-1">Data</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-base-300 border border-base-100 rounded-md px-3 py-2 text-content-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="pt-2">
                <button
                    type="submit"
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
                >
                    Adicionar Transação
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


const TransactionsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const storedTransactions = localStorage.getItem('fii-transactions');
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (error) {
      console.error("Failed to parse transactions from localStorage", error);
    }
  }, []);

  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem('fii-transactions', JSON.stringify(newTransactions));
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

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                return (
                  <div key={tx.id} className="bg-base-200 p-4 rounded-lg flex items-center justify-between shadow">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBuy ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {isBuy ? <ArrowDown className="text-green-400" size={20} /> : <ArrowUp className="text-red-400" size={20} />}
                        </div>
                        <div>
                            <p className="font-bold text-lg text-content-100">{tx.ticker}</p>
                            <p className="text-sm text-content-200">
                                {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                       <p className={`font-semibold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                           {isBuy ? '+' : '-'} {tx.quantity} @ {tx.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                       </p>
                       <p className="text-sm text-content-200">
                           Total: {(tx.quantity * tx.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                       </p>
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
