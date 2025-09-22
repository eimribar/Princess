/**
 * Project Selector Component
 * Allows users to switch between multiple projects
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SupabaseProject } from '@/api/supabaseEntities';
import { useProject } from '@/contexts/ProjectContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';

export default function ProjectSelector() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { switchProject, currentProjectId } = useProject();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [projectId]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      
      // Load projects from Supabase only (no fallback to avoid contamination)
      let projectList = await SupabaseProject.list('-created_at');
      
      setProjects(projectList || []);
      
      // Set current project
      if (projectId) {
        const current = projectList.find(p => p.id === projectId);
        setCurrentProject(current);
      } else if (projectList.length > 0) {
        setCurrentProject(projectList[0]);
      }
      
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectChange = async (projectId) => {
    if (projectId === 'new') {
      navigate('/project-initiation');
    } else {
      // Switch project in context first
      await switchProject(projectId);
      // Then navigate
      navigate(`/dashboard/${projectId}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <Briefcase className="w-4 h-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Button
        onClick={() => navigate('/project-initiation')}
        variant="outline"
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Create First Project
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <FolderOpen className="w-4 h-4" />
        <span>Project:</span>
      </div>
      
      <Select
        value={currentProject?.id || ''}
        onValueChange={handleProjectChange}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name || 'Unnamed Project'}
            </SelectItem>
          ))}
          
          <SelectItem value="new" className="border-t mt-2 pt-2">
            <div className="flex items-center gap-2 text-blue-600">
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      {projects.length > 1 && (
        <div className="text-xs text-gray-500">
          {projects.length} projects
        </div>
      )}
    </div>
  );
}