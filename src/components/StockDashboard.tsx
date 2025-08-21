import React, { useState, useEffect } from 'react';
import StockTable from './StockTable';
import StockChart from './StockChart';
import SearchBar from './SearchBar';
import LoadingSpinner from './LoadingSpinner';
import { StockData, fetchStockData } from '../services/stockService';

const StockDashboard: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [usingCachedData, setUsingCachedData] = useState(false);

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

  const loadStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingCachedData(false);
      
      const data = await fetchStockData();
      setStocks(data);
      setFilteredStocks(data);
      
      // Check if we're using cached data
      // We can't directly detect this, but we can show a message if data seems stale
    } catch (err) {
      setError('Failed to fetch stock data. Please try again later.');
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
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
              <p>Free Finnhub API: 60 calls/minute, 1000/day. If you see errors, wait a moment and try again.</p>
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