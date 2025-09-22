import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Star,
  Circle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  Filter,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  parseISO,
  isWithinInterval,
  differenceInDays,
  getDay,
  addDays,
  subDays
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/SupabaseUserContext';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CalendarView({ 
  stages, 
  teamMembers = [], 
  onStageUpdate,
  onStageClick,
  currentView = 'month' // 'month', 'week', 'day'
}) {
  const { user } = useUser();
  const isClient = user?.role === 'client';
  const canDrag = !isClient;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(currentView);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showOnlyDeliverables, setShowOnlyDeliverables] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [draggedStage, setDraggedStage] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  // Generate calendar days based on view mode
  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(selectedDate));
      const end = endOfWeek(endOfMonth(selectedDate));
      return eachDayOfInterval({ start, end });
    } else if (viewMode === 'week') {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      return eachDayOfInterval({ start, end });
    } else {
      // Day view
      return [selectedDate];
    }
  }, [selectedDate, viewMode]);

  // Filter stages based on settings
  const filteredStages = useMemo(() => {
    let filtered = stages;
    
    if (showOnlyDeliverables) {
      filtered = filtered.filter(s => s.is_deliverable);
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(s => s.category === filterCategory);
    }
    
    return filtered;
  }, [stages, showOnlyDeliverables, filterCategory]);

  // Group stages by date
  const stagesByDate = useMemo(() => {
    const grouped = {};
    
    calendarDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      grouped[dateKey] = [];
    });
    
    filteredStages.forEach(stage => {
      if (!stage.start_date) return;
      
      const startDate = parseISO(stage.start_date);
      const endDate = stage.end_date ? parseISO(stage.end_date) : startDate;
      
      // For multi-day stages, show on each day
      calendarDays.forEach(day => {
        if (isWithinInterval(day, { start: startDate, end: endDate })) {
          const dateKey = format(day, 'yyyy-MM-dd');
          if (grouped[dateKey]) {
            grouped[dateKey].push({
              ...stage,
              isStart: isSameDay(day, startDate),
              isEnd: isSameDay(day, endDate),
              dayIndex: differenceInDays(day, startDate)
            });
          }
        }
      });
    });
    
    return grouped;
  }, [calendarDays, filteredStages]);

  // Get stage color based on status
  const getStageColor = (stage) => {
    switch (stage.status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'blocked':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Handle drag and drop
  const handleDragStart = (e, stage) => {
    if (!canDrag) return;
    setDraggedStage(stage);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, date) => {
    e.preventDefault();
    if (!canDrag) return;
    setDragOverDate(date);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e, date) => {
    e.preventDefault();
    if (!canDrag || !draggedStage) return;
    
    const newStartDate = new Date(date);
    const duration = draggedStage.estimated_duration || 1;
    const newEndDate = addDays(newStartDate, duration - 1);
    
    onStageUpdate(draggedStage.id, {
      start_date: newStartDate.toISOString(),
      end_date: newEndDate.toISOString()
    });
    
    setDraggedStage(null);
    setDragOverDate(null);
  };

  // Navigation
  const navigateCalendar = (direction) => {
    if (viewMode === 'month') {
      setSelectedDate(prev => addMonths(prev, direction));
    } else if (viewMode === 'week') {
      setSelectedDate(prev => addDays(prev, direction * 7));
    } else {
      setSelectedDate(prev => addDays(prev, direction));
    }
  };

  // Get week day names
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render a single stage item
  const renderStageItem = (stage) => {
    if (isCompactMode) {
      return (
        <div
          key={stage.id}
          className={cn(
            "px-1 py-0.5 text-xs rounded cursor-pointer truncate",
            getStageColor(stage),
            "hover:opacity-80 transition-opacity"
          )}
          onClick={() => onStageClick(stage.id)}
          draggable={canDrag}
          onDragStart={(e) => handleDragStart(e, stage)}
        >
          {stage.is_deliverable ? '⭐' : '●'} {stage.number_index}
        </div>
      );
    }

    return (
      <motion.div
        key={stage.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "p-1.5 rounded border cursor-pointer group",
          getStageColor(stage),
          "hover:shadow-md transition-shadow"
        )}
        draggable={canDrag}
        onDragStart={(e) => handleDragStart(e, stage)}
        onClick={() => onStageClick(stage.id)}
      >
        <div className="flex items-center gap-1">
          {stage.is_deliverable ? (
            <Star className="w-3 h-3 flex-shrink-0" />
          ) : (
            <Circle className="w-3 h-3 flex-shrink-0" />
          )}
          <span className="text-xs font-medium truncate">
            {stage.number_index}. {stage.name}
          </span>
        </div>
        {stage.assigned_to && !isCompactMode && (
          <div className="mt-1 flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-[8px] font-medium">
                {teamMembers.find(m => m.email === stage.assigned_to)?.name?.[0] || '?'}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Render day cell
  const renderDayCell = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayStages = stagesByDate[dateKey] || [];
    const isCurrentMonth = isSameMonth(day, selectedDate);
    const isDragOver = dragOverDate === dateKey;
    
    return (
      <div
        key={dateKey}
        className={cn(
          "min-h-[100px] border-r border-b p-2",
          !isCurrentMonth && "bg-gray-50",
          isToday(day) && "bg-blue-50",
          isDragOver && "bg-blue-100",
          viewMode === 'day' && "min-h-[400px]"
        )}
        onDragOver={(e) => handleDragOver(e, dateKey)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, dateKey)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-sm font-medium",
            !isCurrentMonth && "text-gray-400",
            isToday(day) && "text-blue-600"
          )}>
            {format(day, 'd')}
          </span>
          {dayStages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {dayStages.length}
            </Badge>
          )}
        </div>
        
        <div className="space-y-1 overflow-y-auto max-h-[150px]">
          <AnimatePresence>
            {dayStages.slice(0, isCompactMode ? 3 : 5).map(stage => renderStageItem(stage))}
          </AnimatePresence>
          
          {dayStages.length > (isCompactMode ? 3 : 5) && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-6 text-xs"
                >
                  +{dayStages.length - (isCompactMode ? 3 : 5)} more
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">
                    All items for {format(day, 'MMM d, yyyy')}
                  </h4>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {dayStages.map(stage => renderStageItem(stage))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    );
  };

  // Get categories for filter
  const categories = useMemo(() => {
    const cats = new Set(stages.map(s => s.category));
    return Array.from(cats);
  }, [stages]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Calendar View</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filters */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant={showOnlyDeliverables ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOnlyDeliverables(!showOnlyDeliverables)}
            >
              <Star className="w-4 h-4 mr-1" />
              Deliverables
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsCompactMode(!isCompactMode)}
            >
              {isCompactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateCalendar(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h3 className="text-lg font-medium px-4">
              {viewMode === 'month' && format(selectedDate, 'MMMM yyyy')}
              {viewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM d, yyyy')}`}
              {viewMode === 'day' && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateCalendar(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className="ml-4"
            >
              Today
            </Button>
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">
                {filteredStages.filter(s => s.status === 'completed').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">
                {filteredStages.filter(s => s.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-600">
                {filteredStages.filter(s => s.status === 'blocked').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'month' && (
          <div className="h-full">
            {/* Week day headers */}
            <div className="grid grid-cols-7 border-b">
              {weekDayNames.map(day => (
                <div
                  key={day}
                  className="px-2 py-3 text-sm font-medium text-gray-700 text-center border-r"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 h-[calc(100%-48px)]">
              {calendarDays.map(day => renderDayCell(day))}
            </div>
          </div>
        )}
        
        {viewMode === 'week' && (
          <div className="h-full">
            {/* Week day headers with dates */}
            <div className="grid grid-cols-7 border-b">
              {calendarDays.map(day => (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  className="px-2 py-3 text-center border-r"
                >
                  <div className="text-sm font-medium text-gray-700">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isToday(day) && "text-blue-600"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Week days content */}
            <div className="grid grid-cols-7 h-[calc(100%-72px)]">
              {calendarDays.map(day => renderDayCell(day))}
            </div>
          </div>
        )}
        
        {viewMode === 'day' && (
          <div className="h-full p-6">
            {renderDayCell(selectedDate)}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-gray-600">Deliverable</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Stage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
              <span className="text-gray-600">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span className="text-gray-600">Blocked</span>
            </div>
          </div>
          
          {isClient && (
            <span className="text-sm text-gray-500">
              View Only Mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
}