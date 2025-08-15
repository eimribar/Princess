import React from 'react';

export default function GoogleDriveIcon({ className = "w-4 h-4" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8.5 1L0 15.5L3.5 21.5L12 7L8.5 1Z" fill="#1EA362"/>
      <path d="M15.5 1H8.5L12 7L20.5 7L24 1H15.5Z" fill="#4285F4"/>
      <path d="M12 7L3.5 21.5H20.5L24 15.5L12 7Z" fill="#FFBA00"/>
    </svg>
  );
}