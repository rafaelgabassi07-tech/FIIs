import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { X, KeyRound, ExternalLink, Trash2 } from 'lucide-react';

interface ApiKeyModalProps {
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose }) => {
  const { apiKey, saveApiKey, removeApiKey, isLoading } = useSettings();
  const [currentKey, setCurrentKey] = useState(apiKey || '');
  const [message, setMessage] = useState('');

  const handleSave = () => {
    if (!currentKey.trim()) {
      setMessage('A chave de API não pode estar vazia.');
      return;
    }
    saveApiKey(currentKey.trim());
    setMessage('Chave de API salva com sucesso!');
    setTimeout(() => {
        onClose();
    }, 1000);
  };
  
  const handleRemove = () => {
    removeApiKey();
    setCurrentKey('');
    setMessage('Chave de API removida.');
    setTimeout(() => {
        setMessage('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-200 rounded-lg shadow-xl w-full max-w-md relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-3 right-3 text-content-200 hover:text-content-100">
          <X size={24} />
        </button>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <KeyRound className="w-8 h-8 text-brand-primary mr-3" />
            <h2 className="text-2xl font-bold text-content-100">Chave de API do Gemini</h2>
          </div>
          
          <p className="text-sm text-content-200 mb-4">
            Sua chave de API é necessária para buscar dados de mercado e notícias. Ela é salva com segurança apenas no seu navegador.
          </p>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-brand-primary hover:underline mb-4"
          >
            Obtenha sua chave no Google AI Studio <ExternalLink size={14} className="ml-1" />
          </a>

          <div className="space-y-4 mt-2">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-content-200 mb-1">Sua Chave de API</label>
              <div className="flex items-center gap-2">
                <input
                  id="apiKey"
                  type="password"
                  value={currentKey}
                  onChange={(e) => setCurrentKey(e.target.value)}
                  placeholder="Cole sua chave aqui"
                  className="flex-grow w-full bg-base-300 border border-base-100 rounded-md px-3 py-2 text-content-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  disabled={isLoading}
                />
                {apiKey && (
                  <button 
                    onClick={handleRemove} 
                    className="p-2 text-content-200 hover:text-red-400 hover:bg-base-300 rounded-md"
                    aria-label="Remover chave de API"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
            
            {message && <p className="text-green-400 text-sm">{message}</p>}
            
            <div className="pt-2">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg disabled:opacity-50"
                >
                    Salvar Chave
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
