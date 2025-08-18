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
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBellClick}
          className="relative hover:bg-gray-100"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge 
                variant="destructive" 
                className="w-5 h-5 p-0 flex items-center justify-center text-xs font-bold bg-red-500"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </div>

      <NotificationCenter
        isOpen={isOpen}
        onClose={handleClose}
        onNotificationClick={handleNotificationClick}
      />
    </>
  );
}