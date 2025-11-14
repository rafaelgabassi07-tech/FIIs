
import React, { useState, useEffect, useRef } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { NewsArticle, GroundingSource } from '../types';
import { fetchFIINews } from '../services/geminiService';
import { LoaderCircle, ExternalLink, AlertTriangle } from 'lucide-react';

const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
  <div className="bg-base-200 rounded-lg p-5 shadow-md">
    <p className="text-sm text-content-200 mb-1">{article.date}</p>
    <h3 className="text-lg font-bold text-content-100 mb-2">{article.title}</h3>
    <p className="text-content-200 leading-relaxed">{article.summary}</p>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-center p-8 text-content-200">
    <LoaderCircle className="animate-spin h-12 w-12 text-brand-primary mb-4" />
    <p className="font-semibold">Buscando as últimas notícias...</p>
    <p className="text-sm">Aguarde, a IA está consultando a web para você.</p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="text-center p-8 mt-10 bg-base-200 rounded-lg shadow-md">
    <AlertTriangle className="h-12 w-12 text-red-400 mb-4 mx-auto" />
    <h3 className="text-xl font-semibold text-content-100">Falha ao buscar notícias</h3>
    <p className="text-sm text-content-200 mt-2 mb-6 max-w-sm mx-auto">{message}</p>
    <button
      onClick={onRetry}
      className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
    >
      Tentar Novamente
    </button>
  </div>
);

const NewsScreen: React.FC = () => {
  const [newsData, setNewsData] = useState<{ articles: NewsArticle[], sources: GroundingSource[] }>({ articles: [], sources: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const runNewsCheck = async () => {
      const hasData = !!localStorage.getItem('fiiNewsData');
      if (!hasData) {
        setIsLoading(true);
      }
      setError(null);
      
      if (hasData) {
        setNewsData(JSON.parse(localStorage.getItem('fiiNewsData')!));
      }

      const now = new Date();
      const day = now.getDay();
      const isWeekend = day === 0 || day === 6;
      const lastFetchTimestamp = parseInt(localStorage.getItem('fiiNewsTimestamp') || '0', 10);
      let shouldFetch = false;

      if (!isWeekend) {
        const today9AM = new Date(now).setHours(9, 0, 0, 0);
        const today2PM = new Date(now).setHours(14, 0, 0, 0);
        if (now.getTime() >= today2PM && lastFetchTimestamp < today2PM) shouldFetch = true;
        else if (now.getTime() >= today9AM && now.getTime() < today2PM && lastFetchTimestamp < today9AM) shouldFetch = true;
      }
      if (!hasData && !isWeekend && now.getHours() >= 9) shouldFetch = true;
      
      if (shouldFetch) {
        try {
          const { articles, sources } = await fetchFIINews();
          const dataToStore = { articles, sources };
          setNewsData(dataToStore);
          localStorage.setItem('fiiNewsData', JSON.stringify(dataToStore));
          localStorage.setItem('fiiNewsTimestamp', String(now.getTime()));
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Ocorreu um erro desconhecido.');
            }
        }
      }

      setIsLoading(false);

      const getNextCheckTime = (): Date => {
        const nextCheck = new Date();
        const currentHour = nextCheck.getHours();
        const currentDay = nextCheck.getDay();

        if (currentDay === 6) { // Saturday
          nextCheck.setDate(nextCheck.getDate() + 2);
          nextCheck.setHours(9, 0, 1, 0);
          return nextCheck;
        }
        if (currentDay === 0) { // Sunday
          nextCheck.setDate(nextCheck.getDate() + 1);
          nextCheck.setHours(9, 0, 1, 0);
          return nextCheck;
        }
        
        if (currentHour < 9) {
          nextCheck.setHours(9, 0, 1, 0);
        } else if (currentHour < 14) {
          nextCheck.setHours(14, 0, 1, 0);
        } else {
          const daysToAdd = currentDay === 5 ? 3 : 1;
          nextCheck.setDate(nextCheck.getDate() + daysToAdd);
          nextCheck.setHours(9, 0, 1, 0);
        }
        return nextCheck;
      };

      const nextCheckTime = getNextCheckTime();
      setStatusMessage(`Próxima atualização: ${nextCheckTime.toLocaleString('pt-BR')}`);
      
      const delay = nextCheckTime.getTime() - new Date().getTime();
      if (delay > 0) {
        timerRef.current = window.setTimeout(runNewsCheck, delay);
      }
    };

    runNewsCheck();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (error && newsData.articles.length === 0) {
      return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;
    }
    return (
      <>
        {error && (
            <div className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4 text-center text-sm">
                Falha na última atualização. Exibindo dados anteriores. Erro: {error}
            </div>
        )}
        <div className="space-y-4">
          {newsData.articles.map((article, index) => (
            <NewsCard key={index} article={article} />
          ))}
        </div>

        {newsData.sources.length > 0 && (
          <div className="mt-8 pt-6 border-t border-base-300">
            <h3 className="text-xl font-semibold text-content-100 mb-4">Fontes</h3>
            <ul className="space-y-3">
              {newsData.sources.map((source, index) => (
                <li key={index} className="bg-base-200 p-3 rounded-lg">
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-brand-primary hover:text-brand-secondary transition-colors"
                  >
                    <ExternalLink size={16} className="mr-2 flex-shrink-0" />
                    <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };
  
  return (
    <div>
      <ScreenHeader title="Notícias" subtitle="Fique por dentro do mercado de FIIs" />
      <div className="p-4">
        <div className="text-center text-sm text-content-200 mb-4 bg-base-200 p-2 rounded-md shadow">
          <p>{statusMessage || 'Verificando atualizações...'}</p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default NewsScreen;
