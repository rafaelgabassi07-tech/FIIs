
import { GoogleGenAI } from "@google/genai";
import { NewsArticle, GroundingSource, HistoricalDataPoint } from '../types';
import { API_KEY_STORAGE_KEY } from '../constants';
import cacheService from './cacheService';

export class ApiKeyMissingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ApiKeyMissingError';
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class ParsingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ParsingError';
    }
}


const getApiKey = (): string | null => {
    try {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch {
        // LocalStorage might be disabled or unavailable
        return null;
    }
};

const getAi = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
      throw new ApiKeyMissingError("Chave de API do Google AI não configurada. Por favor, adicione sua chave na aba 'Menu'.");
  }
  return new GoogleGenAI({ apiKey });
}

export interface FIIMarketData {
    ticker: string;
    name: string;
    currentPrice: number;
}

export interface FIIFullData {
    ticker: string;
    name: string;
    currentPrice: number;
    history: HistoricalDataPoint[];
}

export interface DividendEvent {
    ticker: string;
    type: 'Data Com' | 'Pagamento';
    date: string;
}


const CHUNK_SIZE = 5;
const REQUEST_DELAY = 1000; // 1 second delay between chunks

export const fetchFIIsFullData = async (
  tickers: string[],
  periodInDays: number
): Promise<Record<string, FIIFullData>> => {
  if (tickers.length === 0) {
    return {};
  }
  
  const sortedTickersKey = [...tickers].sort().join(',');
  const cacheKey = `fiis-full-data-${periodInDays}-${sortedTickersKey}`;
  const cachedData = cacheService.get<Record<string, FIIFullData>>(cacheKey);
  if (cachedData) {
      return cachedData;
  }

  try {
    const ai = getAi();
    const tickerChunks = [];
    for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
        tickerChunks.push(tickers.slice(i, i + CHUNK_SIZE));
    }

    const allData: Record<string, FIIFullData> = {};

    for (const chunk of tickerChunks) {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Para cada um dos tickers de FIIs brasileiros a seguir: ${chunk.join(', ')}, use a busca para encontrar o nome completo do fundo e seu histórico de preços de fechamento diários dos últimos ${periodInDays} dias. O preço mais recente deve ser o do último dia de negociação disponível. Formate a resposta como um único bloco de código JSON com a seguinte estrutura: {"fiis": [{"ticker": "...", "name": "...", "history": [{"date": "YYYY-MM-DD", "value": 123.45}]}]}. Não inclua nenhum texto ou formatação além do JSON.`,
          config: {
            tools: [{googleSearch: {}}],
          },
        });
        
        let jsonString = response.text;
        
        const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
        } else {
            const startIndex = jsonString.indexOf('{');
            const endIndex = jsonString.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1) {
                jsonString = jsonString.substring(startIndex, endIndex + 1);
            }
        }
        
        try {
            if (!jsonString.trim()) {
                throw new Error("Empty response from AI.");
            }
            const parsed = JSON.parse(jsonString);

            if (parsed.fiis) {
              for (const item of parsed.fiis) {
                const history = (item.history || []).sort(
                    (a: HistoricalDataPoint, b: HistoricalDataPoint) => 
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                const currentPrice = history.length > 0 ? history[history.length - 1].value : 0;
                if (item.ticker) {
                    allData[item.ticker] = {
                        ticker: item.ticker,
                        name: item.name || 'Nome não encontrado',
                        history: history,
                        currentPrice: currentPrice,
                    };
                }
              }
            } else {
                 throw new Error("JSON response is missing the 'fiis' property.");
            }
        } catch (parseError) {
            console.error("Error parsing JSON from Gemini response:", parseError);
            console.error("Original response text for debugging:", response.text);
            throw new ParsingError("A IA retornou dados em um formato inesperado. Tente novamente.");
        }
        
        if (tickerChunks.indexOf(chunk) < tickerChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
        }
    }
    
    cacheService.set(cacheKey, allData, 15); // Cache de 15 minutos
    return allData;

  } catch (error) {
    console.error("Error fetching FII data:", error);
    if (error instanceof ApiKeyMissingError || error instanceof ParsingError) {
        throw error;
    }
    throw new NetworkError("Não foi possível buscar os dados dos FIIs. A IA pode estar sobrecarregada ou ocorreu um erro de rede. Tente novamente mais tarde.");
  }
};


export const fetchFIINews = async (): Promise<{ articles: NewsArticle[], sources: GroundingSource[] }> => {
  const cacheKey = 'fii-news';
  const cachedData = cacheService.get<{ articles: NewsArticle[], sources: GroundingSource[] }>(cacheKey);
  if (cachedData) {
      return cachedData;
  }

  try {
    const ai = getAi();
    const prompt = `Usando a busca, encontre e resuma as 5 notícias mais importantes e recentes sobre o mercado de Fundos de Investimento Imobiliário (FIIs) no Brasil. Para cada notícia, forneça um título, um resumo e a data. A resposta DEVE ser um único bloco de código JSON, sem nenhum texto ou explicação adicional, apenas o JSON. O formato do JSON deve ser: { "articles": [ { "title": "...", "summary": "...", "date": "..." } ] }`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    let jsonString = response.text;
    
    const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
    } else {
        const startIndex = jsonString.indexOf('{');
        const endIndex = jsonString.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonString = jsonString.substring(startIndex, endIndex + 1);
        }
    }

    let articles: NewsArticle[] = [];
    try {
        const parsed = JSON.parse(jsonString);
        articles = parsed.articles || [];
    } catch (parseError) {
        console.error("Error parsing JSON from Gemini news response:", parseError);
        console.error("Original news response text for debugging:", response.text);
        throw new ParsingError("A IA retornou as notícias em um formato inesperado.");
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const uniqueSources = new Map<string, GroundingSource>();
    groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
            uniqueSources.set(chunk.web.uri, {
                uri: chunk.web.uri,
                title: chunk.web.title
            });
        }
    });
    
    const sources = Array.from(uniqueSources.values());
    const result = { articles, sources };
    
    cacheService.set(cacheKey, result, 12 * 60); // Cache de 12 horas
    return result;

  } catch (error) {
    console.error("Error fetching FII news:", error);
     if (error instanceof ApiKeyMissingError || error instanceof ParsingError) {
        throw error;
    }
    throw new NetworkError("Não foi possível buscar as notícias. A IA pode estar ocupada, tente novamente.");
  }
};

export const fetchDividendCalendar = async (tickers: string[]): Promise<DividendEvent[]> => {
    if (tickers.length === 0) {
        return [];
    }
    const sortedTickersKey = [...tickers].sort().join(',');
    const cacheKey = `dividend-calendar-${sortedTickersKey}`;
    const cachedData = cacheService.get<DividendEvent[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Para os FIIs a seguir: ${tickers.join(', ')}, use a busca para encontrar as próximas datas de "Data Com" e "Data de Pagamento" de dividendos já anunciados. Se não houver data anunciada, não inclua o ticker. Formate a resposta como um único bloco de código JSON com a estrutura: {"events": [{"ticker": "...", "type": "Data Com" | "Pagamento", "date": "YYYY-MM-DD"}]}. Não inclua texto ou formatação além do JSON.`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        let jsonString = response.text;
        
        const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
        } else {
            const startIndex = jsonString.indexOf('{');
            const endIndex = jsonString.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1) {
                jsonString = jsonString.substring(startIndex, endIndex + 1);
            }
        }
        
        const parsed = JSON.parse(jsonString);
        const events = (parsed.events || []) as DividendEvent[];
        
        cacheService.set(cacheKey, events, 24 * 60); // Cache for 24 hours
        return events;

    } catch (error) {
        console.error("Error fetching dividend calendar:", error);
        // Don't throw a fatal error, just return empty array
        return [];
    }
};