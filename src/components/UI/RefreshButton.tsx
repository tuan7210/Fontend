import React from 'react';

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  onClick, 
  loading = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-full 
      hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      title="Làm mới"
    >
      <svg 
        className={`${sizeClasses[size]} ${loading ? 'animate-spin text-blue-500' : 'text-gray-500'}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
    </button>
  );
};

export default RefreshButton;
