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
  
  /**
   * Auto-discover project from current route
   * This ensures the correct project is loaded even when accessing entities directly
   */
  const discoverProjectFromRoute = async () => {
    const path = window.location.pathname;
    
    // Check if we're on a deliverable page
    if (path.includes('/deliverables/')) {
      const deliverableId = path.split('/deliverables/')[1]?.split('/')[0];
      if (deliverableId && deliverableId !== 'undefined') {
        try {
          const deliverable = await SupabaseDeliverable.get(deliverableId);
          if (deliverable?.project_id) {
            console.log(`Discovered project ${deliverable.project_id} from deliverable ${deliverableId}`);
            return deliverable.project_id;
          }
        } catch (error) {
          console.error('Error loading deliverable for project discovery:', error);
        }
      }
    }
    
    // Check if we're on a stage-specific page
    if (path.includes('/stage/')) {
      const stageId = path.split('/stage/')[1]?.split('/')[0];
      if (stageId && stageId !== 'undefined') {
        try {
          const stage = await SupabaseStage.get(stageId);
          if (stage?.project_id) {
            console.log(`Discovered project ${stage.project_id} from stage ${stageId}`);
            return stage.project_id;
          }
        } catch (error) {
          console.error('Error loading stage for project discovery:', error);
        }
      }
    }
    
    // Check localStorage for last used project
    const lastProjectId = localStorage.getItem('princess_last_project_id');
    if (lastProjectId) {
      console.log(`Using last project from localStorage: ${lastProjectId}`);
      return lastProjectId;
    }
    
    // Return null to trigger default project loading
    return null;
  };
  
  // Initialize data on mount
  useEffect(() => {
    const initializeProject = async () => {
      // First try to get project ID from URL
      const urlPath = window.location.pathname;
      const dashboardMatch = urlPath.match(/\/dashboard\/([^\/]+)/);
      
      let projectIdToLoad = null;
      
      if (dashboardMatch) {
        projectIdToLoad = dashboardMatch[1];
        console.log(`Loading project from dashboard URL: ${projectIdToLoad}`);
      } else {
        // Auto-discover project from current route
        projectIdToLoad = await discoverProjectFromRoute();
      }
      
      if (projectIdToLoad) {
        setCurrentProjectId(projectIdToLoad);
        localStorage.setItem('princess_last_project_id', projectIdToLoad);
        await loadProjectData(projectIdToLoad);
      } else {
        console.log('No project ID found, loading first available project');
        await loadProjectData();
      }
      
      initializeSync();
    };
    
    initializeProject();
    
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
      
      // Also listen to deliverable-updates channel for status changes from DeliverableDetail page
      const deliverableChannel = new BroadcastChannel('deliverable-updates');
      deliverableChannel.onmessage = (event) => {
        const { type, deliverableId, newStatus, projectId } = event.data;
        if (type === 'status_updated' && projectId === currentProjectId) {
          // Update the deliverable in our state
          setDeliverables(prev => prev.map(d => 
            d.id === deliverableId ? { ...d, status: newStatus } : d
          ));
          
          console.log('[ProjectContext] Received deliverable status update via broadcast:', deliverableId, newStatus);
        }
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
      // Capture the current stage BEFORE updating
      const currentStage = stages.find(s => s.id === stageId);
      if (!currentStage) {
        console.error('Stage not found:', stageId);
        return false;
      }
      
      // Update local state IMMEDIATELY for instant UI response
      setStages(prev => {
        const newStages = prev.map(s => 
          s.id === stageId ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
        );
        return [...newStages];
      });
      
      // If a deliverable stage's status changed, update the associated deliverable IMMEDIATELY
      if (currentStage.is_deliverable && currentStage.deliverable_id && updates.status) {
        // Map stage status to deliverable status
        const deliverableStatus = updates.status === 'completed' ? 'approved' :
                                 updates.status === 'blocked' ? 'declined' :
                                 updates.status === 'in_progress' ? 'in_progress' :
                                 'not_started';
        
        setDeliverables(prev => {
          const newDeliverables = prev.map(d =>
            d.id === currentStage.deliverable_id 
              ? { ...d, status: deliverableStatus, updated_at: new Date().toISOString() }
              : d
          );
          return [...newDeliverables];
        });
      }
      
      // Persist to backend in background WITHOUT blocking the UI update
      // Using Promise to ensure proper async handling
      (async () => {
        try {
          // Add small delay to ensure UI updates first
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // Persist the update with proper status mapping
          const result = await SupabaseStage.update(stageId, updates);
          
          if (!result) {
            throw new Error('Update returned no result');
          }
          
          console.log('Stage update persisted:', {
            stageId,
            updates,
            result: result.status
          });
          
          // Broadcast to other tabs after successful save
          broadcastChange('stage_update', { id: stageId, updates });
          
          // If status changed and it's a deliverable stage, sync the deliverable
          if (updates.status && currentStage.is_deliverable && currentStage.deliverable_id) {
            const deliverableStatus = updates.status === 'completed' ? 'approved' :
                                     updates.status === 'blocked' ? 'declined' :
                                     updates.status === 'in_progress' ? 'in_progress' :
                                     'not_started';
            
            try {
              await SupabaseDeliverable.update(currentStage.deliverable_id, {
                status: deliverableStatus,
                _skipStageSync: true
              });
            } catch (deliverableError) {
              console.error('Failed to sync deliverable status:', deliverableError);
              // Don't fail the whole operation
            }
          }
        } catch (error) {
          console.error('Failed to persist stage update:', error);
          // Revert on error
          try {
            const originalStage = await SupabaseStage.get(stageId);
            if (originalStage) {
              setStages(prev => prev.map(s => 
                s.id === stageId ? originalStage : s
              ));
              
              // Also revert deliverable if needed
              if (currentStage.is_deliverable && currentStage.deliverable_id) {
                const originalDeliverable = await SupabaseDeliverable.get(currentStage.deliverable_id);
                if (originalDeliverable) {
                  setDeliverables(prev => prev.map(d =>
                    d.id === currentStage.deliverable_id ? originalDeliverable : d
                  ));
                }
              }
            }
          } catch (revertError) {
            console.error('Failed to revert after error:', revertError);
          }
          
          toast.error('Failed to save stage update. Please refresh the page.');
        }
      })();
      
      return true;
    } catch (error) {
      console.error('Failed to update stage optimistically:', error);
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
   * Update deliverable - Enterprise-grade with retry logic and auto-recovery
   */
  const updateDeliverable = async (deliverableId, updates, options = {}) => {
    const maxRetries = options.maxRetries || 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Save to history for undo capability
        saveToHistory();
        
        // First, ensure we have the deliverable's project loaded
        let deliverableToUpdate = deliverables.find(d => d.id === deliverableId);
        
        // If deliverable not in context, fetch it and ensure correct project is loaded
        if (!deliverableToUpdate) {
          console.log(`Deliverable ${deliverableId} not in context, fetching...`);
          deliverableToUpdate = await SupabaseDeliverable.get(deliverableId);
          
          if (!deliverableToUpdate) {
            throw new Error(`Deliverable ${deliverableId} not found`);
          }
          
          // If the deliverable belongs to a different project, load that project
          if (deliverableToUpdate.project_id && deliverableToUpdate.project_id !== currentProjectId) {
            console.log(`Switching to project ${deliverableToUpdate.project_id} for deliverable update`);
            setCurrentProjectId(deliverableToUpdate.project_id);
            localStorage.setItem('princess_last_project_id', deliverableToUpdate.project_id);
            
            // Load the correct project data
            await loadProjectData(deliverableToUpdate.project_id);
            
            // After loading correct project, try to find deliverable again
            deliverableToUpdate = deliverables.find(d => d.id === deliverableId) || deliverableToUpdate;
          }
        }
        
        // Update local state optimistically
        setDeliverables(prev => {
          const exists = prev.some(d => d.id === deliverableId);
          if (exists) {
            return prev.map(d => d.id === deliverableId ? { ...d, ...updates } : d);
          } else {
            // Add the deliverable to the array if it's not there
            console.log(`Adding deliverable ${deliverableId} to context array`);
            return [...prev, { ...deliverableToUpdate, ...updates }];
          }
        });
        
        // Persist to backend with validation
        const result = await SupabaseDeliverable.update(deliverableId, updates);
        
        if (!result) {
          throw new Error('Update returned no result');
        }
        
        // Handle linked stage updates
        if (deliverableToUpdate?.stage_id) {
          // Handle status sync
          if (updates.status !== undefined) {
            const stageStatusMap = {
              'not_started': 'not_started',
              'in_progress': 'in_progress',
              'submitted': 'in_progress',
              'declined': 'in_progress',
              'approved': 'completed'
            };
            
            const newStageStatus = stageStatusMap[updates.status];
            if (newStageStatus) {
              try {
                await SupabaseStage.update(deliverableToUpdate.stage_id, { 
                  status: newStageStatus 
                });
                
                // Update local stage state
                setStages(prev => prev.map(s => 
                  s.id === deliverableToUpdate.stage_id 
                    ? { ...s, status: newStageStatus }
                    : s
                ));
              } catch (stageError) {
                console.error('Failed to sync stage status:', stageError);
                // Don't fail the whole operation if stage sync fails
              }
            }
          }
          
          // Handle assignment sync
          if (updates.assigned_to !== undefined) {
            try {
              await SupabaseStage.update(deliverableToUpdate.stage_id, { 
                assigned_to: updates.assigned_to 
              });
              
              // Update local stage state
              setStages(prev => prev.map(s => 
                s.id === deliverableToUpdate.stage_id 
                  ? { ...s, assigned_to: updates.assigned_to }
                  : s
              ));
            } catch (stageError) {
              console.error('Failed to sync stage assignment:', stageError);
              // Don't fail the whole operation if stage sync fails
            }
          }
          
          // Handle deadline sync
          if (updates.deadline) {
            const stage = stages.find(s => s.id === deliverableToUpdate.stage_id);
            if (stage) {
              try {
                await updateStage(stage.id, { 
                  end_date: updates.deadline 
                });
              } catch (stageError) {
                console.error('Failed to sync stage deadline:', stageError);
                // Don't fail the whole operation if stage sync fails
              }
            }
          }
        }
        
        // Broadcast change for real-time sync
        broadcastChange('deliverable_update', { id: deliverableId, updates });
        
        // Notify subscribers
        notifySubscribers('deliverable_updated', { id: deliverableId, updates });
        
        // Success!
        if (!options.silent) {
          toast.success('Deliverable updated successfully');
        }
        
        console.log(`Successfully updated deliverable ${deliverableId} on attempt ${attempt}`);
        return true;
        
      } catch (error) {
        lastError = error;
        console.error(`Update attempt ${attempt} failed for deliverable ${deliverableId}:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    console.error(`Failed to update deliverable ${deliverableId} after ${maxRetries} attempts:`, lastError);
    
    if (!options.silent) {
      toast.error(`Failed to update deliverable: ${lastError?.message || 'Unknown error'}`);
    }
    
    // Try to revert optimistic update by reloading data
    try {
      console.log('Reverting optimistic update by reloading data...');
      await loadProjectData(currentProjectId);
    } catch (reloadError) {
      console.error('Failed to reload data after update failure:', reloadError);
    }
    
    return false;
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