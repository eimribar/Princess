/**
 * Project Selector using Workspace Component
 * Clean, professional project switcher with progress indicator
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import {
  Workspaces,
  WorkspaceTrigger,
  WorkspaceContent,
} from '@/components/ui/workspaces';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlusIcon } from 'lucide-react';

export default function ProjectSelector() {
  const navigate = useNavigate();
  const { 
    switchProject, 
    currentProjectId, 
    projects,
    stages,
    isLoading,
    isSwitchingProject,
  } = useProject();

  const handleProjectChange = async (project) => {
    if (project.id !== currentProjectId) {
      // Switch project in context first
      await switchProject(project.id);
      // Then navigate
      navigate(`/dashboard/${project.id}`);
    }
  };

  // Calculate project progress
  const projectProgress = stages ? 
    Math.round((stages.filter(s => s.status === 'completed').length / stages.length) * 100) || 0 
    : 0;

  // Transform projects for workspace component with avatar URLs
  const workspaceProjects = projects.map(p => ({
    id: p.id,
    name: p.name || 'Unnamed Project',
    logo: `https://avatar.vercel.sh/${p.name?.replace(/\s+/g, '-').toLowerCase() || 'project'}`,
    plan: p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1).replace('_', ' ') : 'Active',
    ...p
  }));

  if (isLoading || isSwitchingProject) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-slate-200 animate-pulse min-w-72">
        <div className="w-6 h-6 rounded-full bg-slate-200" />
        <div className="h-4 w-32 bg-slate-200 rounded" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Button
        onClick={() => navigate('/project-initiation')}
        className="min-w-72"
      >
        <PlusIcon className="mr-2 h-4 w-4" />
        Create First Project
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Workspaces
        workspaces={workspaceProjects}
        selectedWorkspaceId={currentProjectId}
        onWorkspaceChange={handleProjectChange}
      >
        <WorkspaceTrigger className="min-w-72" />
        <WorkspaceContent>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full justify-start"
            onClick={() => navigate('/project-initiation')}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create workspace
          </Button>
        </WorkspaceContent>
      </Workspaces>
      
      {stages && stages.length > 0 && (
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-600">Progress</span>
          </div>
          <Progress value={projectProgress} className="h-2 w-20" />
          <span className="text-xs font-bold text-slate-700">{projectProgress}%</span>
        </div>
      )}
    </div>
  );
}