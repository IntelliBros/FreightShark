import React from 'react';
type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
};
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs'
  };
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-[#E6EDF8] text-[#2E3B55]'
  };
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  return <span className={classes}>{children}</span>;
};