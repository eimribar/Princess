/**
 * Project Management Component
 * Allows admins to manage projects with proper delete confirmation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { 
  Trash2, 
  AlertTriangle, 
  Archive,
  Eye,
  Edit,
  Calendar,
  Users,
  FolderOpen,
  FileText,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import dataService from '@/services/dataService';
import dateService from '@/services/dateService';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    project: null,
    details: null
  });
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectList = await dataService.getProjects('-created_at');
      
      // Load additional details for each project
      const projectsWithDetails = await Promise.all(
        projectList.map(async (project) => {
          const [stages, team, deliverables, comments] = await Promise.all([
            dataService.getProjectStages(project.id),
            dataService.getProjectTeamMembers(project.id),
            dataService.getProjectDeliverables(project.id),
            dataService.getProjectComments(project.id)
          ]);
          
          return {
            ...project,
            stageCount: stages?.length || 0,
            teamCount: team?.length || 0,
            deliverableCount: deliverables?.length || 0,
            commentCount: comments?.length || 0
          };
        })
      );
      
      setProjects(projectsWithDetails);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (project) => {
    setDeleteDialog({
      open: true,
      project,
      details: {
        stages: project.stageCount,
        team: project.teamCount,
        deliverables: project.deliverableCount,
        comments: project.commentCount
      }
    });
    setConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.project) return;
    
    // Require typing project name for confirmation
    if (confirmText !== deleteDialog.project.name) {
      toast({
        title: 'Confirmation Required',
        description: `Please type "${deleteDialog.project.name}" to confirm deletion`,
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await dataService.deleteProject(deleteDialog.project.id);
      
      toast({
        title: 'Project Deleted',
        description: `${deleteDialog.project.name} has been permanently deleted`,
        className: 'bg-red-500 text-white'
      });
      
      // Reload projects
      await loadProjects();
      
      // Close dialog
      setDeleteDialog({ open: false, project: null, details: null });
      setConfirmText('');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete project',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || colors.active;
  };

  const filteredProjects = projects.filter(project => 
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
          <p className="text-gray-600 mt-1">Manage and configure all projects</p>
        </div>
        <Button 
          onClick={() => navigate('/project-initiation')}
          className="gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.client_name}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{project.stageCount} stages</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{project.teamCount} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FolderOpen className="w-4 h-4" />
                      <span>{project.deliverableCount} deliverables</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      <span>{project.commentCount} comments</span>
                    </div>
                  </div>
                  
                  {/* Dates */}
                  {project.start_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Started {dateService.toDisplay(project.start_date)}</span>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/dashboard/${project.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/admin/project/${project.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(project)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ open: false, project: null, details: null });
            setConfirmText('');
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Project Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div>
                You are about to permanently delete:
                <div className="font-semibold text-gray-900 mt-2">
                  {deleteDialog.project?.name}
                </div>
                <div className="text-sm text-gray-600">
                  Client: {deleteDialog.project?.client_name}
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <p className="font-semibold text-red-900 text-sm">
                  This action will permanently delete:
                </p>
                <ul className="space-y-1 text-sm text-red-800">
                  <li>• {deleteDialog.details?.stages || 0} stages and their dependencies</li>
                  <li>• {deleteDialog.details?.team || 0} team member assignments</li>
                  <li>• {deleteDialog.details?.deliverables || 0} deliverables and versions</li>
                  <li>• {deleteDialog.details?.comments || 0} comments and feedback</li>
                  <li>• All notifications and activity logs</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  To confirm deletion, type the project name below:
                </p>
                <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {deleteDialog.project?.name}
                </p>
                <Input
                  placeholder="Type project name to confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={confirmText === deleteDialog.project?.name 
                    ? 'border-green-500' 
                    : confirmText ? 'border-red-500' : ''
                  }
                />
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900 font-medium">
                  ⚠️ This action cannot be undone
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Consider archiving the project instead if you might need it later.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={confirmText !== deleteDialog.project?.name}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}