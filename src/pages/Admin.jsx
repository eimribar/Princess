import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, 
  Users, 
  FolderOpen,
  BarChart3,
  Plus,
  Rocket,
  Database,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  UserPlus,
  Shield,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import ProjectManagement from "../components/admin/ProjectManagement";
import PlaybookSeeder from "../components/admin/PlaybookSeeder";
import DeliverablePlaybook from "../components/admin/DeliverablePlaybook";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/ClerkUserContext";
import dataService from "@/services/dataService";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalUsers: 0,
    activeUsers: 0,
    avgCompletionRate: 0,
    upcomingDeadlines: 0,
    pendingApprovals: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Load projects
      const projects = await dataService.getProjects();
      const activeProjects = projects.filter(p => p.status === 'active' || !p.status);
      const completedProjects = projects.filter(p => p.status === 'completed');
      
      // Load users (simplified for now)
      const users = await dataService.getUsers().catch(() => []);
      
      // Calculate statistics
      let totalCompletion = 0;
      let upcomingDeadlines = 0;
      let pendingApprovals = 0;
      
      for (const project of activeProjects) {
        // Get project stages
        const stages = await dataService.getProjectStages(project.id);
        const completedStages = stages.filter(s => s.status === 'completed').length;
        const completion = stages.length > 0 ? (completedStages / stages.length) * 100 : 0;
        totalCompletion += completion;
        
        // Check for upcoming deadlines (next 7 days)
        const deliverables = await dataService.getProjectDeliverables(project.id);
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        deliverables.forEach(d => {
          if (d.deadline) {
            const deadline = new Date(d.deadline);
            if (deadline > now && deadline <= weekFromNow) {
              upcomingDeadlines++;
            }
          }
          if (d.status === 'pending_approval' || d.status === 'submitted') {
            pendingApprovals++;
          }
        });
      }
      
      // Calculate recent activity
      const recentProjects = projects.slice(0, 5).map(p => ({
        id: p.id,
        type: 'project',
        title: `Project "${p.name}" ${p.status === 'completed' ? 'completed' : 'created'}`,
        time: p.updated_at || p.created_at,
        status: p.status || 'active'
      }));
      
      setStats({
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active !== false).length,
        avgCompletionRate: activeProjects.length > 0 ? Math.round(totalCompletion / activeProjects.length) : 0,
        upcomingDeadlines,
        pendingApprovals
      });
      
      setRecentActivity(recentProjects);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = "blue" }) => {
    const colorClasses = {
      blue: "from-blue-500 to-indigo-600",
      green: "from-green-500 to-emerald-600",
      amber: "from-amber-500 to-orange-600",
      purple: "from-purple-500 to-pink-600"
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">{title}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
                {trend && (
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {trend}
                  </p>
                )}
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">Manage your Princess platform efficiently</p>
          </div>
          
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={() => navigate('/project-initiation')}
          >
            <Rocket className="w-5 h-5 mr-2" />
            Start New Project
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Active Projects" 
            value={stats.activeProjects}
            icon={FolderOpen}
            trend={`${stats.totalProjects} total`}
            color="blue"
          />
          <StatCard 
            title="Active Users" 
            value={stats.activeUsers}
            icon={Users}
            trend={`${stats.totalUsers} total`}
            color="green"
          />
          <StatCard 
            title="Avg. Completion" 
            value={`${stats.avgCompletionRate}%`}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard 
            title="Pending Approvals" 
            value={stats.pendingApprovals}
            icon={Clock}
            trend={`${stats.upcomingDeadlines} deadlines soon`}
            color="amber"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Management</CardTitle>
                    <CardDescription>View and manage all projects in the system</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/project-initiation')} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ProjectManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage users, roles, and permissions</CardDescription>
                  </div>
                  <Button variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-600">Admin Users</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">2</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-600">Agency Users</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">8</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-600">Client Users</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">15</p>
                    </div>
                  </div>
                  
                  <div className="text-center py-12 border-t">
                    <p className="text-slate-500">User management interface coming soon</p>
                    <p className="text-sm text-slate-400 mt-2">Use Clerk Dashboard for now</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6">
              {/* System Setup */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-slate-600" />
                    <div>
                      <CardTitle>System Setup</CardTitle>
                      <CardDescription>Initialize system with default workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PlaybookSeeder />
                </CardContent>
              </Card>

              {/* Global Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-slate-600" />
                    <div>
                      <CardTitle>Global Configuration</CardTitle>
                      <CardDescription>Configure system-wide settings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="font-medium">Default Notification Settings</p>
                          <p className="text-sm text-slate-600">Email notifications for all new projects</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="font-medium">Default Approval SLA</p>
                          <p className="text-sm text-slate-600">3 business days</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="font-medium">Activity Retention</p>
                          <p className="text-sm text-slate-600">Keep logs for 90 days</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reference Tab */}
          <TabsContent value="reference" className="space-y-6">
            <DeliverablePlaybook />
          </TabsContent>
        </Tabs>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-slate-600" />
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions across the platform</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'completed' ? 'bg-green-500' :
                        activity.status === 'active' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-slate-500">
                          {activity.time ? new Date(activity.time).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}