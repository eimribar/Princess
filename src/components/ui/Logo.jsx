import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ 
  className = "", 
  linkTo = "/", 
  showTagline = false,
  showCrown = false,
  variant = "light" // "light" for white text, "dark" for dark text
}) => {
  const textColor = variant === "dark" ? "#111827" : "white";
  const taglineColor = variant === "dark" ? "#6B7280" : "rgba(255, 255, 255, 0.8)";
  const crownColor = variant === "dark" ? "#111827" : "white";
  
  const logoContent = (
    <div className={`flex flex-col ${className}`}>
      <div className="text-2xl font-serif tracking-wide leading-none" style={{ color: textColor }}>
        Princess
      </div>
      {showTagline && (
        <div className="text-sm font-medium -mt-1" style={{ color: taglineColor }}>
          by Deutsch & Co.
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-block">
        {logoContent}
      </Link>
    );
  }
  
  return logoContent;
};

export default Logo;