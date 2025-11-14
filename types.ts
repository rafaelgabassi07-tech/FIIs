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
  type: 'Compra' | 'Venda';
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
