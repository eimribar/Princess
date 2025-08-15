import React from 'react';

export default function GoogleDriveIcon({ className = "w-4 h-4" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue triangle section - top */}
      <path 
        d="M8.5 2h7l7 12h-7l-7-12z" 
        fill="#4285F4"
      />
      
      {/* Green triangle section - left */}
      <path 
        d="M1.5 14L8.5 2l3.5 6L5 20l-3.5-6z" 
        fill="#0F9D58"
      />
      
      {/* Yellow/Orange triangle section - bottom */}
      <path 
        d="M5 20h14l3.5-6h-14L5 20z" 
        fill="#FFC107"
      />
    </svg>
  );
}