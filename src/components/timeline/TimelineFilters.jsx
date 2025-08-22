import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, X, CheckCircle, Clock, AlertTriangle, Star, Users } from "lucide-react";

export default function TimelineFilters({
  statusFilter,
  setStatusFilter,
  teamMemberFilter,
  setTeamMemberFilter,
  stageTypeFilter,
  setStageTypeFilter,
  teamMembers,
  filteredCount,
  totalCount
}) {
  const statusOptions = [
    { value: 'all', label: 'All Statuses', icon: null },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-500' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
    { value: 'blocked', label: 'Blocked', icon: AlertTriangle, color: 'text-red-500' },
    { value: 'ready', label: 'Ready', icon: Clock, color: 'text-green-500' },
    { value: 'not_ready', label: 'Not Ready', icon: Clock, color: 'text-slate-400' }
  ];

  const stageTypeOptions = [
    { value: 'all', label: 'All Types', icon: null },
    { value: 'deliverables', label: 'Deliverables Only', icon: Star, color: 'text-amber-500' },
    { value: 'tasks', label: 'Tasks Only', icon: Clock, color: 'text-slate-500' }
  ];

  const hasActiveFilters = statusFilter !== 'all' || teamMemberFilter !== 'all' || stageTypeFilter !== 'all';

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTeamMemberFilter('all');
    setStageTypeFilter('all');
  };

  const getSelectedStatusLabel = () => {
    const selected = statusOptions.find(opt => opt.value === statusFilter);
    return selected?.label || 'All Statuses';
  };

  const getSelectedTeamMemberLabel = () => {
    if (teamMemberFilter === 'all') return 'All Team Members';
    const member = teamMembers.find(m => m.email === teamMemberFilter);
    return member?.name || 'Unknown Member';
  };

  const getSelectedStageTypeLabel = () => {
    const selected = stageTypeOptions.find(opt => opt.value === stageTypeFilter);
    return selected?.label || 'All Types';
  };

  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Filter className="w-4 h-4" />
        Filters:
      </div>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={statusFilter !== 'all' ? 'default' : 'outline'} 
            size="sm" 
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {getSelectedStatusLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className="flex items-center gap-2"
            >
              {option.icon && (
                <option.icon className={`w-4 h-4 ${option.color}`} />
              )}
              <span>{option.label}</span>
              {statusFilter === option.value && (
                <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Team Member Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={teamMemberFilter !== 'all' ? 'default' : 'outline'} 
            size="sm" 
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            {getSelectedTeamMemberLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Filter by Team Member</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setTeamMemberFilter('all')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>All Team Members</span>
            {teamMemberFilter === 'all' && (
              <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {teamMembers.map((member) => (
            <DropdownMenuItem
              key={member.email}
              onClick={() => setTeamMemberFilter(member.email)}
              className="flex items-center gap-2"
            >
              <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium">
                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <span>{member.name}</span>
              {teamMemberFilter === member.email && (
                <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Stage Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={stageTypeFilter !== 'all' ? 'default' : 'outline'} 
            size="sm" 
            className="gap-2"
          >
            <Star className="w-4 h-4" />
            {getSelectedStageTypeLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {stageTypeOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setStageTypeFilter(option.value)}
              className="flex items-center gap-2"
            >
              {option.icon && (
                <option.icon className={`w-4 h-4 ${option.color}`} />
              )}
              <span>{option.label}</span>
              {stageTypeFilter === option.value && (
                <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="gap-2 text-slate-600"
        >
          <X className="w-4 h-4" />
          Clear All
        </Button>
      )}

      {/* Results Count */}
      <div className="flex items-center gap-2 ml-auto text-sm text-slate-600">
        <Badge variant="outline" className="bg-slate-50">
          {filteredCount} of {totalCount} stages
        </Badge>
      </div>
    </div>
  );
}