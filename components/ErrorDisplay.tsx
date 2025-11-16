import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry: () => void;
  details?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ title, message, onRetry, details }) => (
  <div className="flex flex-col items-center justify-center text-center p-8 mt-10 bg-base-200 rounded-lg shadow-md">
    <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
    <h3 className="text-xl font-semibold text-content-100">{title || "Ops! Algo deu errado"}</h3>
    <p className="text-sm text-content-200 mt-2 mb-6 max-w-sm">
        {message}
    </p>
    <button
      onClick={onRetry}
      className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
    >
      Tentar Novamente
    </button>
    {details && <p className="text-xs text-base-300 mt-4 italic">Detalhe: {details}</p>}
  </div>
);

export default ErrorDisplay;
