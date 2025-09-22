import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  X, 
  Check, 
  Upload, 
  Download, 
  MessageSquare, 
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  MoreHorizontal,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

// Notification entity for managing notifications
class NotificationEntity {
  static async list() {
    const stored = localStorage.getItem('princess_notifications');
    return stored ? JSON.parse(stored) : [];
  }

  static async create(notification) {
    const notifications = await this.list();
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_date: new Date().toISOString(),
      read: false,
      ...notification
    };
    notifications.unshift(newNotification); // Add to beginning
    localStorage.setItem('princess_notifications', JSON.stringify(notifications));
    return newNotification;
  }

  static async markAsRead(id) {
    const notifications = await this.list();
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem('princess_notifications', JSON.stringify(updated));
    return updated;
  }

  static async markAllAsRead() {
    const notifications = await this.list();
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('princess_notifications', JSON.stringify(updated));
    return updated;
  }

  static async delete(id) {
    const notifications = await this.list();
    const filtered = notifications.filter(n => n.id !== id);
    localStorage.setItem('princess_notifications', JSON.stringify(filtered));
    return filtered;
  }

  static async clear() {
    localStorage.setItem('princess_notifications', JSON.stringify([]));
    return [];
  }
}

export { NotificationEntity };

export default function NotificationCenter({ 
  isOpen, 
  onClose, 
  onNotificationClick,
  className = '' 
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await NotificationEntity.list();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id) => {
    await NotificationEntity.markAsRead(id);
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = async () => {
    await NotificationEntity.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDelete = async (id) => {
    await NotificationEntity.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = async () => {
    await NotificationEntity.clear();
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'version_upload':
        return { icon: Upload, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'version_approved':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' };
      case 'version_declined':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' };
      case 'approval_request':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' };
      case 'comment_added':
        return { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'feedback_received':
        return { icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' };
      default:
        return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, data } = notification;
    switch (type) {
      case 'version_upload':
        return `New version ${data.version_number} uploaded for "${data.deliverable_name}"`;
      case 'version_approved':
        return `Version ${data.version_number} approved for "${data.deliverable_name}"`;
      case 'version_declined':
        return `Version ${data.version_number} declined for "${data.deliverable_name}"`;
      case 'approval_request':
        return `Approval requested for version ${data.version_number} of "${data.deliverable_name}"`;
      case 'comment_added':
        return `New comment added to "${data.deliverable_name}"`;
      case 'feedback_received':
        return `Feedback received for version ${data.version_number} of "${data.deliverable_name}"`;
      default:
        return notification.message || 'New notification';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, x: 300, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 300, y: -20 }}
          className="bg-white rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-hidden mt-16"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none h-full flex flex-col">
            {/* Header */}
            <CardHeader className="border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Notifications</CardTitle>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-600">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="p-4 border-b border-gray-100 flex gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="gap-2 text-xs"
                  >
                    <Check className="w-3 h-3" />
                    Mark All Read
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearAll}
                  className="gap-2 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </Button>
              </div>
            )}

            {/* Notifications List */}
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-1">No notifications</h3>
                    <p className="text-sm text-gray-600">
                      You're all caught up! New notifications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                      const iconConfig = getNotificationIcon(notification.type);
                      const IconComponent = iconConfig.icon;
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50/50' : ''
                          }`}
                          onClick={() => {
                            handleMarkAsRead(notification.id);
                            if (onNotificationClick) {
                              onNotificationClick(notification);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg ${iconConfig.bg} flex-shrink-0`}>
                              <IconComponent className={`w-4 h-4 ${iconConfig.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                {getNotificationMessage(notification)}
                              </p>
                              
                              {/* Action Button if available */}
                              {notification.data?.action_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 text-xs gap-1.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                    // Navigate to action URL
                                    window.location.href = notification.data.action_url;
                                  }}
                                >
                                  <Eye className="w-3 h-3" />
                                  {notification.data.action_label || 'View'}
                                </Button>
                              )}
                              
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                                </p>
                                <div className="flex items-center gap-1">
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(notification.id);
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}