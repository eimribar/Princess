import React from 'react';

export default function GoogleDriveIcon({ className = "w-4 h-4" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 16 16" 
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <path fill="#0F9D58" d="M5.75 1L0 11l2.75 4.787L8.5 5.787z"/>
      <path fill="#4285F4" d="M10.25 1H5.75L8.5 5.787 13 5.787z"/>
      <path fill="#FFCD40" d="M8.5 5.787L2.75 15.787h10.5L16 11z"/>
    </svg>
  );
}