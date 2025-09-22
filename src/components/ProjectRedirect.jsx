/**
 * Project Redirect Component
 * Ensures dashboard always has a project ID in the URL
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SupabaseProject } from '@/api/supabaseEntities';
import { Loader2 } from 'lucide-react';

export default function ProjectRedirect() {
  const [loading, setLoading] = useState(true);
  const [firstProjectId, setFirstProjectId] = useState(null);
  
  useEffect(() => {
    loadFirstProject();
  }, []);
  
  const loadFirstProject = async () => {
    try {
      // Get all projects
      const projects = await SupabaseProject.list('-created_at');
      
      if (projects && projects.length > 0) {
        // Use the most recently created project
        setFirstProjectId(projects[0].id);
      } else {
        // No projects exist, redirect to project creation
        setFirstProjectId('new');
      }
    } catch (error) {
      console.error('Failed to load projects for redirect:', error);
      // Fallback to project creation
      setFirstProjectId('new');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to appropriate location
  if (firstProjectId === 'new') {
    return <Navigate to="/project-initiation" replace />;
  }
  
  return <Navigate to={`/dashboard/${firstProjectId}`} replace />;
}