import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark } = useTheme();
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
      icon: <FiInfo className="w-4 h-4" />,
      bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      borderColor: isDark ? 'border-blue-800' : 'border-blue-200',
      textColor: isDark ? 'text-blue-200' : 'text-blue-800',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-500',
    },
    success: {
      icon: <FiCheckCircle className="w-4 h-4" />,
      bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
      borderColor: isDark ? 'border-green-800' : 'border-green-200',
      textColor: isDark ? 'text-green-200' : 'text-green-800',
      iconColor: isDark ? 'text-green-400' : 'text-green-500',
    },
    warning: {
      icon: <FiAlertCircle className="w-4 h-4" />,
      bgColor: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
      borderColor: isDark ? 'border-yellow-800' : 'border-yellow-200',
      textColor: isDark ? 'text-yellow-200' : 'text-yellow-800',
      iconColor: isDark ? 'text-yellow-400' : 'text-yellow-500',
    },
    error: {
      icon: <FiAlertCircle className="w-4 h-4" />,
      bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50',
      borderColor: isDark ? 'border-red-800' : 'border-red-200',
      textColor: isDark ? 'text-red-200' : 'text-red-800',
      iconColor: isDark ? 'text-red-400' : 'text-red-500',
    },
  };

  const config = alertConfig[type] || alertConfig.info;

  if (!isVisible) return null;

  return (
    <div
      className={`rounded-lg border ${config.bgColor} ${config.borderColor} ${className} mb-3`}
      role="alert"
    >
      <div className="flex items-start p-3">
        {showIcon && (
          <div className={`flex-shrink-0 mr-2 ${config.iconColor}`}>
            {config.icon}
          </div>
        )}
        
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold mb-0.5 text-sm ${config.textColor}`}>
              {title}
            </h3>
          )}
          <div className={`text-xs ${config.textColor}`}>
            {message}
          </div>
        </div>
        
        {(onClose || autoClose) && (
          <button
            onClick={() => {
              setIsVisible(false);
              if (onClose) onClose();
            }}
            className={`flex-shrink-0 ml-2 ${
              isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            } transition-colors`}
            aria-label="Close"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;