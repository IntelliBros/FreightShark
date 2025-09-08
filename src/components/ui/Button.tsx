import React from 'react';
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  children,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors rounded-md';
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm'
  };
  const variantClasses = {
    primary: 'bg-[#2E3B55] text-white hover:bg-[#1e2940] focus:ring-2 focus:ring-[#2E3B55]/50 focus:ring-offset-2 focus:outline-none disabled:bg-[#2E3B55]/50',
    secondary: 'bg-white text-[#2E3B55] border border-[#2E3B55]/20 hover:bg-gray-50 hover:border-[#2E3B55]/30 focus:ring-2 focus:ring-[#2E3B55]/50 focus:ring-offset-2 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400',
    tertiary: 'bg-transparent text-[#2E3B55] hover:bg-[#2E3B55]/10 focus:ring-2 focus:ring-[#2E3B55]/50 focus:ring-offset-2 focus:outline-none disabled:text-[#2E3B55]/40',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:bg-red-300'
  };
  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`;
  return <button type={type} className={classes} onClick={onClick} disabled={disabled || isLoading}>
      {isLoading && <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>}
      {children}
    </button>;
};