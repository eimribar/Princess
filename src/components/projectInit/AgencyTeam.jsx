import React, { useState, useEffect } from 'react';
import { useProjectInit } from '@/pages/ProjectInitiation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Star,
  Users,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TeamMember } from '@/api/entities';

export default function AgencyTeam() {
  const { projectData, updateProjectData } = useProjectInit();
  const [availableTeamMembers, setAvailableTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const projectManager = projectData.projectManager;
  const teamMembers = projectData.teamMembers || [];
  
  // Load available team members
  useEffect(() => {
    loadTeamMembers();
  }, []);
  
  const loadTeamMembers = async () => {
    try {
      setIsLoading(true);
      const members = await TeamMember.list();
      // Filter for agency team members only
      const agencyMembers = members.filter(m => m.team_type === 'agency');
      setAvailableTeamMembers(agencyMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter team members based on search
  const filteredMembers = availableTeamMembers.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return member.name.toLowerCase().includes(searchLower) ||
           member.email.toLowerCase().includes(searchLower) ||
           member.role?.toLowerCase().includes(searchLower);
  });
  
  // Set project manager
  const setProjectManager = (member) => {
    updateProjectData({ 
      projectManager: member,
      // Also add to team members if not already there
      teamMembers: teamMembers.some(tm => tm.id === member.id) 
        ? teamMembers 
        : [...teamMembers, { ...member, visibleToClient: true }]
    });
  };
  
  // Toggle team member selection
  const toggleTeamMember = (member) => {
    const isSelected = teamMembers.some(tm => tm.id === member.id);
    
    if (isSelected) {
      // Remove from team
      updateProjectData({
        teamMembers: teamMembers.filter(tm => tm.id !== member.id),
        // If removing PM, clear PM selection too
        projectManager: projectManager?.id === member.id ? null : projectManager
      });
    } else {
      // Add to team
      updateProjectData({
        teamMembers: [...teamMembers, { ...member, visibleToClient: true }]
      });
    }
  };
  
  // Toggle visibility to client
  const toggleVisibility = (memberId) => {
    updateProjectData({
      teamMembers: teamMembers.map(tm => 
        tm.id === memberId 
          ? { ...tm, visibleToClient: !tm.visibleToClient }
          : tm
      )
    });
  };
  
  // Get member initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Group members by role
  const membersByRole = {
    'Project Manager': filteredMembers.filter(m => m.role?.toLowerCase().includes('project manager')),
    'Creative Director': filteredMembers.filter(m => m.role?.toLowerCase().includes('creative')),
    'Strategy Lead': filteredMembers.filter(m => m.role?.toLowerCase().includes('strategy')),
    'Designer': filteredMembers.filter(m => m.role?.toLowerCase().includes('design')),
    'Other': filteredMembers.filter(m => 
      !m.role?.toLowerCase().includes('project manager') &&
      !m.role?.toLowerCase().includes('creative') &&
      !m.role?.toLowerCase().includes('strategy') &&
      !m.role?.toLowerCase().includes('design')
    )
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Agency Team</h2>
        <p className="mt-1 text-sm text-gray-600">
          Assign team members and set client visibility
        </p>
      </div>
      
      {/* Project Manager Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Project Manager
            <Badge variant="destructive" className="ml-2">Required</Badge>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            The primary point of contact for this project
          </p>
        </div>
        
        {projectManager ? (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={projectManager.profile_image} />
                    <AvatarFallback>{getInitials(projectManager.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {projectManager.name}
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Badge variant="secondary" className="text-xs">PM</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {projectManager.email}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProjectData({ projectManager: null })}
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Select a project manager from the team members below
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Team Members Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select team members for this project
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Users className="w-3 h-3" />
            {teamMembers.length} selected
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Team Members Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading team members...
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(membersByRole).map(([role, members]) => {
              if (members.length === 0) return null;
              
              return (
                <div key={role}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{role}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {members.map((member) => {
                      const isSelected = teamMembers.some(tm => tm.id === member.id);
                      const isPM = projectManager?.id === member.id;
                      const teamMember = teamMembers.find(tm => tm.id === member.id);
                      
                      return (
                        <Card 
                          key={member.id}
                          className={`
                            cursor-pointer transition-all
                            ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'}
                            ${isPM ? 'ring-2 ring-blue-500' : ''}
                          `}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleTeamMember(member)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={member.profile_image} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(member.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {member.name}
                                      {isPM && <Star className="w-3 h-3 text-yellow-500 fill-current inline ml-1" />}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {member.role}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Actions for selected members */}
                                {isSelected && (
                                  <div className="mt-2 flex items-center gap-2">
                                    {!isPM && (
                                      <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProjectManager(member);
                                        }}
                                        className="text-xs"
                                      >
                                        Set as PM
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleVisibility(member.id);
                                      }}
                                      className="text-xs"
                                    >
                                      {teamMember?.visibleToClient ? (
                                        <>
                                          <Eye className="w-3 h-3 mr-1" />
                                          Visible
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="w-3 h-3 mr-1" />
                                          Hidden
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Add Team Member Option */}
        {!isLoading && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <Button variant="outline" className="w-full" disabled>
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Team Member
                <span className="text-xs text-gray-500 ml-2">(Coming soon)</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Selected Team Summary */}
      {teamMembers.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Team ({teamMembers.length})</h4>
          <div className="space-y-1">
            {teamMembers.map(tm => (
              <div key={tm.id} className="text-sm text-gray-600 flex items-center justify-between">
                <span>
                  {tm.name} - {tm.role}
                  {projectManager?.id === tm.id && (
                    <Badge variant="secondary" className="ml-2 text-xs">PM</Badge>
                  )}
                </span>
                <span className="text-xs">
                  {tm.visibleToClient ? (
                    <span className="text-green-600">Visible to client</span>
                  ) : (
                    <span className="text-gray-400">Hidden from client</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}