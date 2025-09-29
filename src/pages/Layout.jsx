

import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from "@/components/ui/Logo";
import {
  LayoutGrid,
  FolderKanban,
  Users,
  BookCopy,
  Settings,
  Sparkles,
  GanttChartSquare,
  GitMerge,
  Menu,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Plus,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Layers,
  Package,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createPageUrl } from '@/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import ProjectSelector from '@/components/dashboard/ProjectSelector';
import SlackIcon from '@/components/icons/SlackIcon';
import GoogleDriveIcon from '@/components/icons/GoogleDriveIcon';
import { useUser } from '@/contexts/ClerkUserContext';
import { UserButton } from '@clerk/clerk-react';
import { useProject } from '@/contexts/ProjectContext';
import RoleIndicator from '@/components/ui/RoleIndicator';
import { getVisibleNavigationItems, getRoleDisplayName, getRoleBadgeColor } from '@/lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Full navigation items - will be filtered based on role
const allNavigationItems = [
  { name: 'Dashboard', href: 'dashboard', icon: LayoutGrid, roles: ['admin', 'agency', 'client'] },
  { name: 'Stages', href: 'stages', icon: GanttChartSquare, roles: ['admin', 'agency', 'client'] },
  { name: 'Deliverables', href: 'deliverables', icon: FolderKanban, roles: ['admin', 'agency', 'client'] },
  { name: 'Timeline', href: 'timeline', icon: Clock, roles: ['admin', 'agency', 'client'] },
  { name: 'Team', href: 'team', icon: Users, roles: ['admin', 'agency', 'client'] },
  { name: 'Brand Assets', href: 'brandbook', icon: BookCopy, roles: ['admin', 'agency', 'client'], clientName: 'Brand Assets' },
  { name: 'Out of Scope', href: 'out-of-scope', icon: GitMerge, roles: ['admin', 'agency'] },
  { name: 'Admin', href: 'admin', icon: Settings, roles: ['admin', 'agency'] },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setUserRole } = useUser();
    const { project, deliverables, currentProjectId } = useProject();
    const [attentionCount, setAttentionCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHoveringLeftSidebar, setIsHoveringLeftSidebar] = useState(false);
    const [isUserButtonOpen, setIsUserButtonOpen] = useState(false);
    
    // Filter navigation items based on user role
    const navigationItems = useMemo(() => {
        if (!user) return [];
        
        return allNavigationItems.filter(item => {
            // Check if this item is available for the user's role
            if (!item.roles.includes(user.role)) return false;
            
            // Use client-specific name if available
            if (user.role === 'client' && item.clientName) {
                return { ...item, name: item.clientName };
            }
            
            return item;
        });
    }, [user]);
    
    // Calculate attention required items for clients
    useEffect(() => {
        if (user?.role === 'client' && deliverables) {
            // Count deliverables with submitted status (requiring client approval)
            const pendingApproval = deliverables.filter(d => d.status === 'submitted').length;
            setAttentionCount(pendingApproval);
        }
    }, [user, deliverables]);

    // Detect UserButton dropdown state using MutationObserver
    useEffect(() => {
        let observer;
        let resetTimeout;
        
        // Function to check if dropdown is present
        const checkDropdownPresence = () => {
            const dropdownExists = !!(
                document.querySelector('[data-clerk-portal]') ||
                document.querySelector('.cl-userButtonPopoverCard') ||
                document.querySelector('.cl-popoverCard')
            );
            
            if (dropdownExists !== isUserButtonOpen) {
                setIsUserButtonOpen(dropdownExists);
                
                // If dropdown closed, also reset hover state after a delay
                if (!dropdownExists) {
                    resetTimeout = setTimeout(() => {
                        setIsHoveringLeftSidebar(false);
                    }, 200);
                }
            }
        };
        
        // Set up MutationObserver to watch for Clerk dropdown
        observer = new MutationObserver(() => {
            checkDropdownPresence();
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-clerk-portal', 'class']
        });
        
        // Also handle click outside
        const handleClickOutside = (event) => {
            const sidebar = document.querySelector('[data-sidebar]');
            const dropdownElements = document.querySelectorAll('[data-clerk-portal], .cl-userButtonPopoverCard, .cl-popoverCard');
            
            let clickedInsideDropdown = false;
            dropdownElements.forEach(el => {
                if (el && el.contains(event.target)) {
                    clickedInsideDropdown = true;
                }
            });
            
            // If clicked outside both sidebar and dropdown, collapse everything
            if (!clickedInsideDropdown && sidebar && !sidebar.contains(event.target)) {
                setIsUserButtonOpen(false);
                setIsHoveringLeftSidebar(false);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        
        // Cleanup
        return () => {
            if (observer) observer.disconnect();
            if (resetTimeout) clearTimeout(resetTimeout);
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const handleNotificationClick = (notification) => {
        // Navigate to the relevant deliverable when notification is clicked
        if (notification.data?.deliverable_id) {
            navigate(`/deliverables/${notification.data.deliverable_id}`);
        }
    };

    // Determine if sidebar is expanded - keep expanded when UserButton is open
    const isSidebarExpanded = isHoveringLeftSidebar || isUserButtonOpen;
    
    return (
        <TooltipProvider>
        <div className="h-screen flex w-full overflow-hidden">
            {/* Sidebar */}
            <div 
                data-sidebar
                className={`hidden md:flex ${isSidebarExpanded ? 'md:w-64' : 'md:w-20'} md:flex-col transition-all duration-300 h-screen relative`}
                onMouseEnter={() => setIsHoveringLeftSidebar(true)}
                onMouseLeave={(e) => {
                    // Check if we're moving to the UserButton dropdown
                    const relatedTarget = e.relatedTarget;
                    const isMovingToDropdown = relatedTarget && (
                        relatedTarget.closest('[data-clerk-portal]') ||
                        relatedTarget.closest('.cl-userButtonPopoverCard') ||
                        relatedTarget.closest('.cl-popoverCard')
                    );
                    
                    // Don't collapse if UserButton is open or moving to dropdown
                    if (!isUserButtonOpen && !isMovingToDropdown) {
                        // Add a small delay to prevent flashing
                        setTimeout(() => {
                            // Double-check dropdown isn't open
                            const dropdownStillExists = !!(
                                document.querySelector('[data-clerk-portal]') ||
                                document.querySelector('.cl-userButtonPopoverCard') ||
                                document.querySelector('.cl-popoverCard')
                            );
                            
                            if (!dropdownStillExists) {
                                setIsHoveringLeftSidebar(false);
                            }
                        }, 100);
                    }
                }}
            >
                <div className="flex flex-col h-full border-r border-gray-200/60 bg-white/80 backdrop-blur-xl">
                    {/* Logo Header */}
                    <div className="border-b border-gray-100/80 py-5 px-6 flex-shrink-0">
                        {isSidebarExpanded ? (
                            <Logo 
                                variant="dark" 
                                showTagline={true}
                                linkTo="/dashboard"
                            />
                        ) : (
                            <div className="flex justify-center">
                                <Link to="/dashboard" className="text-2xl font-serif text-gray-900">P</Link>
                            </div>
                        )}
                    </div>
                    
                    {/* Navigation */}
                    <nav className={`flex-1 overflow-y-auto ${isSidebarExpanded ? 'px-4' : 'px-2'} py-4 space-y-1`}>
                        {navigationItems.map((item) => {
                            const isActive = location.pathname === `/${item.href}` || 
                                           location.pathname.startsWith(`/${item.href}/`);
                            
                            // Show badge for deliverables if client has attention items
                            const showBadge = user?.role === 'client' && 
                                            item.href === 'deliverables' && 
                                            attentionCount > 0;
                            
                            // For Dashboard and Stages, include project ID if available
                            const linkPath = (item.href === 'dashboard' || item.href === 'stages') && currentProjectId
                                ? `/${item.href}/${currentProjectId}`
                                : `/${item.href}`;
                            
                            const linkContent = (
                                <Link
                                    key={item.href}
                                    to={linkPath}
                                    className={cn(
                                        "flex items-center transition-all relative",
                                        isSidebarExpanded ? "justify-between px-3 py-2 rounded-lg" : "justify-center px-3 py-3 rounded-lg",
                                        "text-sm font-medium",
                                        isActive
                                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    )}
                                >
                                    <div className={`flex items-center ${isSidebarExpanded ? 'gap-3' : ''}`}>
                                        <item.icon className="w-4 h-4" />
                                        {isSidebarExpanded && <span>{item.name}</span>}
                                    </div>
                                    {showBadge && isSidebarExpanded && (
                                        <Badge className="bg-red-600 text-white text-xs px-1.5 py-0.5">
                                            {attentionCount}
                                        </Badge>
                                    )}
                                    {showBadge && !isSidebarExpanded && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full" />
                                    )}
                                </Link>
                            );

                            if (!isSidebarExpanded) {
                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>
                                            {linkContent}
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p>{item.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return linkContent;
                        })}
                    </nav>

                    {/* Footer - User Section */}
                    <div className={`border-t border-gray-100/80 flex-shrink-0 ${isSidebarExpanded ? 'p-4' : 'p-2'}`}>
                        {/* Role Selector - Only when expanded */}
                        {isSidebarExpanded && (
                            <div className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Current Role</span>
                                </div>
                                <Select value={user?.role} onValueChange={setUserRole}>
                                    <SelectTrigger className="w-full h-9">
                                        <SelectValue>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`${getRoleBadgeColor(user?.role)} text-xs`}>
                                                    {getRoleDisplayName(user?.role)}
                                                </Badge>
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                                                    Administrator
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="agency">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                                    Agency Team
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="client">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                                                    Client Team
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* User Info */}
                        <div className={`flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'}`}>
                            {!isSidebarExpanded ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <UserButton 
                                                appearance={{
                                                    elements: {
                                                        avatarBox: "w-10 h-10",
                                                        userButtonTrigger: "focus:shadow-none",
                                                        userButtonPopoverCard: "z-[60]"
                                                    }
                                                }}
                                                afterSignOutUrl="/"
                                                afterMultiSessionSingleSignOutUrl="/"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <div>
                                            <p className="font-semibold text-sm">{user?.full_name || user?.email?.split('@')[0] || 'User'}</p>
                                            <p className="text-xs text-gray-500">{user?.email || 'Loading...'}</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <>
                                    <UserButton 
                                        appearance={{
                                            elements: {
                                                avatarBox: "w-10 h-10",
                                                userButtonTrigger: "focus:shadow-none",
                                                userButtonPopoverCard: "z-[60]"
                                            }
                                        }}
                                        afterSignOutUrl="/"
                                        afterMultiSessionSingleSignOutUrl="/"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{user?.full_name || user?.email?.split('@')[0] || 'User'}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email || 'Loading...'}</p>
                                        <div className="mt-1">
                                            <RoleIndicator compact={true} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Desktop header - Premium Design */}
                <header className="hidden md:flex bg-gradient-to-r from-white via-white to-slate-50/50 border-b border-slate-200/60 px-8 py-4 flex-shrink-0 shadow-sm backdrop-blur-xl">
                    <div className="flex items-center justify-between w-full">
                        {/* Project Selector - Premium Style */}
                        {user?.role !== 'client' ? (
                            <ProjectSelector />
                        ) : (
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 rounded-lg border border-slate-200/50">
                                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <Briefcase className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Current Project</p>
                                    <p className="font-semibold text-slate-900">{project?.name || 'Project'}</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Action buttons - Premium Style */}
                        <div className="flex items-center gap-3">
                            {/* External Links Group */}
                            <div className="flex items-center gap-1 bg-slate-100/60 rounded-full px-1 py-1">
                                <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    href="https://slack.com/app_redirect?channel=C123456789"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white transition-all duration-200 group"
                                >
                                    <SlackIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-medium text-slate-700">Slack</span>
                                </motion.a>
                                <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    href="https://drive.google.com/drive/folders/your-project-folder-id"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white transition-all duration-200 group"
                                >
                                    <GoogleDriveIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-medium text-slate-700">Drive</span>
                                </motion.a>
                            </div>
                            
                            {/* Divider */}
                            <div className="w-px h-8 bg-slate-200/50" />
                            
                            {/* Internal Actions */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/out-of-scope')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200/50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 group"
                            >
                                <Plus className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 group-hover:rotate-90 transition-all duration-300" />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Out of Scope</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/timeline')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200/50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 group"
                            >
                                <GanttChartSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Timeline</span>
                            </motion.button>
                            
                            {/* Divider */}
                            <div className="w-px h-8 bg-slate-200/50" />
                            
                            {/* Notification Bell - Premium */}
                            <NotificationBell 
                                onNotificationClick={handleNotificationClick}
                                className="ml-2"
                            />
                        </div>
                    </div>
                </header>
                
                {/* Mobile header - Premium */}
                <header className="md:hidden bg-gradient-to-r from-white via-white to-slate-50/50 border-b border-slate-200/60 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md"
                            >
                                <img
                                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f603af03a_Proncess.jpg"
                                  alt="Princess Logo"
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                            </motion.div>
                            <div>
                                <h1 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Princess</h1>
                                <p className="text-[10px] text-slate-500 font-medium">Brand Development</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <NotificationBell 
                                onNotificationClick={handleNotificationClick}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-lg bg-white border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex items-center justify-center group"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <Menu className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors" />
                            </motion.button>
                        </div>
                    </div>
                    
                    {/* Mobile Menu Dropdown - Premium */}
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-50"
                        >
                            <div className="px-4 py-3 space-y-1">
                                <button
                                    onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Dashboard</span>
                                </button>
                                <button
                                    onClick={() => { navigate('/stages'); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <Layers className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Stages</span>
                                </button>
                                <button
                                    onClick={() => { navigate('/deliverables'); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <Package className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Deliverables</span>
                                </button>
                                <button
                                    onClick={() => { navigate('/timeline'); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <GanttChartSquare className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Timeline</span>
                                </button>
                                <div className="border-t border-slate-200 my-2" />
                                <div className="px-3 py-2">
                                    <UserButton 
                                        appearance={{
                                            elements: {
                                                avatarBox: "w-10 h-10",
                                                userButtonTrigger: "focus:shadow-none",
                                                userButtonPopoverCard: "z-[60]"
                                            }
                                        }}
                                        afterSignOutUrl="/"
                                        afterMultiSessionSingleSignOutUrl="/"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </header>
                
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
        </TooltipProvider>
    );
}

