
import { GoogleGenAI } from "@google/genai";
import { NewsArticle, GroundingSource, HistoricalDataPoint } from '../types';
import { API_KEY_STORAGE_KEY } from '../constants';

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
      throw new Error("Chave de API do Google AI não configurada. Por favor, adicione sua chave na aba 'Menu'.");
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


const CHUNK_SIZE = 5;
const REQUEST_DELAY = 1000; // 1 second delay between chunks

export const fetchFIIsFullData = async (
  tickers: string[],
  periodInDays: number
): Promise<Record<string, FIIFullData>> => {
  if (tickers.length === 0) {
    return {};
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
            }
        } catch (parseError) {
            console.error("Error parsing JSON from Gemini response:", parseError);
            console.error("Original response text for debugging:", response.text);
            throw new Error("A IA retornou dados em um formato inesperado. Tente novamente.");
        }
        
        if (tickerChunks.indexOf(chunk) < tickerChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
        }
    }
    
    return allData;

  } catch (error) {
    console.error("Error fetching FII data:", error);
    if (error instanceof Error && error.message.includes("não configurada")) {
        throw error;
    }
    throw new Error("Não foi possível buscar os dados dos FIIs. A IA pode estar sobrecarregada ou ocorreu um erro de rede. Tente novamente mais tarde.");
  }
};


export const fetchFIINews = async (): Promise<{ articles: NewsArticle[], sources: GroundingSource[] }> => {
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

    return { articles, sources };

  } catch (error) {
    console.error("Error fetching FII news:", error);
     if (error instanceof Error && error.message.includes("não configurada")) {
        throw error;
    }
    throw new Error("Não foi possível buscar as notícias. A IA pode estar ocupada, tente novamente.");
  }
};
