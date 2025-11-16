import React from 'react';
import { LoaderCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  subtext?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text, subtext }) => (
  <div className="flex flex-col items-center justify-center text-center p-8 text-content-200">
    <LoaderCircle className="animate-spin h-12 w-12 text-brand-primary mb-4" />
    <p className="font-semibold">{text || "Carregando..."}</p>
    {subtext && <p className="text-sm">{subtext}</p>}
  </div>
);

export default LoadingSpinner;
