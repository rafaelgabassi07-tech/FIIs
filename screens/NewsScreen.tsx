
import React, { useState, useEffect, useCallback } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { NewsArticle, GroundingSource } from '../types';
import { fetchFIINews } from '../services/geminiService';
import { ExternalLink, Inbox } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';

const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
  <div className="bg-base-200 rounded-lg p-5 shadow-md animate-fade-in-up">
    <p className="text-sm text-content-200 mb-1">{article.date}</p>
    <h3 className="text-lg font-bold text-content-100 mb-2">{article.title}</h3>
    <p className="text-content-200 leading-relaxed">{article.summary}</p>
  </div>
);

const NewsScreen: React.FC = () => {
  const [newsData, setNewsData] = useState<{ articles: NewsArticle[], sources: GroundingSource[] }>({ articles: [], sources: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFIINews();
      setNewsData(data);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Ocorreu um erro desconhecido.');
        }
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner text="Buscando as últimas notícias..." subtext="Aguarde, a IA está consultando a web para você." />;
    }
    if (error) {
      return <ErrorDisplay title="Falha ao buscar notícias" message={error} onRetry={loadNews} />;
    }
    if (newsData.articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 mt-10 text-content-200">
              <Inbox size={48} className="mb-4 text-brand-primary" />
              <h3 className="text-lg font-semibold text-content-100">Nenhuma notícia encontrada</h3>
              <p className="text-sm mt-1">Os dados podem estar cacheados. Tente novamente mais tarde.</p>
            </div>
        )
    }
    return (
      <>
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
        {renderContent()}
      </div>
    </div>
  );
};

export default NewsScreen;