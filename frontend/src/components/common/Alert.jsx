import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

const Alert = ({ 
  type = 'info', 
  message, 
  title, 
  onClose, 
  showIcon = true,
  className = '',
  autoClose = false,
  autoCloseDuration = 5000
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, isVisible, onClose]);

  const alertConfig = {
    info: {
      icon: <FiInfo className="w-5 h-5" />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-500 dark:text-blue-400',
    },
    success: {
      icon: <FiCheckCircle className="w-5 h-5" />,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-500 dark:text-green-400',
    },
    warning: {
      icon: <FiAlertCircle className="w-5 h-5" />,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
    },
    error: {
      icon: <FiAlertCircle className="w-5 h-5" />,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500 dark:text-red-400',
    },
  };

  const config = alertConfig[type] || alertConfig.info;

  if (!isVisible) return null;

  return (
    <div
      className={`rounded-lg border ${config.bgColor} ${config.borderColor} ${className} mb-4`}
      role="alert"
    >
      <div className="flex items-start p-4">
        {showIcon && (
          <div className={`flex-shrink-0 mr-3 ${config.iconColor}`}>
            {config.icon}
          </div>
        )}
        
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold mb-1 ${config.textColor}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${config.textColor}`}>
            {message}
          </div>
        </div>
        
        {(onClose || autoClose) && (
          <button
            onClick={() => {
              setIsVisible(false);
              if (onClose) onClose();
            }}
            className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;