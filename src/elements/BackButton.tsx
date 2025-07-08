import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string; // Optional: specify where to navigate, defaults to -1 (go back)
  className?: string; // Optional: additional classes
}

const BackButton: React.FC<BackButtonProps> = ({ to, className = '' }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <button
      onClick={handleBackClick}
      className={`
        absolute top-9 right-6 z-50
        bg-blue-600 hover:bg-blue-700 
        text-white font-medium
        px-3 py-2 sm:px-4 sm:py-2
        rounded-lg shadow-lg hover:shadow-xl
        transition-all duration-200 ease-in-out
        flex items-center gap-1 sm:gap-2
        text-sm sm:text-base
        min-w-0 max-w-32 sm:max-w-none
        ${className}
      `}
      aria-label="Go back"
    >
      {/* Arrow Icon */}
      <svg 
        className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 19l-7-7m0 0l7-7m-7 7h18" 
        />
      </svg>
      
      {/* Text - Hidden on very small screens */}
      <span className="hidden xs:inline sm:inline">Back</span>
    </button>
  );
};

export default BackButton;