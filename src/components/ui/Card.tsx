import React from 'react';
type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
  color?: 'default' | 'blue' | 'orange' | 'green' | 'purple';
};
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  footer,
  hover = false,
  onClick,
  color = 'default'
}) => {
  const baseClasses = 'bg-white rounded-xl overflow-hidden shadow-sm border';
  const colorClasses = {
    default: 'border-gray-200',
    blue: 'border-l-4 border-l-[#2E3B55] border-t-gray-200 border-r-gray-200 border-b-gray-200',
    orange: 'border-l-4 border-l-[#F7941D] border-t-gray-200 border-r-gray-200 border-b-gray-200',
    green: 'border-l-4 border-l-[#4CAF50] border-t-gray-200 border-r-gray-200 border-b-gray-200',
    purple: 'border-l-4 border-l-[#7E57C2] border-t-gray-200 border-r-gray-200 border-b-gray-200'
  };
  const hoverClasses = hover ? 'transition-all hover:shadow-md cursor-pointer' : '';
  return <div className={`${baseClasses} ${colorClasses[color]} ${hoverClasses} ${className}`} onClick={onClick}>
      {(title || subtitle) && <div className="px-5 py-4 border-b border-gray-100">
          {title && <h3 className="text-base font-semibold text-[#2E3B55]">{title}</h3>}
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>}
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>}
    </div>;
};