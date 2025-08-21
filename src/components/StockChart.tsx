import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { StockData } from '../services/stockService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockChartProps {
  stock: StockData;
}

interface HistoricalData {
  labels: string[];
  data: number[];
}

const StockChart: React.FC<StockChartProps> = ({ stock }) => {
  const [chartData, setChartData] = useState<HistoricalData>({ labels: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoricalData();
  }, [stock.symbol]);

  const fetchHistoricalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;
      if (!API_KEY) {
        throw new Error('API key not found');
      }

      // Try to fetch historical data with retry logic
      const data = await fetchHistoricalDataWithRetry(stock.symbol, API_KEY);
      
      if (data && data.t && data.c) {
        // Finnhub returns arrays: t (timestamps), c (close prices), h (high), l (low), o (open), v (volume)
        const timestamps = data.t;
        const closePrices = data.c;
        
        // Get last 30 data points
        const startIndex = Math.max(0, timestamps.length - 30);
        const recentTimestamps = timestamps.slice(startIndex);
        const recentPrices = closePrices.slice(startIndex);
        
        const labels = recentTimestamps.map((timestamp: number) => {
          const date = new Date(timestamp * 1000); // Convert Unix timestamp to Date
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        setChartData({ labels, data: recentPrices });
      } else {
        // Fallback to simulated data if API doesn't return historical data
        generateFallbackData();
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError('Failed to load historical data');
      // Fallback to simulated data
      generateFallbackData();
    } finally {
      setLoading(false);
    }
  }, [stock.symbol]);

  // Fetch historical data with retry logic
  const fetchHistoricalDataWithRetry = async (symbol: string, apiKey: string, retries: number = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Calculate date range (last 30 days)
        const endDate = Math.floor(Date.now() / 1000);
        const startDate = endDate - (30 * 24 * 60 * 60); // 30 days ago
        
        const response = await fetch(
          `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${startDate}&to=${endDate}&token=${apiKey}`
        );

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited - wait longer
            await delay(2000);
            continue;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
        
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        await delay(1000 * Math.pow(2, attempt));
      }
    }
    
    throw new Error('Failed to fetch historical data after retries');
  };

  // Utility function for delays
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generateFallbackData = useCallback(() => {
    const days = 30;
    const data = [];
    const labels = [];
    
    let currentPrice = stock.price;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Simulate price movement
      const change = (Math.random() - 0.5) * 0.1; // ±5% change
      currentPrice = currentPrice * (1 + change);
      data.push(parseFloat(currentPrice.toFixed(2)));
    }
    
    setChartData({ labels, data });
  }, [stock.price]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <div className="text-sm text-gray-600">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center text-gray-500">
          <div className="text-sm mb-2">⚠️ {error}</div>
          <div className="text-xs">Showing simulated data</div>
        </div>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return `$${value.toFixed(2)}`;
          },
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
      },
    },
  };

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: stock.symbol,
        data: chartData.data,
        borderColor: stock.changePercent >= 0 ? '#10B981' : '#EF4444',
        backgroundColor: stock.changePercent >= 0 
          ? 'rgba(16, 185, 129, 0.1)' 
          : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointHoverBackgroundColor: stock.changePercent >= 0 ? '#10B981' : '#EF4444',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  return (
    <div className="w-full h-80">
      <Line data={data} options={options} />
    </div>
  );
};

export default StockChart; 