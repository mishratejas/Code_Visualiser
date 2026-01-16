import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'medium',
  hoverable = false,
  bordered = true,
  shadow = 'medium',
  rounded = 'xl',
  variant = 'default',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const shadowClasses = {
    none: '',
    small: 'shadow',
    medium: 'shadow-lg',
    large: 'shadow-2xl',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  };

  const variants = {
    default: 'bg-white dark:bg-gray-800',
    elevated: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
    gradient: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
  };

  const baseClasses = `${variants[variant]} transition-all duration-300`;
  const borderClass = bordered ? 'border border-gray-200 dark:border-gray-700' : '';
  const hoverClass = hoverable ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:border-rose-500/30' : '';

  const cardClasses = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${roundedClasses[rounded]} ${borderClass} ${hoverClass} ${className}`;

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '', ...props }) => (
  <div className={`mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

Card.Body = ({ children, className = '', padding = true, ...props }) => (
  <div className={`${padding ? 'py-4' : ''} ${className}`} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className = '', size = 'md', ...props }) => {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold',
  };
  
  return (
    <h3 className={`${sizeClasses[size]} text-gray-900 dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  );
};

Card.Subtitle = ({ children, className = '', ...props }) => (
  <p className={`text-base text-gray-600 dark:text-gray-400 mt-2 ${className}`} {...props}>
    {children}
  </p>
);

export default Card;