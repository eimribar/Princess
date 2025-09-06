import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  FolderKanban,
  ChevronRight,
  Star,
  Sparkles,
  Target,
  Activity,
  MessageSquare,
  FileText,
  Zap,
  ArrowUp,
  ArrowDown,
  Info,
  Eye,
  ThumbsUp,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VisualTimeline from '@/components/dashboard/VisualTimeline';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, addDays, differenceInDays } from 'date-fns';

/**
 * Premium Client Dashboard
 * 
 * A beautiful, read-only dashboard focused on what matters most to clients:
 * - Project progress and timeline
 * - Items requiring attention
 * - Recent updates and milestones
 * - Team activity
 * 
 * Features exceptional UX with smooth animations and intuitive information hierarchy
 */

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState(null);
  const [hoveredStage, setHoveredStage] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in production this would come from your API
  const [projectData] = useState({
    name: 'Brand Transformation 2024',
    client: 'TechCorp Industries',
    progress: 42,
    startDate: new Date('2024-01-15'),
    estimatedEnd: new Date('2024-06-30'),
    actualEnd: null,
    budget: { used: 125000, total: 300000 },
    team: {
      agency: 8,
      client: 3
    }
  });

  // Calculate project metrics
  const projectMetrics = useMemo(() => {
    const today = new Date();
    const daysElapsed = differenceInDays(today, projectData.startDate);
    const totalDays = differenceInDays(projectData.estimatedEnd, projectData.startDate);
    const daysRemaining = differenceInDays(projectData.estimatedEnd, today);
    const timeProgress = (daysElapsed / totalDays) * 100;
    const isOnTrack = projectData.progress >= timeProgress - 5; // 5% buffer

    return {
      daysElapsed,
      totalDays,
      daysRemaining,
      timeProgress: Math.min(100, Math.max(0, timeProgress)),
      isOnTrack,
      efficiency: projectData.progress / timeProgress
    };
  }, [projectData]);

  // Items requiring client attention
  const attentionItems = [
    {
      id: 1,
      title: 'Logo Design V2',
      description: 'Review and approve the updated logo design with new color variations',
      type: 'approval',
      priority: 'high',
      dueDate: addDays(new Date(), 2),
      stage: 'Brand Identity',
      icon: Star
    },
    {
      id: 2,
      title: 'Brand Strategy Document',
      description: 'Provide feedback on the brand positioning and messaging framework',
      type: 'feedback',
      priority: 'medium',
      dueDate: addDays(new Date(), 5),
      stage: 'Strategy',
      icon: FileText
    },
    {
      id: 3,
      title: 'Color Palette Selection',
      description: 'Choose between 3 proposed color palette options',
      type: 'decision',
      priority: 'high',
      dueDate: addDays(new Date(), 1),
      stage: 'Visual Identity',
      icon: Sparkles
    }
  ];

  // Recent milestones
  const recentMilestones = [
    {
      id: 1,
      title: 'Research Phase Completed',
      date: new Date('2024-02-15'),
      description: 'Market research and competitor analysis finalized',
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      id: 2,
      title: 'Strategy Workshop Held',
      date: new Date('2024-02-20'),
      description: 'Collaborative workshop with key stakeholders',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 3,
      title: 'Initial Concepts Presented',
      date: new Date('2024-03-01'),
      description: 'First round of creative concepts shared',
      icon: Sparkles,
      color: 'text-purple-600'
    }
  ];

  // Upcoming deliverables
  const upcomingDeliverables = [
    {
      id: 1,
      name: 'Brand Guidelines Document',
      dueDate: addDays(new Date(), 14),
      status: 'in_progress',
      completion: 75
    },
    {
      id: 2,
      name: 'Website Mockups',
      dueDate: addDays(new Date(), 21),
      status: 'in_progress',
      completion: 40
    },
    {
      id: 3,
      name: 'Marketing Collaterals',
      dueDate: addDays(new Date(), 30),
      status: 'not_started',
      completion: 0
    }
  ];

  // Priority indicator component
  const PriorityIndicator = ({ priority }) => {
    const config = {
      high: { color: 'text-red-600 bg-red-50', icon: ArrowUp, label: 'High Priority' },
      medium: { color: 'text-yellow-600 bg-yellow-50', icon: ArrowDown, label: 'Medium Priority' },
      low: { color: 'text-green-600 bg-green-50', icon: ArrowDown, label: 'Low Priority' }
    };

    const { color, icon: Icon, label } = config[priority] || config.medium;

    return (
      <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", color)}>
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
    );
  };

  // Animated number component
  const AnimatedNumber = ({ value, suffix = '', prefix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [value]);

    return (
      <span>
        {prefix}{displayValue}{suffix}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Project Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  {projectData.name}
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    Active
                  </Badge>
                </h1>
                <p className="mt-2 text-gray-600">
                  {projectData.client} • Started {format(projectData.startDate, 'MMMM d, yyyy')}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Days Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <AnimatedNumber value={projectMetrics.daysRemaining} />
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <AnimatedNumber value={projectData.team.agency + projectData.team.client} />
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <AnimatedNumber value={Math.round(projectMetrics.efficiency * 100)} suffix="%" />
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    projectMetrics.isOnTrack ? "bg-green-100" : "bg-yellow-100"
                  )}>
                    {projectMetrics.isOnTrack ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Project Progress: {projectData.progress}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {projectMetrics.isOnTrack ? 'On track' : 'Slightly behind schedule'} • 
                      {' '}{projectMetrics.daysElapsed} of {projectMetrics.totalDays} days elapsed
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/client/timeline')}
                  className="hidden sm:flex"
                >
                  View Timeline
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              {/* Dual Progress Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Work Progress</span>
                    <span>{projectData.progress}%</span>
                  </div>
                  <Progress value={projectData.progress} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Time Progress</span>
                    <span>{Math.round(projectMetrics.timeProgress)}%</span>
                  </div>
                  <Progress value={projectMetrics.timeProgress} className="h-2 bg-gray-200">
                    <div className="h-full bg-gray-400 rounded-full" style={{ width: `${projectMetrics.timeProgress}%` }} />
                  </Progress>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Attention Required */}
          <div className="lg:col-span-1 space-y-6">
            {/* Attention Required Card */}
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="w-5 h-5" />
                  Action Required
                  <Badge className="ml-auto bg-red-500 text-white">
                    {attentionItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {attentionItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-white rounded-lg border border-red-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate('/client/deliverables')}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        item.type === 'approval' ? "bg-blue-100" : 
                        item.type === 'feedback' ? "bg-yellow-100" : "bg-purple-100"
                      )}>
                        <item.icon className={cn(
                          "w-5 h-5",
                          item.type === 'approval' ? "text-blue-600" : 
                          item.type === 'feedback' ? "text-yellow-600" : "text-purple-600"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {item.title}
                          </h4>
                          <PriorityIndicator priority={item.priority} />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            Due {formatDistanceToNow(item.dueDate, { addSuffix: true })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.stage}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                  onClick={() => navigate('/client/deliverables')}
                >
                  Review All Items
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Recent Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Recent Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMilestones.map((milestone, index) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <milestone.icon className={cn("w-5 h-5", milestone.color)} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {milestone.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {milestone.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(milestone.date, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Timeline & Deliverables */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline Visualization */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Project Timeline
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/client/timeline')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Full View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-auto">
                  <VisualTimeline
                    stages={[]} // Will be populated with actual stages from API
                    onStageClick={setSelectedStage}
                    onStageHover={setHoveredStage}
                    readOnly={true} // Client view is read-only
                  />
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deliverables */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-purple-600" />
                    Upcoming Deliverables
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/client/deliverables')}
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingDeliverables.map((deliverable, index) => (
                    <motion.div
                      key={deliverable.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {deliverable.name}
                        </h4>
                        <Badge 
                          variant="outline"
                          className={cn(
                            deliverable.status === 'in_progress' ? "border-yellow-500 text-yellow-700" :
                            deliverable.status === 'not_started' ? "border-gray-400 text-gray-600" :
                            "border-green-500 text-green-700"
                          )}
                        >
                          {deliverable.status === 'in_progress' ? 'In Progress' :
                           deliverable.status === 'not_started' ? 'Not Started' : 'Completed'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due {format(deliverable.dueDate, 'MMM d')}
                        </span>
                        <span className="font-medium">
                          {deliverable.completion}% Complete
                        </span>
                      </div>
                      <Progress value={deliverable.completion} className="mt-2 h-2" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Recent Team Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">JD</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">John Doe</span> uploaded Logo Design V2
                      </p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-green-600">SK</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Sarah Kim</span> completed Brand Research
                      </p>
                      <p className="text-xs text-gray-500">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-purple-600">MB</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Mike Brown</span> added a comment on Strategy Doc
                      </p>
                      <p className="text-xs text-gray-500">Yesterday</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;