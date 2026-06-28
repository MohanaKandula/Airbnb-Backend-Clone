import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'brand' }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    brand: 'border-brand border-t-transparent',
    white: 'border-white border-t-transparent',
    secondary: 'border-brand-secondary border-t-transparent',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label="loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
