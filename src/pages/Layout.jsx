

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import { createPageUrl } from '@/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useUser } from '@/contexts/UserContext';
import { getVisibleNavigationItems, getRoleDisplayName, getRoleBadgeColor } from '@/lib/permissions';

const navigationItems = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutGrid },
  { name: 'Deliverables', href: 'Deliverables', icon: FolderKanban },
  { name: 'Timeline', href: 'Timeline', icon: GanttChartSquare },
  { name: 'Out of Scope', href: 'OutofScope', icon: GitMerge },
  { name: 'Team', href: 'Team', icon: Users },
  // { name: 'Brandbook', href: 'Brandbook', icon: BookCopy }, // Hidden for now
  { name: 'Admin', href: 'Admin', icon: Settings },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setUserRole } = useUser();

    const handleNotificationClick = (notification) => {
        // Navigate to the relevant deliverable when notification is clicked
        if (notification.data?.deliverable_id) {
            navigate(createPageUrl(`DeliverableDetail?id=${notification.data.deliverable_id}`));
        }
    };

    return (
        <div className="min-h-screen flex w-full">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col">
                <div className="flex flex-col flex-grow border-r border-gray-200/60 bg-white/80 backdrop-blur-xl">
                    {/* Logo Header */}
                    <div className="border-b border-gray-100/80 p-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img
                                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f603af03a_Proncess.jpg"
                                  alt="Princess Logo"
                                  className="w-10 h-10 rounded-xl object-cover shadow-sm"
                                />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <Sparkles className="w-2 h-2 text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Princess</h2>
                                <p className="text-xs text-gray-500 font-medium">Project Management</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigationItems.map((item) => {
                            const isActive = location.pathname === createPageUrl(item.href) || 
                                           location.pathname.startsWith(createPageUrl(item.href) + '/');
                            return (
                                <Link
                                    key={item.href}
                                    to={createPageUrl(item.href)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-6 mt-auto border-t border-gray-100/80 space-y-4">
                        {/* Role Selector */}
                        <div className="space-y-2">
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

                        {/* User Info */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img 
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f603af03a_Proncess.jpg" 
                                    className="w-10 h-10 rounded-full object-cover" 
                                    alt="User Avatar"
                                />
                                <div>
                                    <p className="font-semibold text-sm">{user?.name || 'Maya Cohen'}</p>
                                    <p className="text-xs text-gray-500">{user?.email || 'maya@email.com'}</p>
                                </div>
                            </div>
                            <NotificationBell 
                                onNotificationClick={handleNotificationClick}
                                className="ml-2"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile header */}
                <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f603af03a_Proncess.jpg"
                              alt="Princess Logo"
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <h1 className="text-lg font-semibold text-gray-900">Princess</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <NotificationBell 
                                onNotificationClick={handleNotificationClick}
                            />
                            <Button variant="ghost" size="sm">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}

