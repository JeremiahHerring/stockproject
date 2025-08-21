import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <div className="text-lg text-gray-600">Loading stock data...</div>
        <div className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest market information</div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 