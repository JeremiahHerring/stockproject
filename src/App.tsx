import React from 'react';
import StockDashboard from './components/StockDashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📈 Stock Price Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time stock data and market insights
          </p>
        </header>
        <StockDashboard />
      </div>
    </div>
  );
}

export default App; 