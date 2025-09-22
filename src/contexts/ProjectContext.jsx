/**
 * Project Context
 * Global state management for project data with real-time synchronization
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SupabaseStage, SupabaseDeliverable, SupabaseTeamMember, SupabaseProject } from '@/api/supabaseEntities';
import dependencyEngine from '@/services/dependencyEngine';
import dependencyWatcher from '@/services/dependencyWatcher';
import { toast } from 'sonner';
import { addDays, parseISO, format } from 'date-fns';

const ProjectContext = createContext();

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

export function ProjectProvider({ children }) {
  // Core state
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [project, setProject] = useState(null);
  const [stages, setStages] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [selectedStage, setSelectedStage] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;
  
  // Subscribers for real-time updates
  const subscribers = useRef(new Set());
  
  // WebSocket simulation for real-time sync
  const syncChannel = useRef(null);

  // Initialize dependency watcher
  useEffect(() => {
    if (currentProjectId) {
      // Start watching dependencies
      dependencyWatcher.startWatching(currentProjectId, 3000); // Check every 3 seconds
      
      // Subscribe to dependency watcher events
      const unsubscribe = dependencyWatcher.subscribe((event) => {
        if (event.type === 'status_auto_updated') {
          // Update local state
          setStages(prev => prev.map(s => 
            s.id === event.stage.id 
              ? { ...s, status: event.newStatus }
              : s
          ));
          
          // Show toast notification
          toast.info(`${event.stage.name} ${event.reason.toLowerCase()}`);
        } else if (event.type === 'stage_unblocked') {
          // Update local state
          setStages(prev => prev.map(s => 
            s.id === event.stage.id 
              ? { ...s, status: 'not_started' }
              : s
          ));
          
          // Show success toast
          toast.success(`${event.stage.name} is now ready to start!`);
        } else if (event.type === 'pre_assigned_stage_ready') {
          // Special handling for pre-assigned stages becoming ready
          setStages(prev => prev.map(s => 
            s.id === event.stage.id 
              ? { ...s, status: 'not_started' }
              : s
          ));
          
          // Show priority notification for pre-assigned stage
          const assigneeName = event.assignedTo?.name || 'Team member';
          toast.success(
            `🎯 Pre-assigned stage "${event.stage.name}" is now ready! ${assigneeName} has been notified.`,
            { duration: 5000 }
          );
        } else if (event.type === 'urgent_notification') {
          // Handle urgent notifications for pre-assignments
          toast.warning(
            event.title,
            { 
              description: event.message,
              duration: 10000,
              action: {
                label: 'View Stage',
                onClick: () => setSelectedStage(event.stage)
              }
            }
          );
        }
      });
      
      return () => {
        dependencyWatcher.stopWatching();
        unsubscribe();
      };
    }
  }, [currentProjectId]);
  
  // Initialize data on mount
  useEffect(() => {
    // Get project ID from URL or localStorage
    const urlPath = window.location.pathname;
    const match = urlPath.match(/\/dashboard\/([^\/]+)/);
    const projectIdFromUrl = match ? match[1] : null;
    
    if (projectIdFromUrl) {
      setCurrentProjectId(projectIdFromUrl);
      loadProjectData(projectIdFromUrl);
    } else {
      loadProjectData();
    }
    
    initializeSync();
    
    return () => {
      if (syncChannel.current) {
        syncChannel.current.close();
      }
    };
  }, []);

  // Initialize dependency engine whenever stages change
  useEffect(() => {
    if (stages.length > 0) {
      // Process stages to ensure they have proper date fields
      const processedStages = stages.map(stage => ({
        ...stage,
        startDate: stage.start_date || stage.startDate || addDays(new Date(), stage.number_index * 2).toISOString(),
        endDate: stage.end_date || stage.endDate || addDays(new Date(), stage.number_index * 2 + 3).toISOString(),
        dependencies: stage.dependencies || [],
        parallel_tracks: stage.parallel_tracks || []
      }));
      
      // console.log('Initializing dependency engine with', processedStages.length, 'stages');
      // console.log('Sample stage with dependencies:', processedStages.find(s => s.dependencies && s.dependencies.length > 0));
      dependencyEngine.initialize(processedStages);
    }
  }, [stages]);

  /**
   * Recalculate all stage dates based on dependencies and project start date
   */
  const recalculateAllStageDates = async (stages, projectStartDate) => {
    if (!stages || stages.length === 0) return stages;
    
    // Parse the project start date
    const startDate = typeof projectStartDate === 'string' ? parseISO(projectStartDate) : projectStartDate;
    
    // Sort stages by number_index to process in order
    const sortedStages = [...stages].sort((a, b) => a.number_index - b.number_index);
    
    // Create a map for quick lookup
    const stageMap = new Map(sortedStages.map(s => [s.id, s]));
    
    // Track calculated dates
    const calculatedDates = new Map();
    
    // Recursive function to calculate dates for a stage and its dependencies
    const calculateStageDate = (stageId, visited = new Set()) => {
      if (visited.has(stageId)) return null; // Circular dependency check
      if (calculatedDates.has(stageId)) return calculatedDates.get(stageId);
      
      visited.add(stageId);
      const stage = stageMap.get(stageId);
      if (!stage) return null;
      
      let stageStartDate = startDate;
      
      // If stage has dependencies, calculate based on latest dependency end date
      if (stage.dependencies && stage.dependencies.length > 0) {
        let latestEndDate = startDate;
        
        for (const depId of stage.dependencies) {
          const depDates = calculateStageDate(depId, new Set(visited));
          if (depDates && depDates.end) {
            const depEnd = typeof depDates.end === 'string' ? parseISO(depDates.end) : depDates.end;
            if (depEnd > latestEndDate) {
              latestEndDate = depEnd;
            }
          }
        }
        
        // Start this stage 1 day after the latest dependency ends
        stageStartDate = addDays(latestEndDate, 1);
      }
      
      // Calculate end date based on duration
      const duration = stage.estimated_duration || 3; // Default 3 days
      const stageEndDate = addDays(stageStartDate, duration);
      
      const dates = {
        start: format(stageStartDate, 'yyyy-MM-dd'),
        end: format(stageEndDate, 'yyyy-MM-dd')
      };
      
      calculatedDates.set(stageId, dates);
      return dates;
    };
    
    // Calculate dates for all stages
    const updatedStages = sortedStages.map(stage => {
      const dates = calculateStageDate(stage.id);
      if (dates) {
        return {
          ...stage,
          start_date: dates.start,
          end_date: dates.end
        };
      }
      return stage;
    });
    
    // Update dates in database for persistence (optional, batch update)
    // This is commented out to avoid too many database updates during testing
    // You can enable it when ready for production
    /*
    try {
      const updatePromises = updatedStages.map(stage => 
        SupabaseStage.update(stage.id, {
          start_date: stage.start_date,
          end_date: stage.end_date
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating stage dates in database:', error);
    }
    */
    
    return updatedStages;
  };

  /**
   * Load all project data
   */
  const loadProjectData = async (projectId = null) => {
    try {
      setIsLoading(true);
      
      // If we have a specific project ID, load that project's data
      if (projectId) {
        const [projectData, stagesData, deliverablesData, teamData] = await Promise.all([
          SupabaseProject.get(projectId).catch(() => null),
          SupabaseStage.filter({ project_id: projectId }),
          SupabaseDeliverable.filter({ project_id: projectId }),
          SupabaseTeamMember.filter({ project_id: projectId }) // Fixed: Team members are now project-specific
        ]);

        if (projectData) {
          setProject(projectData);
          setCurrentProjectId(projectId);
        }
        
        // Recalculate dates if we have stages and a project start date
        let processedStages = stagesData || [];
        if (processedStages.length > 0 && projectData?.start_date) {
          processedStages = await recalculateAllStageDates(processedStages, projectData.start_date);
        }
        
        setStages(processedStages);
        setDeliverables(deliverablesData || []);
        setTeamMembers(teamData || []);
      } else {
        // Load first available project
        const projectsData = await SupabaseProject.list();
        
        if (projectsData && projectsData.length > 0) {
          const firstProject = projectsData[0];
          setProject(firstProject);
          setCurrentProjectId(firstProject.id);
          
          // Load data for the first project
          const [stagesData, deliverablesData, teamData] = await Promise.all([
            SupabaseStage.filter({ project_id: firstProject.id }),
            SupabaseDeliverable.filter({ project_id: firstProject.id }),
            SupabaseTeamMember.filter({ project_id: firstProject.id }) // Fixed: Team members are now project-specific
          ]);
          
          // Recalculate dates if we have stages and a project start date
          let processedStages = stagesData || [];
          if (processedStages.length > 0 && firstProject?.start_date) {
            processedStages = await recalculateAllStageDates(processedStages, firstProject.start_date);
          }
          
          setStages(processedStages);
          setDeliverables(deliverablesData || []);
          setTeamMembers(teamData || []);
        } else {
          // No projects available
          setStages([]);
          setDeliverables([]);
          setTeamMembers([]);
        }
      }
      
    } catch (error) {
      // console.error('Failed to load project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize real-time synchronization
   */
  const initializeSync = () => {
    // In production, this would be a WebSocket connection
    // For now, we'll use BroadcastChannel for cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      syncChannel.current = new BroadcastChannel('princess-project-sync');
      
      syncChannel.current.onmessage = (event) => {
        handleSyncMessage(event.data);
      };
    }
  };

  /**
   * Handle incoming sync messages
   */
  const handleSyncMessage = (message) => {
    const { type, payload, timestamp, source } = message;
    
    // Ignore our own messages
    if (source === window.location.pathname) return;

    switch (type) {
      case 'stage_update':
        setStages(prev => prev.map(s => 
          s.id === payload.id ? { ...s, ...payload.updates } : s
        ));
        notifySubscribers('stage_updated', payload);
        break;
        
      case 'deliverable_update':
        setDeliverables(prev => prev.map(d => 
          d.id === payload.id ? { ...d, ...payload.updates } : d
        ));
        notifySubscribers('deliverable_updated', payload);
        break;
        
      case 'team_update':
        setTeamMembers(prev => prev.map(t => 
          t.id === payload.id ? { ...t, ...payload.updates } : t
        ));
        notifySubscribers('team_updated', payload);
        break;
    }
  };

  /**
   * Broadcast changes to other tabs/windows
   */
  const broadcastChange = (type, payload) => {
    if (syncChannel.current) {
      syncChannel.current.postMessage({
        type,
        payload,
        timestamp: Date.now(),
        source: window.location.pathname
      });
    }
  };

  /**
   * Subscribe to updates
   */
  const subscribe = useCallback((callback) => {
    subscribers.current.add(callback);
    
    return () => {
      subscribers.current.delete(callback);
    };
  }, []);

  /**
   * Notify all subscribers
   */
  const notifySubscribers = (event, data) => {
    subscribers.current.forEach(callback => {
      callback(event, data);
    });
  };

  /**
   * Quick update for stage status/assignment without full reload - optimistic UI
   */
  const updateStageOptimistic = async (stageId, updates) => {
    try {
      // Update local state immediately for smooth UX
      setStages(prev => prev.map(s => 
        s.id === stageId ? { ...s, ...updates } : s
      ));
      
      // Persist to backend in background
      await SupabaseStage.update(stageId, updates);
      
      // Broadcast to other tabs
      broadcastChange('stage_update', { id: stageId, updates });
      
      return true;
    } catch (error) {
      // Revert on error
      const originalStage = await SupabaseStage.get(stageId);
      setStages(prev => prev.map(s => 
        s.id === stageId ? originalStage : s
      ));
      
      toast.error('Failed to update stage');
      return false;
    }
  };

  /**
   * Update stage with dependency validation
   */
  const updateStage = async (stageId, updates, skipValidation = false) => {
    try {
      setIsValidating(true);
      
      // If dates are changing, validate dependencies
      if (!skipValidation && (updates.start_date || updates.end_date)) {
        const stage = stages.find(s => s.id === stageId);
        const newStart = updates.start_date || stage.start_date;
        const newEnd = updates.end_date || stage.end_date;
        
        const impact = dependencyEngine.calculateCascadeEffect(stageId, newStart, newEnd);
        
        if (!impact.valid) {
          // Show conflicts and ask for confirmation
          setPendingChanges({
            stageId,
            updates,
            impact
          });
          return false;
        }
        
        // Apply cascade changes if valid
        if (impact.affected.length > 0) {
          setPendingChanges({
            stageId,
            updates,
            impact
          });
          return false; // Need user confirmation
        }
      }
      
      // Save to history for undo
      saveToHistory();
      
      // Update local state optimistically
      setStages(prev => prev.map(s => 
        s.id === stageId ? { ...s, ...updates } : s
      ));
      
      // Persist to backend
      await SupabaseStage.update(stageId, updates);
      
      // Broadcast to other tabs
      broadcastChange('stage_update', { id: stageId, updates });
      
      // Notify subscribers
      notifySubscribers('stage_updated', { id: stageId, updates });
      
      toast.success('Stage updated successfully');
      return true;
      
    } catch (error) {
      // console.error('Failed to update stage:', error);
      toast.error('Failed to update stage');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Apply pending changes with cascade
   */
  const applyPendingChanges = async () => {
    if (!pendingChanges) return;
    
    try {
      setIsValidating(true);
      const { stageId, updates, impact } = pendingChanges;
      
      // Save to history
      saveToHistory();
      
      // Apply main change
      await SupabaseStage.update(stageId, updates);
      setStages(prev => prev.map(s => 
        s.id === stageId ? { ...s, ...updates } : s
      ));
      
      // Apply cascade changes
      for (const affected of impact.affected) {
        // Safely convert dates to ISO strings
        const newStartDate = typeof affected.newStart === 'string' 
          ? affected.newStart 
          : affected.newStart instanceof Date 
            ? affected.newStart.toISOString()
            : new Date(affected.newStart).toISOString();
            
        const newEndDate = typeof affected.newEnd === 'string'
          ? affected.newEnd
          : affected.newEnd instanceof Date
            ? affected.newEnd.toISOString()
            : new Date(affected.newEnd).toISOString();
        
        const cascadeUpdates = {
          start_date: newStartDate,
          end_date: newEndDate
        };
        
        await SupabaseStage.update(affected.stageId, cascadeUpdates);
        setStages(prev => prev.map(s => 
          s.id === affected.stageId ? { ...s, ...cascadeUpdates } : s
        ));
      }
      
      // Broadcast changes
      broadcastChange('stage_update', { id: stageId, updates });
      impact.affected.forEach(affected => {
        // Safely convert dates for broadcast
        const newStartDate = typeof affected.newStart === 'string' 
          ? affected.newStart 
          : affected.newStart instanceof Date 
            ? affected.newStart.toISOString()
            : new Date(affected.newStart).toISOString();
            
        const newEndDate = typeof affected.newEnd === 'string'
          ? affected.newEnd
          : affected.newEnd instanceof Date
            ? affected.newEnd.toISOString()
            : new Date(affected.newEnd).toISOString();
            
        broadcastChange('stage_update', { 
          id: affected.stageId, 
          updates: {
            start_date: newStartDate,
            end_date: newEndDate
          }
        });
      });
      
      setPendingChanges(null);
      
      // Reload stages to ensure consistency
      await loadProjectData();
      
      // Show detailed success message
      const affectedCount = impact.affected.length;
      if (affectedCount > 0) {
        toast.success(`Successfully updated the timeline. ${affectedCount} dependent task${affectedCount > 1 ? 's' : ''} ${affectedCount > 1 ? 'were' : 'was'} also adjusted.`);
      } else {
        toast.success('Timeline updated successfully');
      }
      
      return true;
      
    } catch (error) {
      // console.error('Failed to apply pending changes:', error);
      // console.error('Pending changes data:', pendingChanges);
      toast.error(`Failed to apply changes: ${error.message || 'Unknown error'}`);
      setPendingChanges(null); // Clear pending changes to prevent stuck state
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Cancel pending changes
   */
  const cancelPendingChanges = () => {
    setPendingChanges(null);
  };

  /**
   * Update deliverable
   */
  const updateDeliverable = async (deliverableId, updates) => {
    try {
      // Save to history
      saveToHistory();
      
      // Update local state
      setDeliverables(prev => prev.map(d => 
        d.id === deliverableId ? { ...d, ...updates } : d
      ));
      
      // Persist to backend
      await SupabaseDeliverable.update(deliverableId, updates);
      
      // If deliverable is linked to a stage, update stage dates
      const deliverable = deliverables.find(d => d.id === deliverableId);
      if (deliverable?.stage_id && updates.deadline) {
        const stage = stages.find(s => s.id === deliverable.stage_id);
        if (stage) {
          await updateStage(stage.id, { 
            end_date: updates.deadline 
          });
        }
      }
      
      // Broadcast change
      broadcastChange('deliverable_update', { id: deliverableId, updates });
      
      // Notify subscribers
      notifySubscribers('deliverable_updated', { id: deliverableId, updates });
      
      toast.success('Deliverable updated successfully');
      return true;
      
    } catch (error) {
      // console.error('Failed to update deliverable:', error);
      toast.error('Failed to update deliverable');
      return false;
    }
  };

  /**
   * Batch update multiple stages
   */
  const batchUpdateStages = async (stageUpdates) => {
    try {
      setIsValidating(true);
      
      // Save to history
      saveToHistory();
      
      // Apply all updates
      for (const { id, updates } of stageUpdates) {
        await SupabaseStage.update(id, updates);
        setStages(prev => prev.map(s => 
          s.id === id ? { ...s, ...updates } : s
        ));
        
        broadcastChange('stage_update', { id, updates });
      }
      
      toast.success(`Updated ${stageUpdates.length} stages`);
      return true;
      
    } catch (error) {
      // console.error('Failed to batch update stages:', error);
      toast.error('Failed to update stages');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Save current state to history
   */
  const saveToHistory = () => {
    const currentState = {
      stages: [...stages],
      deliverables: [...deliverables],
      timestamp: Date.now()
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  };

  /**
   * Undo last change
   */
  const undo = async () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      
      setStages(previousState.stages);
      setDeliverables(previousState.deliverables);
      setHistoryIndex(prev => prev - 1);
      
      // Persist to backend
      await batchUpdateStages(
        previousState.stages.map(s => ({ id: s.id, updates: s }))
      );
      
      toast.info('Change undone');
    }
  };

  /**
   * Redo last undone change
   */
  const redo = async () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      
      setStages(nextState.stages);
      setDeliverables(nextState.deliverables);
      setHistoryIndex(prev => prev + 1);
      
      // Persist to backend
      await batchUpdateStages(
        nextState.stages.map(s => ({ id: s.id, updates: s }))
      );
      
      toast.info('Change redone');
    }
  };

  /**
   * Switch to a different project
   */
  const switchProject = async (projectId) => {
    if (projectId === currentProjectId) return;
    
    console.log(`🔄 Switching from project ${currentProjectId} to ${projectId}`);
    setIsLoading(true);
    
    // CRITICAL: Clear ALL data completely before switching
    setProject(null);
    setStages([]);
    setDeliverables([]);
    setTeamMembers([]);
    setSelectedStage(null);
    setPendingChanges(null);
    setHistory([]);
    setHistoryIndex(-1);
    
    // Clear any cached data from localStorage
    const keysToRemove = [
      'princess_data',
      'stages_cache',
      'deliverables_cache',
      'team_cache',
      `project_${currentProjectId}`,
      `stages_${currentProjectId}`,
      `deliverables_${currentProjectId}`
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`  Clearing cache: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Update current project ID
    setCurrentProjectId(projectId);
    
    // Force a clean load of the new project data
    try {
      await loadProjectData(projectId);
      console.log(`✅ Successfully switched to project ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to switch to project ${projectId}:`, error);
      toast.error('Failed to switch project. Please try again.');
      setIsLoading(false);
    }
  };

  /**
   * Get critical path stages
   */
  const getCriticalPath = () => {
    return dependencyEngine.criticalPath.map(id => 
      stages.find(s => s.id === id)
    ).filter(Boolean);
  };

  /**
   * Get stage dependencies
   */
  const getStageDependencies = (stageId) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return [];
    
    return (stage.dependencies || []).map(depId => 
      stages.find(s => s.id === depId)
    ).filter(Boolean);
  };

  /**
   * Get stage dependents
   */
  const getStageDependents = (stageId) => {
    return stages.filter(s => 
      s.dependencies && s.dependencies.includes(stageId)
    );
  };

  /**
   * Get project progress
   */
  const getProjectProgress = () => {
    if (stages.length === 0) return 0;
    
    const completed = stages.filter(s => s.status === 'completed').length;
    return Math.round((completed / stages.length) * 100);
  };

  /**
   * Get upcoming milestones
   */
  const getUpcomingMilestones = (days = 30) => {
    const now = new Date();
    const future = addDays(now, days);
    
    return stages.filter(stage => {
      if (!stage.is_deliverable) return false;
      
      const endDate = parseISO(stage.end_date || stage.endDate);
      return endDate >= now && endDate <= future;
    }).sort((a, b) => {
      const aDate = parseISO(a.end_date || a.endDate);
      const bDate = parseISO(b.end_date || b.endDate);
      return aDate - bDate;
    });
  };

  /**
   * Get resource availability
   */
  const getResourceAvailability = (startDate, endDate) => {
    const availability = new Map();
    
    teamMembers.forEach(member => {
      const memberStages = stages.filter(s => s.assigned_to === member.email);
      const busyPeriods = memberStages.map(s => ({
        start: parseISO(s.start_date || s.startDate),
        end: parseISO(s.end_date || s.endDate)
      }));
      
      availability.set(member.email, {
        member,
        busyPeriods,
        utilization: calculateUtilization(busyPeriods, startDate, endDate)
      });
    });
    
    return availability;
  };

  /**
   * Calculate resource utilization percentage
   */
  const calculateUtilization = (busyPeriods, startDate, endDate) => {
    // Implementation would calculate actual utilization
    // For now, return mock value
    return Math.random() * 100;
  };

  const value = useMemo(() => ({
    // Core data
    currentProjectId,
    project,
    stages,
    deliverables,
    teamMembers,
    isLoading,
    
    // Selected/UI state
    selectedStage,
    setSelectedStage,
    pendingChanges,
    isValidating,
    
    // Update functions
    updateStage,
    updateStageOptimistic,
    updateDeliverable,
    batchUpdateStages,
    applyPendingChanges,
    cancelPendingChanges,
    
    // History
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    
    // Dependency functions
    getStageDependencies,
    getStageDependents,
    getCriticalPath,
    
    // Analytics functions
    getProjectProgress,
    getUpcomingMilestones,
    getResourceAvailability,
    
    // Subscription
    subscribe,
    
    // Project management
    switchProject,
    
    // Reload data
    reloadData: () => loadProjectData(currentProjectId)
  }), [
    currentProjectId,
    project,
    stages,
    deliverables,
    teamMembers,
    isLoading,
    selectedStage,
    pendingChanges,
    isValidating,
    updateStage,
    updateStageOptimistic,
    updateDeliverable,
    batchUpdateStages,
    applyPendingChanges,
    cancelPendingChanges,
    undo,
    redo,
    historyIndex,
    history.length,
    switchProject,
    getStageDependencies,
    getStageDependents,
    getCriticalPath,
    getProjectProgress,
    getUpcomingMilestones,
    getResourceAvailability,
    subscribe,
    loadProjectData
  ]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}