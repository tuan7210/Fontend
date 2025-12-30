import React from 'react';

interface RatingStarsProps {
  rating: number; // 0 - 5 (có thể thập phân)
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClassMap: Record<NonNullable<RatingStarsProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-2xl',
};

// Hiển thị 5 sao với hiệu ứng đổ màu theo phần trăm (hỗ trợ nửa sao và thập phân)
const RatingStars: React.FC<RatingStarsProps> = ({ rating, size = 'md', className = '' }) => {
  const normalized = Math.max(0, Math.min(5, rating || 0));
  const percent = (normalized / 5) * 100; // 0 - 100%
  const sizeClass = sizeClassMap[size];

  return (
    <span
      className={`relative inline-block leading-none ${sizeClass} ${className}`}
      aria-label={`Đánh giá ${normalized.toFixed(1)} trên 5`}
    >
      {/* Lớp nền: 5 sao xám */}
      <span className="text-gray-300 select-none tracking-wider">★★★★★</span>
      {/* Lớp phủ: phần trăm sao vàng */}
      <span
        className="absolute left-0 top-0 text-yellow-400 overflow-hidden select-none tracking-wider"
        style={{ width: `${percent}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
};

export default RatingStars;
