import React from 'react';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';
import Logo from '@/components/ui/Logo';

// Decorative dot matrix (from Nexus design)
const DotMatrix = () => (
  <div className="hidden sm:block absolute right-6 top-6 opacity-60">
    <div className="grid grid-cols-6 gap-[5px]">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full bg-[#2E2E2E]"
        />
      ))}
    </div>
  </div>
);

/**
 * AuthLayout - Consistent layout for all authentication pages
 * Implements the Nexus design system with dark theme
 */
export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Keep the animated shader background */}
      <AnimatedShaderBackground />
      
      {/* Logo in top-left corner */}
      <div className="absolute top-6 left-6 z-20">
        <Logo linkTo="/" />
      </div>
      
      {/* Main content centered */}
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Main auth box with Nexus styling */}
        <div className="relative z-10 w-[420px] max-w-[92vw] bg-[#161617] border border-[#252527] rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] px-8 py-7">
          <DotMatrix />
        
        {/* Logo/Title Section */}
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && (
              <h1 className="text-white text-[22px] font-semibold">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[13px] text-white/60 mt-2">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}

// Export common auth styles for consistency
export const authStyles = {
  input: "w-full bg-[#0F0F10] border border-[#2A2A2B] text-white placeholder-white/45 rounded-md h-11 px-3 focus:outline-none focus:ring-2 focus:ring-[#2B8CFF] focus:border-transparent",
  inputWithIcon: "w-full bg-[#0F0F10] border border-[#2A2A2B] text-white placeholder-white/45 rounded-md h-11 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#2B8CFF] focus:border-transparent",
  label: "text-white/70 text-sm font-medium",
  button: "w-full h-11 rounded-md text-white text-[14px] font-semibold shadow-[0_6px_18px_rgba(33,114,255,0.35)] bg-[linear-gradient(180deg,#2B8CFF_0%,#1E6BFF_100%)] hover:opacity-90 transition-opacity",
  buttonSecondary: "w-full h-11 rounded-md bg-[#212123] border border-[#2B2B2D] text-white/90 text-[14px] font-medium hover:bg-[#262629] transition-colors",
  divider: "flex items-center gap-3 my-5",
  dividerLine: "flex-1 h-px bg-[#2A2A2B]",
  dividerText: "text-[11px] tracking-[0.12em] text-white/50",
  link: "text-[13px] text-[#2B8CFF] hover:text-[#56A0FF] transition-colors",
  error: "text-red-400 text-sm bg-red-950/20 border border-red-900/50 rounded-md p-3",
  iconInInput: "absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/50"
};