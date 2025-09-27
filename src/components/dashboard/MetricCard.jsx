import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
  trend, // 'up', 'down', 'neutral'
  trendValue, // e.g., '+12%'
  color = 'blue', // 'blue', 'purple', 'orange', 'red', 'green'
  animate = true,
  delay = 0
}) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  
  // Animate number counting up
  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }
    
    const duration = 1000; // 1 second
    const steps = 30;
    const increment = value / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(increment * currentStep));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value, animate]);
  
  // Color gradients
  const gradients = {
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-red-600',
    red: 'from-red-500 to-rose-600',
    green: 'from-green-500 to-emerald-600',
    gray: 'from-gray-500 to-slate-600'
  };
  
  const bgColors = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    red: 'bg-red-50',
    green: 'bg-green-50',
    gray: 'bg-gray-50'
  };
  
  const iconColors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    green: 'text-green-600',
    gray: 'text-gray-600'
  };
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="flex-1 min-w-[158px]"
    >
      <div
        onClick={onClick}
        className={cn(
          "relative overflow-hidden rounded-lg p-6 bg-gradient-to-br",
          gradients[color],
          "cursor-pointer group transition-all duration-300",
          "hover:shadow-xl"
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white rounded-full" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-medium mb-1">{title}</p>
              <p className="text-white text-3xl font-bold tracking-tight">
                {displayValue}
              </p>
              {subtitle && (
                <p className="text-white/70 text-xs mt-1">{subtitle}</p>
              )}
            </div>
            
            {Icon && (
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  "bg-white/20 backdrop-blur-sm"
                )}
              >
                <Icon className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </div>
          
          {/* Trend Indicator */}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className={cn("w-4 h-4", trendColor)} />
              <span className={cn("text-sm font-medium", trendColor)}>
                {trendValue}
              </span>
              <span className="text-white/60 text-xs">vs last period</span>
            </div>
          )}
          
          {/* Hover Action Indicator */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="absolute bottom-4 right-4 flex items-center gap-1 text-white/80"
          >
            <span className="text-xs">View Details</span>
            <ArrowRight className="w-3 h-3" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Simplified card for static metrics
export function SimpleMetricCard({ title, value, icon: Icon, onClick, color = 'gray' }) {
  const bgColors = {
    blue: 'bg-[#f0f2f4]',
    purple: 'bg-[#f0f2f4]',
    orange: 'bg-[#f0f2f4]',
    red: 'bg-[#f0f2f4]',
    green: 'bg-[#f0f2f4]',
    gray: 'bg-[#f0f2f4]'
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex min-w-[158px] flex-1"
    >
      <div
        onClick={onClick}
        className={cn(
          "flex flex-col gap-2 rounded-lg p-6 w-full",
          bgColors[color],
          "cursor-pointer transition-all duration-200",
          "hover:shadow-md"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-[#111418] text-base font-medium leading-normal">{title}</p>
          {Icon && <Icon className="w-5 h-5 text-[#617589]" />}
        </div>
        <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{value}</p>
      </div>
    </motion.div>
  );
}