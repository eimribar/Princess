/**
 * Project Context
 * Global state management for project data with real-time synchronization
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Deliverable, TeamMember, Project } from '@/api/entities';
import dependencyEngine from '@/services/dependencyEngine';
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

  // Initialize data on mount
  useEffect(() => {
    loadProjectData();
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
      
      console.log('Initializing dependency engine with', processedStages.length, 'stages');
      console.log('Sample stage with dependencies:', processedStages.find(s => s.dependencies && s.dependencies.length > 0));
      dependencyEngine.initialize(processedStages);
    }
  }, [stages]);

  /**
   * Load all project data
   */
  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      
      const [projectsData, stagesData, deliverablesData, teamData] = await Promise.all([
        Project.list(),
        Stage.list(),
        Deliverable.list(),
        TeamMember.list()
      ]);

      if (projectsData && projectsData.length > 0) {
        setProject(projectsData[0]);
      }
      
      setStages(stagesData || []);
      setDeliverables(deliverablesData || []);
      setTeamMembers(teamData || []);
      
    } catch (error) {
      console.error('Failed to load project data:', error);
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
      await Stage.update(stageId, updates);
      
      // Broadcast to other tabs
      broadcastChange('stage_update', { id: stageId, updates });
      
      // Notify subscribers
      notifySubscribers('stage_updated', { id: stageId, updates });
      
      toast.success('Stage updated successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to update stage:', error);
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
      await Stage.update(stageId, updates);
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
        
        await Stage.update(affected.stageId, cascadeUpdates);
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
      console.error('Failed to apply pending changes:', error);
      console.error('Pending changes data:', pendingChanges);
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
      await Deliverable.update(deliverableId, updates);
      
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
      console.error('Failed to update deliverable:', error);
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
        await Stage.update(id, updates);
        setStages(prev => prev.map(s => 
          s.id === id ? { ...s, ...updates } : s
        ));
        
        broadcastChange('stage_update', { id, updates });
      }
      
      toast.success(`Updated ${stageUpdates.length} stages`);
      return true;
      
    } catch (error) {
      console.error('Failed to batch update stages:', error);
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

  const value = {
    // Core data
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
    
    // Reload data
    reloadData: loadProjectData
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}