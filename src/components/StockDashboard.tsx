import React, { useState, useEffect } from 'react';
import StockTable from './StockTable';
import StockChart from './StockChart';
import SearchBar from './SearchBar';
import LoadingSpinner from './LoadingSpinner';
import { StockData, fetchStockData } from '../services/stockService';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title: string;
}

const StockDashboard: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadStockData();
  }, []);

  useEffect(() => {
    // Filter stocks based on search term
    const filtered = stocks.filter(stock =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStocks(filtered);
  }, [searchTerm, stocks]);

  const addNotification = (type: Notification['type'], title: string, message: string) => {
    const id = Date.now().toString();
    const newNotification: Notification = { id, type, title, message };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const loadStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingCachedData(false);
      
      const data = await fetchStockData((type, title, message) => {
        addNotification(type, title, message);
      });
      setStocks(data);
      setFilteredStocks(data);
      
      // Check if we're using cached data (this will be logged in the service)
      // We can't directly detect this, but we can show a message if data seems stale
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock data';
      setError('Failed to fetch stock data. Please try again later.');
      
      // Show specific notifications for different error types
      if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit')) {
        addNotification('warning', 'Rate Limit Reached', 'API rate limit reached. Please wait a moment before refreshing.');
      } else if (errorMessage.includes('API key')) {
        addNotification('error', 'Configuration Error', 'API key not found. Please check your .env file.');
      } else {
        addNotification('error', 'API Error', errorMessage);
      }
      
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    addNotification('info', 'Refreshing Data', 'Fetching latest stock data from Finnhub...');
    loadStockData();
  };

  const handleStockSelect = (stock: StockData) => {
    setSelectedStock(stock);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
        <button
          onClick={handleRefresh}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${
              notification.type === 'error' ? 'ring-red-500' :
              notification.type === 'warning' ? 'ring-yellow-500' :
              notification.type === 'success' ? 'ring-green-500' :
              'ring-blue-500'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === 'error' && (
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {notification.type === 'warning' && (
                    <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {notification.type === 'success' && (
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search stocks..."
        />
        <button
          onClick={handleRefresh}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* API Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              API Rate Limits
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Free Finnhub API: 5 calls/minute, 500/day. If you see errors, wait a moment and try again.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Stock Prices ({filteredStocks.length} stocks)
          </h2>
        </div>
        <StockTable
          stocks={filteredStocks}
          onStockSelect={handleStockSelect}
          selectedStock={selectedStock}
        />
      </div>

      {/* Stock Chart */}
      {selectedStock && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedStock.symbol} - {selectedStock.name}
            </h3>
            <p className="text-gray-600">
              Current Price: ${selectedStock.price.toFixed(2)}
            </p>
          </div>
          <StockChart stock={selectedStock} />
        </div>
      )}
    </div>
  );
};

export default StockDashboard; 