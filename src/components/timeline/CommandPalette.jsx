import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { 
  Search,
  Calendar,
  Users,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Settings,
  FileText,
  Filter,
  Zap,
  Target,
  TrendingUp,
  Edit3,
  Copy,
  Trash2,
  Plus,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/ClerkUserContext';
import scheduleRuleEngine from '@/services/scheduleRuleEngine';

export default function CommandPalette({ 
  isOpen, 
  onOpenChange,
  stages,
  onStageUpdate,
  onStageClick,
  onBulkUpdate,
  onExport,
  onImport,
  currentView,
  onViewChange,
  onFilterChange,
  filters = {},
  recentActions = [],
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) {
  const { user } = useUser();
  const isClient = user?.role === 'client';
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [selectedStages, setSelectedStages] = useState(new Set());
  const [lastAction, setLastAction] = useState(null);

  // Quick actions based on user role
  const quickActions = useMemo(() => {
    const actions = [
      {
        group: 'Navigation',
        items: [
          {
            id: 'search-stages',
            label: 'Search stages...',
            icon: Search,
            shortcut: '⌘K',
            action: () => {
              // Focus on search
              setTimeout(() => {
                document.querySelector('[cmdk-input]')?.focus();
              }, 100);
            }
          },
          {
            id: 'view-calendar',
            label: 'Calendar view',
            icon: Calendar,
            shortcut: '⌘1',
            action: () => onViewChange('calendar')
          },
          {
            id: 'view-list',
            label: 'List view',
            icon: FileText,
            shortcut: '⌘2',
            action: () => onViewChange('list')
          },
          {
            id: 'view-milestones',
            label: 'Milestones view',
            icon: Target,
            shortcut: '⌘3',
            action: () => onViewChange('milestones')
          }
        ]
      },
      {
        group: 'Filters',
        items: [
          {
            id: 'filter-deliverables',
            label: 'Show only deliverables',
            icon: Star,
            shortcut: '⌘D',
            action: () => onFilterChange({ ...filters, deliverables: !filters.deliverables })
          },
          {
            id: 'filter-in-progress',
            label: 'Show in progress',
            icon: Clock,
            action: () => onFilterChange({ ...filters, status: 'in_progress' })
          },
          {
            id: 'filter-blocked',
            label: 'Show blocked',
            icon: AlertCircle,
            action: () => onFilterChange({ ...filters, status: 'blocked' })
          },
          {
            id: 'filter-completed',
            label: 'Show completed',
            icon: CheckCircle2,
            action: () => onFilterChange({ ...filters, status: 'completed' })
          },
          {
            id: 'clear-filters',
            label: 'Clear all filters',
            icon: RefreshCw,
            shortcut: '⌘⇧F',
            action: () => onFilterChange({})
          }
        ]
      }
    ];

    // Add edit actions for non-clients
    if (!isClient) {
      actions.push({
        group: 'Edit',
        items: [
          {
            id: 'bulk-select',
            label: 'Select multiple stages',
            icon: Copy,
            shortcut: '⌘A',
            action: () => {
              const allIds = new Set(stages.map(s => s.id));
              setSelectedStages(allIds);
              toast({
                title: `Selected ${allIds.size} stages`,
                description: 'Use bulk actions to update them'
              });
            }
          },
          {
            id: 'bulk-status',
            label: 'Update status for selected',
            icon: Edit3,
            disabled: selectedStages.size === 0,
            action: () => {
              if (selectedStages.size > 0) {
                // Open bulk status update dialog
                onBulkUpdate(Array.from(selectedStages), 'status');
              }
            }
          },
          {
            id: 'bulk-assign',
            label: 'Assign team member to selected',
            icon: Users,
            disabled: selectedStages.size === 0,
            action: () => {
              if (selectedStages.size > 0) {
                onBulkUpdate(Array.from(selectedStages), 'assign');
              }
            }
          },
          {
            id: 'bulk-dates',
            label: 'Update dates for selected',
            icon: Calendar,
            disabled: selectedStages.size === 0,
            action: () => {
              if (selectedStages.size > 0) {
                onBulkUpdate(Array.from(selectedStages), 'dates');
              }
            }
          },
          {
            id: 'clear-selection',
            label: 'Clear selection',
            icon: RefreshCw,
            shortcut: 'Esc',
            disabled: selectedStages.size === 0,
            action: () => {
              setSelectedStages(new Set());
              toast({ title: 'Selection cleared' });
            }
          }
        ]
      });

      actions.push({
        group: 'Actions',
        items: [
          {
            id: 'start-next',
            label: 'Start next available stage',
            icon: PlayCircle,
            shortcut: '⌘⏎',
            action: () => {
              const nextStage = stages.find(s => 
                s.status === 'not_started' && 
                scheduleRuleEngine.canStartStage(s.id)
              );
              if (nextStage) {
                onStageUpdate(nextStage.id, { status: 'in_progress' });
                toast({
                  title: 'Stage started',
                  description: `Started "${nextStage.name}"`
                });
              } else {
                toast({
                  title: 'No available stages',
                  description: 'All ready stages are already in progress',
                  variant: 'destructive'
                });
              }
            }
          },
          {
            id: 'complete-current',
            label: 'Complete current stage',
            icon: CheckCircle2,
            action: () => {
              const currentStage = stages.find(s => s.status === 'in_progress');
              if (currentStage) {
                onStageUpdate(currentStage.id, { status: 'completed' });
                toast({
                  title: 'Stage completed',
                  description: `Completed "${currentStage.name}"`
                });
              }
            }
          },
          {
            id: 'recalculate-dates',
            label: 'Recalculate all dates',
            icon: Zap,
            action: () => {
              scheduleRuleEngine.recalculateSchedule();
              toast({
                title: 'Schedule recalculated',
                description: 'All dates have been updated based on rules'
              });
            }
          },
          {
            id: 'optimize-schedule',
            label: 'Optimize schedule',
            icon: TrendingUp,
            action: () => {
              scheduleRuleEngine.optimizeSchedule();
              toast({
                title: 'Schedule optimized',
                description: 'Timeline has been optimized for efficiency'
              });
            }
          }
        ]
      });

      // History actions
      actions.push({
        group: 'History',
        items: [
          {
            id: 'undo',
            label: 'Undo last action',
            icon: Undo,
            shortcut: '⌘Z',
            disabled: !canUndo,
            action: onUndo
          },
          {
            id: 'redo',
            label: 'Redo',
            icon: Redo,
            shortcut: '⌘⇧Z',
            disabled: !canRedo,
            action: onRedo
          }
        ]
      });
    }

    // Data actions
    actions.push({
      group: 'Data',
      items: [
        {
          id: 'export-timeline',
          label: 'Export timeline',
          icon: Download,
          shortcut: '⌘E',
          action: () => {
            onExport('timeline');
            toast({ title: 'Timeline exported' });
          }
        },
        {
          id: 'export-report',
          label: 'Generate report',
          icon: FileText,
          action: () => {
            onExport('report');
            toast({ title: 'Report generated' });
          }
        },
        ...(!isClient ? [
          {
            id: 'import-data',
            label: 'Import timeline',
            icon: Upload,
            shortcut: '⌘I',
            action: () => {
              onImport();
            }
          },
          {
            id: 'save-view',
            label: 'Save current view',
            icon: Save,
            shortcut: '⌘S',
            action: () => {
              // Save current filters and view settings
              const viewConfig = {
                view: currentView,
                filters,
                zoom: document.querySelector('[data-zoom]')?.dataset.zoom,
                date: new Date().toISOString()
              };
              localStorage.setItem('timeline_saved_view', JSON.stringify(viewConfig));
              toast({ title: 'View saved' });
            }
          }
        ] : [])
      ]
    });

    return actions;
  }, [stages, filters, selectedStages, isClient, canUndo, canRedo, currentView]);

  // Filter stages based on search
  const filteredStages = useMemo(() => {
    if (!search) return [];
    
    const searchLower = search.toLowerCase();
    return stages.filter(stage => 
      stage.name.toLowerCase().includes(searchLower) ||
      stage.number_index.toString().includes(searchLower) ||
      stage.category?.toLowerCase().includes(searchLower)
    ).slice(0, 10); // Limit to 10 results
  }, [stages, search]);

  // Recent actions for quick access
  const recentActionItems = useMemo(() => {
    return recentActions.slice(0, 5).map((action, index) => ({
      id: `recent-${index}`,
      label: action.label,
      icon: action.icon,
      timestamp: action.timestamp,
      action: action.repeat
    }));
  }, [recentActions]);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e) => {
      // Command palette toggle
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
      
      // Quick shortcuts when palette is closed
      if (!isOpen) {
        // View shortcuts
        if ((e.metaKey || e.ctrlKey) && e.key === '1') {
          e.preventDefault();
          onViewChange('calendar');
        }
        if ((e.metaKey || e.ctrlKey) && e.key === '2') {
          e.preventDefault();
          onViewChange('list');
        }
        if ((e.metaKey || e.ctrlKey) && e.key === '3') {
          e.preventDefault();
          onViewChange('milestones');
        }
        
        // Action shortcuts
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
          e.preventDefault();
          onFilterChange({ ...filters, deliverables: !filters.deliverables });
        }
        
        // Edit shortcuts (non-clients only)
        if (!isClient) {
          if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (canUndo) onUndo();
          }
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
            e.preventDefault();
            if (canRedo) onRedo();
          }
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onOpenChange, onViewChange, onFilterChange, filters, isClient, canUndo, canRedo, onUndo, onRedo]);

  const handleAction = (action) => {
    action();
    onOpenChange(false);
    
    // Track action for recent history
    if (lastAction !== action) {
      setLastAction(action);
    }
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Type a command or search..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {/* Stage search results */}
          {filteredStages.length > 0 && (
            <>
              <CommandGroup heading="Stages">
                {filteredStages.map(stage => (
                  <CommandItem
                    key={stage.id}
                    onSelect={() => {
                      onStageClick(stage.id);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {stage.is_deliverable ? (
                        <Star className="w-4 h-4 text-amber-500" />
                      ) : (
                        <div className={`w-4 h-4 rounded-full ${
                          stage.status === 'completed' ? 'bg-green-500' :
                          stage.status === 'in_progress' ? 'bg-blue-500' :
                          stage.status === 'blocked' ? 'bg-red-500' :
                          'bg-gray-300'
                        }`} />
                      )}
                      <span className="font-medium">{stage.number_index}.</span>
                      <span>{stage.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {stage.category?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          
          {/* Recent actions */}
          {recentActionItems.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentActionItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleAction(item.action)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {item.timestamp}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          
          {/* Quick actions */}
          {quickActions.map(group => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    disabled={item.disabled}
                    onSelect={() => !item.disabled && handleAction(item.action)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <CommandShortcut>{item.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}