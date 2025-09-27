import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = "", linkTo = "/" }) => {
  return (
    <Link to={linkTo} className={`inline-block ${className}`}>
      <svg
        width="140"
        height="32"
        viewBox="0 0 140 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-8"
      >
        {/* Princess text in elegant font */}
        <text
          x="0"
          y="24"
          fill="white"
          fontSize="24"
          fontFamily="Georgia, serif"
          fontWeight="400"
          letterSpacing="0.5"
        >
          Princess
        </text>
      </svg>
    </Link>
  );
};

export default Logo;