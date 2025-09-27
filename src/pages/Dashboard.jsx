import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { useUser } from '@/contexts/ClerkUserContext';
import { 
  Layers,
  FileText,
  Bell,
  CheckSquare,
  Loader2,
  Info,
  Activity,
  CheckCircle,
  ArrowRight,
  Clock as ClockIcon
} from 'lucide-react';
import { NotificationEntity } from '@/components/notifications/NotificationCenter';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { SupabaseTeamMember } from '@/api/supabaseEntities';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { 
    project, 
    stages, 
    deliverables,
    isLoading 
  } = useProject();
  
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Load notifications and team data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load notifications
        const allNotifications = await NotificationEntity.list();
        // Filter for current project
        const projectNotifications = allNotifications.filter(n => 
          n.data?.project_id === projectId || 
          n.data?.projectId === projectId
        );
        setUnreadNotificationCount(projectNotifications.filter(n => !n.read).length);
        
        // Convert recent notifications to activities
        const activities = projectNotifications
          .slice(0, 5)
          .map(n => ({
            id: n.id,
            user: n.data?.user_name || 'System',
            action: n.title,
            target: n.data?.deliverable_name || n.data?.stage_name || '',
            time: n.created_at,
            type: n.type
          }));
        setRecentActivities(activities);
        
        // Load team members for current project
        const members = await SupabaseTeamMember.filter({ project_id: projectId });
        setTeamMembers(members);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };
    
    if (projectId) {
      loadDashboardData();
    }
  }, [projectId]);
  
  // Calculate metrics
  const metrics = useMemo(() => {
    if (!stages || !deliverables) {
      return {
        activeProjects: 1,
        deliverablesInProgress: 0,
        pendingApprovals: 0,
        totalStages: 0,
        notStartedStages: 0,
        inProgressStages: 0,
        blockedStages: 0,
        completedStages: 0,
        deliverablesByStatus: {
          draft: 0,
          wip: 0,
          submitted: 0,
          approved: 0,
          declined: 0
        },
        totalDeliverables: 0
      };
    }
    
    const deliverablesInProgress = deliverables.filter(d => 
      ['draft', 'wip', 'submitted'].includes(d.status)
    ).length;
    const pendingApprovals = deliverables.filter(d => d.status === 'submitted').length;
    const notStartedStages = stages.filter(s => s.status === 'not_ready' || s.status === 'not_started').length;
    const inProgressStages = stages.filter(s => s.status === 'in_progress').length;
    const blockedStages = stages.filter(s => s.status === 'blocked').length;
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const totalStages = stages.length;
    
    // Calculate deliverables breakdown
    const deliverablesByStatus = {
      draft: deliverables.filter(d => d.status === 'draft').length,
      wip: deliverables.filter(d => d.status === 'wip').length,
      submitted: deliverables.filter(d => d.status === 'submitted').length,
      approved: deliverables.filter(d => d.status === 'approved').length,
      declined: deliverables.filter(d => d.status === 'declined').length
    };
    
    return {
      activeProjects: 1,
      deliverablesInProgress,
      pendingApprovals,
      totalStages,
      notStartedStages,
      inProgressStages,
      blockedStages,
      completedStages,
      deliverablesByStatus,
      totalDeliverables: deliverables.length
    };
  }, [stages, deliverables]);
  
  // Calculate percentages
  const getProgressPercentage = (value) => {
    if (metrics.totalStages === 0) return 0;
    return Math.min(100, Math.round((value / metrics.totalStages) * 100));
  };
  
  // Get urgent actions
  const urgentActions = useMemo(() => {
    const actions = [];
    
    if (deliverables) {
      const today = new Date();
      
      deliverables
        .filter(d => d.status === 'submitted' || d.deadline)
        .forEach(d => {
          let description = '';
          
          if (d.status === 'submitted') {
            description = 'Awaiting approval';
          } else if (d.deadline) {
            const daysUntilDeadline = differenceInDays(new Date(d.deadline), today);
            if (daysUntilDeadline <= 5 && daysUntilDeadline >= 0) {
              description = `Due in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'}`;
            } else {
              return;
            }
          }
          
          actions.push({
            id: d.id,
            title: d.status === 'submitted' ? `Approve ${d.name}` : d.name,
            description,
            action: () => navigate(`/deliverables/${d.id}`)
          });
        });
    }
    
    return actions.slice(0, 3);
  }, [deliverables, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}! Here's a snapshot of your projects and deliverables.
        </p>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Metrics Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div 
              className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/stages/${projectId}`)}
            >
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Stages</h3>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
                {metrics.inProgressStages}{' '}
                <span className="text-base font-normal text-slate-600 dark:text-slate-400">
                  of {metrics.totalStages}
                </span>
              </p>
            </div>
            
            <div 
              className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/deliverables')}
            >
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Deliverables in Progress</h3>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
                {metrics.deliverablesInProgress}
              </p>
            </div>
            
            <div 
              className={cn(
                "p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow",
                metrics.pendingApprovals > 0 
                  ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" 
                  : "bg-white dark:bg-slate-800"
              )}
              onClick={() => navigate('/deliverables?status=submitted')}
            >
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Approvals Pending</h3>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
                {metrics.pendingApprovals}
              </p>
            </div>
            
            <div 
              className={cn(
                "p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow",
                unreadNotificationCount > 0 
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" 
                  : "bg-white dark:bg-slate-800"
              )}
              onClick={() => {/* Open notification center */}}
            >
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Notifications</h3>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
                {unreadNotificationCount}
              </p>
            </div>
          </section>
          
          {/* Project Status Overview */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Project Status Overview</h2>
              <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-medium text-slate-800 dark:text-slate-100">Project Status</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{metrics.totalStages}</p>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    +{getProgressPercentage(metrics.completedStages)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="w-28 text-sm text-slate-600 dark:text-slate-400">Not Started</span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div 
                      className="bg-gray-400 h-2.5 rounded-full transition-all cursor-pointer hover:bg-gray-500"
                      style={{ width: `${getProgressPercentage(metrics.notStartedStages)}%` }}
                      onClick={() => navigate(`/stages/${projectId}?status=not_started`)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="w-28 text-sm text-slate-600 dark:text-slate-400">In Progress</span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-500 h-2.5 rounded-full transition-all cursor-pointer hover:bg-indigo-600"
                      style={{ width: `${getProgressPercentage(metrics.inProgressStages)}%` }}
                      onClick={() => navigate(`/stages/${projectId}?status=in_progress`)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="w-28 text-sm text-slate-600 dark:text-slate-400">Stuck</span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div 
                      className="bg-red-500 h-2.5 rounded-full transition-all cursor-pointer hover:bg-red-600"
                      style={{ width: `${getProgressPercentage(metrics.blockedStages)}%` }}
                      onClick={() => navigate(`/stages/${projectId}?status=blocked`)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="w-28 text-sm text-slate-600 dark:text-slate-400">Completed</span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all cursor-pointer hover:bg-green-600"
                      style={{ width: `${getProgressPercentage(metrics.completedStages)}%` }}
                      onClick={() => navigate(`/stages/${projectId}?status=completed`)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Team Activity Feed */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Team Activity Feed</h2>
            
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      {activity.type === 'comment' ? (
                        <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : activity.type === 'approval' ? (
                        <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        <span className="font-medium">{activity.user}</span>
                        {' '}
                        <span className="text-slate-600 dark:text-slate-400">{activity.action}</span>
                        {activity.target && (
                          <>
                            {' '}
                            <span className="font-medium text-slate-800 dark:text-slate-200">{activity.target}</span>
                          </>
                        )}
                      </p>
                      {activity.time && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <button 
                  className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                  onClick={() => {/* Open notifications */}}
                >
                  View all activity →
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                <Activity className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                <p className="mt-2 text-slate-600 dark:text-slate-400">No recent activity</p>
              </div>
            )}
          </section>
        </div>
        
        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          {/* Urgent Actions */}
          <section className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg shadow-sm border border-teal-200 dark:border-teal-800">
            <h2 className="text-xl font-semibold text-teal-800 dark:text-teal-200 mb-4">Urgent Actions</h2>
            
            {urgentActions.length > 0 ? (
              <div className="space-y-3">
                {urgentActions.map((action) => (
                  <div 
                    key={action.id}
                    className="cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/30 p-2 rounded transition-colors"
                    onClick={action.action}
                  >
                    <p className="font-medium text-teal-800 dark:text-teal-200">{action.title}</p>
                    <p className="text-sm text-teal-700 dark:text-teal-300">{action.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-teal-800 dark:text-teal-200">No urgent actions required</p>
                  <p className="text-sm text-teal-700 dark:text-teal-300">All tasks are on track.</p>
                </div>
              </div>
            )}
            
            <button 
              className="mt-4 w-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-white font-semibold py-2 px-4 rounded-lg border border-indigo-600 dark:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
              onClick={() => navigate(`/stages/${projectId}`)}
            >
              View Stages
            </button>
          </section>
          
          {/* Deliverables Breakdown */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Deliverables Breakdown</h2>
            
            <div className="flex items-center mb-4">
              <ClockIcon className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total: {metrics.totalDeliverables} Deliverables
              </p>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-gray-400 mr-2" />
                  <span className="text-sm">Draft</span>
                </div>
                <span className="text-sm font-medium">{metrics.deliverablesByStatus.draft}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="text-sm font-medium">{metrics.deliverablesByStatus.wip}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                  <span className="text-sm">Submitted</span>
                </div>
                <span className="text-sm font-medium">{metrics.deliverablesByStatus.submitted}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  <span className="text-sm">Approved</span>
                </div>
                <span className="text-sm font-medium">{metrics.deliverablesByStatus.approved}</span>
              </div>
              
              {metrics.deliverablesByStatus.declined > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                    <span className="text-sm">Declined</span>
                  </div>
                  <span className="text-sm font-medium">{metrics.deliverablesByStatus.declined}</span>
                </div>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4 overflow-hidden flex">
              {metrics.deliverablesByStatus.approved > 0 && (
                <div 
                  className="bg-green-500 h-2.5 transition-all"
                  style={{ width: `${(metrics.deliverablesByStatus.approved / metrics.totalDeliverables) * 100}%` }}
                />
              )}
              {metrics.deliverablesByStatus.submitted > 0 && (
                <div 
                  className="bg-blue-500 h-2.5 transition-all"
                  style={{ width: `${(metrics.deliverablesByStatus.submitted / metrics.totalDeliverables) * 100}%` }}
                />
              )}
              {metrics.deliverablesByStatus.wip > 0 && (
                <div 
                  className="bg-yellow-500 h-2.5 transition-all"
                  style={{ width: `${(metrics.deliverablesByStatus.wip / metrics.totalDeliverables) * 100}%` }}
                />
              )}
              {metrics.deliverablesByStatus.draft > 0 && (
                <div 
                  className="bg-gray-400 h-2.5 transition-all"
                  style={{ width: `${(metrics.deliverablesByStatus.draft / metrics.totalDeliverables) * 100}%` }}
                />
              )}
              {metrics.deliverablesByStatus.declined > 0 && (
                <div 
                  className="bg-red-500 h-2.5 transition-all"
                  style={{ width: `${(metrics.deliverablesByStatus.declined / metrics.totalDeliverables) * 100}%` }}
                />
              )}
            </div>
            
            <button 
              className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center group hover:text-indigo-700"
              onClick={() => navigate('/deliverables')}
            >
              View all deliverables
              <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </section>
          
          {/* Team Overview */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Team Overview</h2>
              <button 
                className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center group hover:text-indigo-700"
                onClick={() => navigate('/team')}
              >
                View team
                <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            {teamMembers.length > 0 ? (
              <div className="flex items-center -space-x-2">
                {teamMembers.slice(0, 7).map((member) => (
                  <div 
                    key={member.id}
                    className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-800"
                    title={member.name}
                  >
                    {member.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                ))}
                {teamMembers.length > 7 && (
                  <div 
                    className="w-10 h-10 rounded-full bg-slate-500 text-white flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-800"
                    onClick={() => navigate('/team')}
                  >
                    +{teamMembers.length - 7}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">No team members added yet</p>
            )}
          </section>
        </div>
        
        {/* Bottom Section - Quick Links */}
        <div className="lg:col-span-3">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <button 
                className="flex items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                onClick={() => navigate(`/stages/${projectId}`)}
              >
                <Layers className="w-5 h-5 mr-2" />
                All Stages
              </button>
              
              <button 
                className="flex items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                onClick={() => navigate('/deliverables')}
              >
                <FileText className="w-5 h-5 mr-2" />
                All Deliverables
              </button>
              
              <button 
                className="flex items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                onClick={() => {/* Open notification center */}}
              >
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </button>
              
              <button 
                className="flex items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                onClick={() => navigate('/deliverables?status=submitted')}
              >
                <CheckSquare className="w-5 h-5 mr-2" />
                Approvals
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}