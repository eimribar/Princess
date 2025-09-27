import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Briefcase, Star, Crown } from 'lucide-react';
import { useUser } from '@/contexts/ClerkUserContext';
import { useProject } from '@/contexts/ProjectContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function RoleIndicator({ compact = false, showDecisionMaker = true }) {
  const { user } = useUser();
  const { currentProject, teamMembers } = useProject();

  if (!user) return null;

  // Get the user's team member info for the current project
  const teamMember = teamMembers?.find(m => 
    m.email === user.email || m.user_id === user.id
  );

  const isDecisionMaker = teamMember?.is_decision_maker === true;

  const getRoleInfo = () => {
    switch (user.role) {
      case 'admin':
        return {
          label: 'Administrator',
          icon: Shield,
          color: 'bg-red-100 text-red-800 border-red-300',
          description: 'Full system access and control'
        };
      case 'agency':
        return {
          label: 'Agency Team',
          icon: Briefcase,
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          description: 'Manages projects and deliverables'
        };
      case 'client':
        return {
          label: 'Client Team',
          icon: Users,
          color: 'bg-green-100 text-green-800 border-green-300',
          description: isDecisionMaker 
            ? 'Can approve deliverables and make decisions'
            : 'Can view and comment on deliverables'
        };
      default:
        return {
          label: 'User',
          icon: Users,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          description: 'Standard access'
        };
    }
  };

  const roleInfo = getRoleInfo();
  const Icon = roleInfo.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`${roleInfo.color} text-xs px-2 py-0.5 flex items-center gap-1`}
              >
                <Icon className="h-3 w-3" />
                <span className="font-medium">{roleInfo.label}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{roleInfo.description}</p>
            </TooltipContent>
          </Tooltip>

          {showDecisionMaker && isDecisionMaker && user.role === 'client' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="bg-amber-100 text-amber-800 border-amber-300 text-xs px-2 py-0.5 flex items-center gap-1"
                >
                  <Star className="h-3 w-3 fill-amber-600" />
                  <span className="font-medium">Decision Maker</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Can approve or decline deliverables</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={`${roleInfo.color} px-3 py-1 flex items-center gap-2`}
        >
          <Icon className="h-4 w-4" />
          <span className="font-semibold">{roleInfo.label}</span>
        </Badge>

        {showDecisionMaker && isDecisionMaker && user.role === 'client' && (
          <Badge 
            variant="outline" 
            className="bg-amber-100 text-amber-800 border-amber-300 px-3 py-1 flex items-center gap-2"
          >
            <Crown className="h-4 w-4 fill-amber-600" />
            <span className="font-semibold">Decision Maker</span>
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-gray-600">{roleInfo.description}</p>

      {currentProject && (
        <p className="text-xs text-gray-500">
          Project: <span className="font-medium">{currentProject.name}</span>
        </p>
      )}
    </div>
  );
}

export function RoleBadge({ role, isDecisionMaker = false, size = 'default' }) {
  const getRoleStyle = () => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'agency':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'client':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'agency': return 'Agency';
      case 'client': return 'Client';
      default: return role;
    }
  };

  const sizeClasses = size === 'small' 
    ? 'text-xs px-1.5 py-0.5' 
    : 'text-sm px-2 py-0.5';

  return (
    <div className="inline-flex items-center gap-1">
      <Badge 
        variant="outline" 
        className={`${getRoleStyle()} ${sizeClasses}`}
      >
        {getRoleLabel()}
      </Badge>
      {isDecisionMaker && role === 'client' && (
        <Badge 
          variant="outline" 
          className={`bg-amber-100 text-amber-800 border-amber-300 ${sizeClasses}`}
        >
          <Star className={`${size === 'small' ? 'h-3 w-3' : 'h-3.5 w-3.5'} fill-amber-600`} />
        </Badge>
      )}
    </div>
  );
}