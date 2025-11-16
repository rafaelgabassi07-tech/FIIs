import React, { useState } from 'react';
import { Transaction } from '../types';
import { X, ArrowDown, ArrowUp, Gift } from 'lucide-react';

interface TransactionModalProps {
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, onAdd }) => {
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'Compra' | 'Venda' | 'Dividendo'>('Compra');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    const numQuantity = type === 'Dividendo' ? 1 : parseFloat(quantity);
    
    if (!ticker || !price || !date || (type !== 'Dividendo' && !quantity)) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
        setError('O valor deve ser um número positivo.');
        return;
    }
    if (type !== 'Dividendo' && (isNaN(numQuantity) || numQuantity <= 0)) {
      setError('A quantidade deve ser um número positivo.');
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
                <div className="flex gap-2">
                    <button type="button" onClick={() => setType('Compra')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md border-2 transition-colors ${type === 'Compra' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-base-300 border-transparent text-content-200'}`}>
                        <ArrowDown size={16} /> Compra
                    </button>
                    <button type="button" onClick={() => setType('Venda')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md border-2 transition-colors ${type === 'Venda' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-base-300 border-transparent text-content-200'}`}>
                        <ArrowUp size={16} /> Venda
                    </button>
                    <button type="button" onClick={() => setType('Dividendo')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md border-2 transition-colors ${type === 'Dividendo' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-base-300 border-transparent text-content-200'}`}>
                        <Gift size={16} /> Dividendo
                    </button>
                </div>
            </div>

            {type !== 'Dividendo' ? (
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
            ) : (
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-content-200 mb-1">Valor Total Recebido (R$)</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="100.00"
                  className="w-full bg-base-300 border border-base-100 rounded-md px-3 py-2 text-content-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
            )}
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

export default TransactionModal;
