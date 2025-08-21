import React from 'react';
import { StockData } from '../services/stockService';

interface StockTableProps {
  stocks: StockData[];
  onStockSelect: (stock: StockData) => void;
  selectedStock: StockData | null;
}

const StockTable: React.FC<StockTableProps> = ({ stocks, onStockSelect, selectedStock }) => {
  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? 'text-stock-green' : 'text-stock-red';
    const icon = isPositive ? '↗' : '↘';
    
    return (
      <span className={`font-semibold ${color}`}>
        {icon} {Math.abs(change).toFixed(2)}%
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Symbol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Change %
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Volume
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stocks.map((stock) => (
            <tr
              key={stock.symbol}
              onClick={() => onStockSelect(stock)}
              className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedStock?.symbol === stock.symbol ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-gray-900">
                  {stock.symbol}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {stock.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                  {formatPrice(stock.price)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  {formatChange(stock.changePercent)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {stock.volume.toLocaleString()}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {stocks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No stocks found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default StockTable; 