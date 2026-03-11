import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Card = ({
  children,
  className = '',
  padding = 'medium',
  hoverable = false,
  bordered = true,
  shadow = 'medium',
  rounded = 'lg',
  variant = 'default',
  ...props
}) => {
  const { isDark } = useTheme();

  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-5',
    large: 'p-6',
  };

  const shadowClasses = {
    none: '',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const variants = {
    default: isDark ? 'bg-gray-900' : 'bg-white',
    elevated: isDark 
      ? 'bg-gray-900/80 backdrop-blur-sm' 
      : 'bg-white/80 backdrop-blur-sm',
    gradient: isDark
      ? 'bg-gradient-to-br from-gray-900 to-gray-800'
      : 'bg-gradient-to-br from-gray-50 to-white',
  };

  const baseClasses = `${variants[variant]} transition-all duration-300`;
  const borderClass = bordered ? (isDark ? 'border border-gray-800' : 'border border-gray-200') : '';
  const hoverClass = hoverable ? (isDark 
    ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer hover:border-rose-500/30' 
    : 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer hover:border-rose-400/50'
  ) : '';

  const cardClasses = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${roundedClasses[rounded]} ${borderClass} ${hoverClass} ${className}`;

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '', ...props }) => {
  const { isDark } = useTheme();
  return (
    <div className={`mb-4 pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Body = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => {
  const { isDark } = useTheme();
  return (
    <div className={`mt-4 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Title = ({ children, className = '', size = 'md', ...props }) => {
  const { isDark } = useTheme();
  const sizeClasses = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-xl font-bold',
  };
  
  return (
    <h3 className={`${sizeClasses[size]} ${isDark ? 'text-white' : 'text-gray-900'} ${className}`} {...props}>
      {children}
    </h3>
  );
};

Card.Subtitle = ({ children, className = '', ...props }) => {
  const { isDark } = useTheme();
  return (
    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
};

export default Card;