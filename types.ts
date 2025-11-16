export enum Tab {
  Carteira = 'Carteira',
  Transacoes = 'Transações',
  Noticias = 'Notícias',
  Menu = 'Menu',
}

export interface FII {
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}

export interface Transaction {
  id: string;
  ticker: string;
  type: 'Compra' | 'Venda' | 'Dividendo';
  quantity: number;
  price: number;
  date: string;
}

export interface NewsArticle {
  title: string;
  summary: string;
  date: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface HistoricalDataPoint {
  date: string;
  value: number;
}

export interface Notification {
  id: string;
  type: 'dividend' | 'update' | 'system';
  message: string;
  date: string;
  isRead: boolean;
  relatedTicker?: string;
  action?: {
    type: 'navigate';
    tab: Tab;
  };
}