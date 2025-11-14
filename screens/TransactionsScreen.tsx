import React from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { Transaction } from '../types';
import { Inbox } from 'lucide-react';

const TransactionsScreen: React.FC = () => {
  // Apagando as informações simuladas
  const transactions: Transaction[] = [];

  return (
    <div>
      <ScreenHeader title="Transações" subtitle="Histórico de movimentações" />
      <div className="p-4">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-10 text-content-200">
            <Inbox size={48} className="mb-4" />
            <h3 className="text-lg font-semibold">Nenhuma Transação</h3>
            <p className="text-sm">Suas compras e vendas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* A lógica de renderização foi removida */}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsScreen;
