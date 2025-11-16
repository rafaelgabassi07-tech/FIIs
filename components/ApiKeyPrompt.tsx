
import React, { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import ApiKeyModal from './ApiKeyModal';

interface ApiKeyPromptProps {
  onKeyConfigured: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onKeyConfigured }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Give a moment for the key to be saved before reloading data
    setTimeout(() => {
        onKeyConfigured();
    }, 200);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center text-center p-8 mt-10 bg-base-200 rounded-lg shadow-md">
        <KeyRound className="h-12 w-12 text-yellow-400 mb-4" />
        <h3 className="text-xl font-semibold text-content-100">Configuração Necessária</h3>
        <p className="text-sm text-content-200 mt-2 mb-6 max-w-sm">
          Para buscar dados de mercado e notícias, precisamos da sua chave de API do Google AI.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
        >
          Configurar Chave de API
        </button>
        <div className="flex items-center text-xs text-content-200 mt-4">
            <ShieldCheck size={14} className="mr-1 text-green-400"/>
            <span>Sua chave é salva com segurança apenas no seu navegador.</span>
        </div>
      </div>
      {isModalOpen && <ApiKeyModal onClose={handleModalClose} />}
    </>
  );
};

export default ApiKeyPrompt;
