
import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle, GroundingSource, HistoricalDataPoint } from '../types';

// Fix: Adhering to the coding guidelines to use process.env.API_KEY instead of import.meta.env.VITE_API_KEY.
// This resolves the TypeScript error 'Property 'env' does not exist on type 'ImportMeta''
// and aligns with standard practices for handling environment variables.
const getAi = () => {
  // The API key is retrieved from environment variables.
  // It is expected to be set in the deployment environment.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // This will be caught by the calling function's try-catch block.
    throw new Error("API_KEY not found in environment variables.");
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
        // Fix: The model needs grounding to access real-time financial data.
        // Switched to using googleSearch and a more directive prompt to ensure data freshness and reliable JSON output.
        // This replaces the previous implementation that used responseSchema without grounding, which was likely failing.
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Usando a busca, para os FIIs brasileiros com os tickers '${chunk.join(', ')}', forneça o nome completo e os dados históricos de preço de fechamento diário dos últimos ${periodInDays} dias. O preço mais recente deve ser o preço de fechamento do último dia de negociação. A resposta DEVE ser um único bloco de código JSON, sem nenhum texto ou explicação adicional, apenas o JSON. O formato do JSON deve ser: { "fiis": [ { "ticker": "...", "name": "...", "history": [ { "date": "YYYY-MM-DD", "value": 123.45 } ] } ] }`,
          config: {
            tools: [{googleSearch: {}}],
          },
        });
        
        let jsonString = response.text;
        
        // Robustly extract JSON from the response text.
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
    // Fix: Improved error message to be more helpful, covering both missing and invalid API keys.
    if (error instanceof Error && (error.message.includes("API_KEY") || error.message.includes("API key"))) {
        throw new Error("Falha na autenticação com a API. Verifique se sua chave de API (API_KEY) está configurada corretamente, é válida e possui as permissões necessárias.");
    }
    throw new Error("Não foi possível buscar os dados dos FIIs. A IA pode estar sobrecarregada ou ocorreu um erro de rede. Tente novamente mais tarde.");
  }
};


export const fetchFIINews = async (): Promise<{ articles: NewsArticle[], sources: GroundingSource[] }> => {
  try {
    const ai = getAi();
    const prompt = `Busque e resuma as 10 notícias mais importantes da semana sobre o mercado de Fundos de Investimento Imobiliário (FIIs) no Brasil. Para cada notícia, forneça um título, um resumo e a data.`;
    
    // Fix: Using googleSearch with JSON parsing is against the guidelines as the output format is not guaranteed.
    // Switched to using responseSchema to enforce a JSON output. This makes the response parsing reliable.
    // As a result, grounding sources from googleSearch will not be available, but the UI handles this gracefully.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                articles: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "O título da notícia." },
                            summary: { type: Type.STRING, description: "Um resumo da notícia." },
                            date: { type: Type.STRING, description: "A data da notícia." },
                        },
                        required: ["title", "summary", "date"],
                    }
                }
            },
            required: ["articles"],
        }
      },
    });

    const jsonString = response.text;
    const parsed = JSON.parse(jsonString);
    const articles = parsed.articles || [];

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
    // Fix: Improved error message to be more helpful, covering both missing and invalid API keys.
    if (error instanceof Error && (error.message.includes("API_KEY") || error.message.includes("API key"))) {
        throw new Error("Falha na autenticação com a API. Verifique se sua chave de API (API_KEY) está configurada corretamente, é válida e possui as permissões necessárias.");
    }
    throw new Error("Não foi possível buscar as notícias. A IA pode estar ocupada, tente novamente.");
  }
};
