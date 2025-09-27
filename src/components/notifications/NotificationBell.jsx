import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationCenter, { NotificationEntity } from './NotificationCenter';

export default function NotificationBell({ 
  onNotificationClick,
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const notifications = await NotificationEntity.list();
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    setIsOpen(false);
    loadUnreadCount(); // Refresh count after marking as read
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    loadUnreadCount(); // Refresh count when closing
  };

  return (
    <>
      <motion.div 
        className={`relative ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBellClick}
          className="relative w-10 h-10 rounded-lg bg-white border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 group"
        >
          <Bell className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                <Badge 
                  variant="destructive" 
                  className="relative min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white shadow-lg"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </div>
            </motion.div>
          )}
        </Button>
        
        {/* Premium Tooltip */}
        {isHovered && unreadCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
            </div>
          </motion.div>
        )}
      </motion.div>

      <NotificationCenter
        isOpen={isOpen}
        onClose={handleClose}
        onNotificationClick={handleNotificationClick}
      />
    </>
  );
}