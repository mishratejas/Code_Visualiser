import React from 'react';
import { FiLoader } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const { isDark } = useTheme();
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white focus:ring-rose-500 focus:ring-offset-gray-900',
    secondary: isDark 
      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 focus:ring-gray-500 focus:ring-offset-gray-900'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400 focus:ring-offset-white',
    outline: isDark
      ? 'border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 focus:ring-rose-500 focus:ring-offset-gray-900'
      : 'border border-rose-400 text-rose-600 hover:bg-rose-50 focus:ring-rose-500 focus:ring-offset-white',
  };

  const sizes = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-2.5 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <FiLoader className="animate-spin mr-1.5 h-3.5 w-3.5" />}
      {children}
    </button>
  );
};

export default Button;