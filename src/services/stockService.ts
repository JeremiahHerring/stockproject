export interface StockData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
}

// Callback types for notifications
export type NotificationCallback = (type: 'warning' | 'info', title: string, message: string) => void;

// Finnhub API integration
export const fetchStockData = async (onNotification?: NotificationCallback): Promise<StockData[]> => {
  const API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Finnhub API key not found. Please add REACT_APP_FINNHUB_API_KEY to your .env file.');
  }

  // Popular stock symbols to fetch
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'JPM', 'JNJ'];
  
  try {
    // Fetch stock data from Finnhub
    const stockData = await fetchStocksFromFinnhub(symbols, API_KEY, onNotification);
    
    if (stockData.length === 0) {
      throw new Error('No valid stock data received from API');
    }
    
    if (onNotification) {
      onNotification('info', 'Data Updated', `Successfully loaded ${stockData.length} stocks with real-time data from Finnhub.`);
    }
    
    return stockData;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    
    // If API fails, return cached data if available, otherwise throw
    const cachedData = getCachedStockData();
    if (cachedData.length > 0) {
      console.log('Returning cached data due to API failure');
      if (onNotification) {
        onNotification('warning', 'Using Cached Data', 'API temporarily unavailable. Showing cached data from previous session.');
      }
      return cachedData;
    }
    
    throw new Error('Failed to fetch stock data from Finnhub API');
  }
};

// Fetch stocks from Finnhub
const fetchStocksFromFinnhub = async (symbols: string[], apiKey: string, onNotification?: NotificationCallback): Promise<StockData[]> => {
  const results: StockData[] = [];
  
  try {
    // Fetch all stocks in parallel since Finnhub has better rate limits
    const promises = symbols.map(async (symbol) => {
      return await fetchStockFromFinnhub(symbol, apiKey);
    });
    
    const stockResults = await Promise.all(promises);
    const validResults = stockResults.filter(Boolean) as StockData[];
    
    // Cache the successful results
    cacheStockData(validResults);
    
    return validResults;
  } catch (error) {
    console.error('Error fetching stocks from Finnhub:', error);
    throw error;
  }
};

// Fetch individual stock from Finnhub
const fetchStockFromFinnhub = async (symbol: string, apiKey: string): Promise<StockData | null> => {
  try {
    // Get quote data
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    );
    
    if (!quoteResponse.ok) {
      if (quoteResponse.status === 429) {
        throw new Error('Rate limit reached');
      }
      throw new Error(`HTTP error! status: ${quoteResponse.status}`);
    }
    
    const quoteData = await quoteResponse.json();
    
    // Get company profile for name
    const profileResponse = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
    );
    
    let companyName = symbol; // fallback to symbol if profile fails
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      if (profileData.name) {
        companyName = profileData.name;
      }
    }
    
    // Calculate change percentage
    const changePercent = quoteData.c ? ((quoteData.c - quoteData.pc) / quoteData.pc) * 100 : 0;
    
    return {
      symbol: symbol,
      name: companyName,
      price: quoteData.c || 0,
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: quoteData.v || 0
    };
    
  } catch (error) {
    console.warn(`Failed to fetch ${symbol} from Finnhub:`, error);
    return null;
  }
};

// Simple caching mechanism
let cachedStockData: StockData[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const cacheStockData = (data: StockData[]) => {
  cachedStockData = data;
  cacheTimestamp = Date.now();
};

const getCachedStockData = (): StockData[] => {
  if (Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedStockData;
  }
  return [];
};
