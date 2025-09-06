import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutGrid,
  FolderKanban,
  Users,
  BookCopy,
  GanttChartSquare,
  Menu,
  X,
  Bell,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  Settings,
  HelpCircle,
  MessageSquare,
  Star
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

/**
 * Premium Client Layout
 * 
 * Elegant, minimal navigation designed specifically for clients.
 * Features:
 * - Clean, uncluttered interface
 * - Focus on essential functions
 * - Beautiful animations
 * - Mobile-first responsive design
 * - Customizable branding
 */

const ClientLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [attentionCount, setAttentionCount] = useState(3); // Mock attention items

  // Navigation items for clients - limited and focused
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/client/dashboard', 
      icon: LayoutGrid,
      description: 'Project overview'
    },
    { 
      name: 'Deliverables', 
      href: '/client/deliverables', 
      icon: FolderKanban,
      description: 'Review & approve',
      badge: attentionCount > 0 ? attentionCount : null,
      badgeColor: 'bg-red-500'
    },
    { 
      name: 'Timeline', 
      href: '/client/timeline', 
      icon: GanttChartSquare,
      description: 'Project schedule'
    },
    { 
      name: 'Team', 
      href: '/client/team', 
      icon: Users,
      description: 'Project members'
    },
    { 
      name: 'Brand Assets', 
      href: '/client/brandbook', 
      icon: BookCopy,
      description: 'Final deliverables',
      iconColor: 'text-purple-600'
    }
  ];

  // Quick action buttons
  const quickActions = user?.custom_buttons || [
    { label: 'Google Drive', icon: '📁', url: '#' },
    { label: 'Slack Channel', icon: '💬', url: '#' }
  ];

  // Attention required items (mock data)
  const attentionItems = [
    { id: 1, title: 'Logo Design V2', type: 'approval', urgent: true },
    { id: 2, title: 'Brand Strategy Document', type: 'feedback', urgent: false },
    { id: 3, title: 'Color Palette Selection', type: 'approval', urgent: false }
  ];

  const handleNotificationClick = (notification) => {
    if (notification.data?.deliverable_id) {
      navigate(`/client/deliverables/${notification.data.deliverable_id}`);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow border-r border-gray-200/60 bg-white/90 backdrop-blur-xl">
          {/* Header with branding */}
          <div className="border-b border-gray-100/80 p-6">
            {/* Custom cover image section */}
            {user?.cover_image ? (
              <div className="relative h-24 -mx-6 -mt-6 mb-4">
                <img 
                  src={user.cover_image} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            ) : (
              <div className="relative h-24 -mx-6 -mt-6 mb-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h3 className="text-lg font-semibold">Welcome back!</h3>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="relative">
                {user?.profile_image ? (
                  <Avatar className="w-12 h-12 ring-4 ring-white shadow-lg">
                    <AvatarImage src={user.profile_image} />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center ring-4 ring-white shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                )}
                {user?.is_decision_maker && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Princess</h2>
                <p className="text-xs text-gray-500">Brand Development Portal</p>
              </div>
            </div>

            {/* Attention Required Widget */}
            {attentionCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-900">
                      Action Required
                    </span>
                  </div>
                  <Badge className="bg-red-500 text-white">
                    {attentionCount}
                  </Badge>
                </div>
                <p className="text-xs text-red-700 mb-2">
                  You have {attentionCount} items awaiting your review
                </p>
                <Button
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => navigate('/client/deliverables')}
                >
                  Review Now
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href || 
                             location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all",
                    isActive 
                      ? "bg-white shadow-sm" 
                      : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"
                  )}>
                    <item.icon className={cn(
                      "w-5 h-5",
                      item.iconColor || (isActive ? "text-blue-600" : "text-gray-500")
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge className={cn(
                          "text-xs px-1.5 py-0.5",
                          item.badgeColor || "bg-gray-500",
                          "text-white"
                        )}>
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Quick Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <motion.a
                    key={index}
                    href={action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-base">{action.icon}</span>
                    <span className="text-xs font-medium text-gray-700">
                      {action.label}
                    </span>
                  </motion.a>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 border-t border-gray-100/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user?.profile_image} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <NotificationBell 
                onNotificationClick={handleNotificationClick}
                className="ml-2"
              />
            </div>

            {/* Help & Support */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-gray-600"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-gray-600"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Princess</h1>
          </div>
          <div className="flex items-center gap-2">
            {attentionCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {attentionCount}
              </Badge>
            )}
            <NotificationBell onNotificationClick={handleNotificationClick} />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto"
            >
              {/* Mobile menu content - similar to desktop sidebar */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <nav className="p-4 space-y-2">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge className={cn(
                          "ml-auto",
                          item.badgeColor || "bg-gray-500",
                          "text-white"
                        )}>
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 lg:mt-0 mt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;