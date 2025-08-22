import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Star, 
  Users, 
  Calendar,
  TrendingUp,
  Target
} from "lucide-react";
import { format, differenceInDays } from 'date-fns';

export default function TimelineStats({ stages, teamMembers, isCollapsed, onToggle }) {
  const stats = useMemo(() => {
    const completed = stages.filter(s => s.status === 'completed').length;
    const inProgress = stages.filter(s => s.status === 'in_progress').length;
    const blocked = stages.filter(s => s.status === 'blocked').length;
    const notReady = stages.filter(s => s.status === 'not_ready').length;
    const deliverables = stages.filter(s => s.is_deliverable).length;
    
    const completionRate = stages.length > 0 ? Math.round((completed / stages.length) * 100) : 0;
    
    // Calculate project timeline
    const datesWithStages = stages.filter(s => s.startDate && s.endDate);
    const projectStart = datesWithStages.length > 0 
      ? new Date(Math.min(...datesWithStages.map(s => s.startDate.getTime())))
      : null;
    const projectEnd = datesWithStages.length > 0
      ? new Date(Math.max(...datesWithStages.map(s => s.endDate.getTime())))
      : null;
    
    const totalDuration = projectStart && projectEnd 
      ? differenceInDays(projectEnd, projectStart) 
      : 0;
    
    // Team workload distribution
    const teamWorkload = teamMembers.map(member => {
      const assignedStages = stages.filter(s => s.assigned_to === member.email);
      const memberCompleted = assignedStages.filter(s => s.status === 'completed').length;
      const workloadRate = assignedStages.length > 0 
        ? Math.round((memberCompleted / assignedStages.length) * 100) 
        : 0;
        
      return {
        ...member,
        assignedCount: assignedStages.length,
        completedCount: memberCompleted,
        workloadRate
      };
    }).sort((a, b) => b.assignedCount - a.assignedCount);
    
    return {
      completed,
      inProgress,
      blocked,
      notReady,
      deliverables,
      completionRate,
      projectStart,
      projectEnd,
      totalDuration,
      teamWorkload: teamWorkload.slice(0, 5) // Top 5 team members
    };
  }, [stages, teamMembers]);

  const statusMetrics = [
    {
      label: 'Completed',
      value: stats.completed,
      percentage: stats.completed / stages.length * 100,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      percentage: stats.inProgress / stages.length * 100,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Blocked',
      value: stats.blocked,
      percentage: stats.blocked / stages.length * 100,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      label: 'Not Ready',
      value: stats.notReady,
      percentage: stats.notReady / stages.length * 100,
      icon: Clock,
      color: 'text-slate-400',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200'
    }
  ];

  if (isCollapsed) {
    return (
      <div 
        className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-slate-900">Project Statistics</span>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {stats.completionRate}% Complete
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>{stages.length} stages</span>
            <span>•</span>
            <span>{stats.deliverables} deliverables</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collapse Button */}
      <div 
        className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-slate-900">Project Statistics</span>
            <Badge variant="outline">Click to collapse</Badge>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {stats.completionRate}% Complete
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Progress */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-indigo-500" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-slate-900">{stats.completionRate}%</span>
                <span className="text-sm text-slate-600">
                  {stats.completed} of {stages.length} stages completed
                </span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
              
              {stats.projectStart && stats.projectEnd && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(stats.projectStart, 'MMM d')} - {format(stats.projectEnd, 'MMM d, yyyy')}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {stats.totalDuration} days
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        {statusMetrics.slice(0, 2).map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${metric.bgColor} ${metric.borderColor} border`}>
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round(metric.percentage)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="w-4 h-4 text-slate-500" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`w-3 h-3 ${metric.color}`} />
                    <span className="text-sm text-slate-600">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{metric.value}</span>
                    <div className="w-16 bg-slate-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${metric.color.replace('text-', 'bg-')}`}
                        style={{ width: `${metric.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-slate-500" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.teamWorkload.map((member) => (
                <div key={member.email} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{member.name}</p>
                      <p className="text-xs text-slate-500">
                        {member.completedCount}/{member.assignedCount} stages
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {member.workloadRate}%
                  </Badge>
                </div>
              ))}
              
              {stats.teamWorkload.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No team members assigned
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
          <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.deliverables}</p>
          <p className="text-sm text-slate-600">Deliverables</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
          <Users className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{teamMembers.length}</p>
          <p className="text-sm text-slate-600">Team Members</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.blocked}</p>
          <p className="text-sm text-slate-600">Blocked</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
          <Calendar className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.totalDuration}</p>
          <p className="text-sm text-slate-600">Total Days</p>
        </div>
      </div>
    </div>
  );
}