import React from 'react';

export default function GoogleDriveIcon({ className = "w-4 h-4" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 139 120.4" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#0F9D58" d="M55.5 0L0 95.8l27.8 24.6L83.3 24.6z"/>
      <path fill="#4285F4" d="M139 95.8H27.8L83.3 0h55.7z"/>
      <path fill="#FFCD40" d="M55.5 95.8L27.8 120.4h83.3L139 95.8z"/>
    </svg>
  );
}