import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  UserPlus,
  Crown,
  Mail,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  Filter,
  GripVertical,
  Info,
  Briefcase,
  Star,
  TrendingUp,
  UserCheck,
  Settings,
  Send
} from 'lucide-react';
import { useWizard } from '@/pages/ProjectSetup';
import { useToast } from '@/components/ui/use-toast';
import { TeamMember } from '@/api/entities';

// Mock available team members
const AVAILABLE_TEAM_MEMBERS = [
  {
    id: 'tm-1',
    name: 'John Smith',
    email: 'john@deutschco.com',
    role: 'Creative Director',
    team_type: 'agency',
    availability: 80,
    currentProjects: 2,
    expertise: ['Brand Strategy', 'Visual Design', 'Creative Direction'],
    profile_image: null,
    bio: 'Senior creative director with 15+ years of experience in brand development.'
  },
  {
    id: 'tm-2',
    name: 'Sarah Chen',
    email: 'sarah@deutschco.com',
    role: 'Brand Strategist',
    team_type: 'agency',
    availability: 60,
    currentProjects: 3,
    expertise: ['Market Research', 'Brand Positioning', 'Consumer Insights'],
    profile_image: null,
    bio: 'Strategic thinker specializing in brand positioning and market analysis.'
  },
  {
    id: 'tm-3',
    name: 'Mike Johnson',
    email: 'mike@deutschco.com',
    role: 'Project Manager',
    team_type: 'agency',
    availability: 90,
    currentProjects: 1,
    expertise: ['Project Management', 'Client Relations', 'Process Optimization'],
    profile_image: null,
    bio: 'Certified PMP with expertise in creative project management.'
  },
  {
    id: 'tm-4',
    name: 'Emily Davis',
    email: 'emily@deutschco.com',
    role: 'Senior Designer',
    team_type: 'agency',
    availability: 70,
    currentProjects: 2,
    expertise: ['Logo Design', 'Typography', 'Brand Guidelines'],
    profile_image: null,
    bio: 'Award-winning designer with focus on brand identity systems.'
  },
  {
    id: 'tm-5',
    name: 'David Lee',
    email: 'david@deutschco.com',
    role: 'UX Designer',
    team_type: 'agency',
    availability: 85,
    currentProjects: 1,
    expertise: ['User Research', 'Wireframing', 'Digital Experience'],
    profile_image: null,
    bio: 'UX specialist focused on creating intuitive digital brand experiences.'
  },
  {
    id: 'tm-6',
    name: 'Lisa Wang',
    email: 'lisa@deutschco.com',
    role: 'Copywriter',
    team_type: 'agency',
    availability: 75,
    currentProjects: 2,
    expertise: ['Brand Voice', 'Content Strategy', 'Messaging'],
    profile_image: null,
    bio: 'Creative copywriter specializing in brand voice and messaging.'
  }
];

// Role definitions with permissions
const ROLE_DEFINITIONS = {
  'Project Lead': {
    description: 'Overall project ownership and final decisions',
    permissions: ['All access', 'Approve deliverables', 'Manage team', 'Client communication'],
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    maxCount: 1
  },
  'Creative Lead': {
    description: 'Creative direction and quality control',
    permissions: ['Approve creative', 'Manage designers', 'Review deliverables'],
    icon: Star,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    maxCount: 2
  },
  'Account Manager': {
    description: 'Client relationship and communication',
    permissions: ['Client communication', 'Schedule meetings', 'Update status'],
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    maxCount: 2
  },
  'Team Member': {
    description: 'Execution and collaboration',
    permissions: ['View project', 'Upload work', 'Comment'],
    icon: UserCheck,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    maxCount: null
  }
};

export default function TeamConfiguration() {
  const { projectData, updateProjectData } = useWizard();
  const { toast } = useToast();
  
  const [availableMembers, setAvailableMembers] = useState(AVAILABLE_TEAM_MEMBERS);
  const [assignedTeam, setAssignedTeam] = useState(projectData.team || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [decisionMakers, setDecisionMakers] = useState(new Set());
  const [showCapacityWarning, setShowCapacityWarning] = useState(false);
  const [capacityIssues, setCapacityIssues] = useState([]);
  
  // Load existing team members
  useEffect(() => {
    loadTeamMembers();
  }, []);
  
  // Update project data when team changes
  useEffect(() => {
    updateProjectData({ 
      team: assignedTeam.map(member => ({
        ...member,
        is_decision_maker: decisionMakers.has(member.id)
      }))
    });
  }, [assignedTeam, decisionMakers]);
  
  const loadTeamMembers = async () => {
    try {
      const members = await TeamMember.list();
      if (members && members.length > 0) {
        setAvailableMembers(prev => [...prev, ...members]);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };
  
  // Filter available members
  const filteredMembers = availableMembers.filter(member => {
    // Don't show already assigned members
    if (assignedTeam.find(t => t.id === member.id)) return false;
    
    // Search filter
    if (searchQuery && !member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.role.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Role filter
    if (filterRole !== 'all' && !member.role.toLowerCase().includes(filterRole.toLowerCase())) {
      return false;
    }
    
    // Availability filter
    if (filterAvailability === 'high' && member.availability < 70) return false;
    if (filterAvailability === 'medium' && (member.availability < 40 || member.availability >= 70)) return false;
    if (filterAvailability === 'low' && member.availability >= 40) return false;
    
    return true;
  });
  
  // Handle drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Moving from available to assigned
    if (source.droppableId === 'available' && destination.droppableId.startsWith('role-')) {
      const member = filteredMembers[source.index];
      const role = destination.droppableId.replace('role-', '');
      
      // Check role capacity
      const roleConfig = ROLE_DEFINITIONS[role];
      const currentInRole = assignedTeam.filter(m => m.assigned_role === role).length;
      
      if (roleConfig.maxCount && currentInRole >= roleConfig.maxCount) {
        toast({
          title: "Role Capacity Reached",
          description: `The ${role} role can only have ${roleConfig.maxCount} member(s).`,
          variant: "destructive"
        });
        return;
      }
      
      // Check member availability
      if (member.availability < 30) {
        setCapacityIssues([member]);
        setShowCapacityWarning(true);
        return;
      }
      
      // Add to assigned team
      const assignedMember = {
        ...member,
        assigned_role: role,
        allocation: Math.min(100 - member.currentProjects * 20, 50)
      };
      
      setAssignedTeam([...assignedTeam, assignedMember]);
      
      toast({
        title: "Team Member Assigned",
        description: `${member.name} has been assigned as ${role}.`,
      });
    }
    
    // Reordering within assigned team
    if (source.droppableId === destination.droppableId && source.droppableId.startsWith('role-')) {
      const role = source.droppableId.replace('role-', '');
      const roleMembers = assignedTeam.filter(m => m.assigned_role === role);
      const [reorderedItem] = roleMembers.splice(source.index, 1);
      roleMembers.splice(destination.index, 0, reorderedItem);
      
      const otherMembers = assignedTeam.filter(m => m.assigned_role !== role);
      setAssignedTeam([...otherMembers, ...roleMembers]);
    }
  };
  
  // Remove from team
  const handleRemoveFromTeam = (memberId) => {
    setAssignedTeam(assignedTeam.filter(m => m.id !== memberId));
    setDecisionMakers(prev => {
      const newSet = new Set(prev);
      newSet.delete(memberId);
      return newSet;
    });
    
    toast({
      title: "Team Member Removed",
      description: "The team member has been removed from the project.",
    });
  };
  
  // Toggle decision maker
  const toggleDecisionMaker = (memberId) => {
    const newDecisionMakers = new Set(decisionMakers);
    
    if (newDecisionMakers.has(memberId)) {
      newDecisionMakers.delete(memberId);
    } else {
      // Check limit (max 2 decision makers)
      if (newDecisionMakers.size >= 2) {
        toast({
          title: "Decision Maker Limit",
          description: "You can only have up to 2 decision makers per project.",
          variant: "destructive"
        });
        return;
      }
      newDecisionMakers.add(memberId);
    }
    
    setDecisionMakers(newDecisionMakers);
  };
  
  // Send invite
  const handleSendInvite = () => {
    if (!inviteEmail || !inviteName || !inviteRole) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to send an invite.",
        variant: "destructive"
      });
      return;
    }
    
    // Create new team member (would normally send actual invite)
    const newMember = {
      id: `tm-invite-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      team_type: inviteEmail.includes('@deutschco.com') ? 'agency' : 'client',
      availability: 100,
      currentProjects: 0,
      expertise: [],
      invited: true
    };
    
    setAvailableMembers([...availableMembers, newMember]);
    setShowInviteDialog(false);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('');
    
    toast({
      title: "Invite Sent",
      description: `An invitation has been sent to ${inviteEmail}.`,
    });
  };
  
  // Calculate team statistics
  const teamStats = {
    totalMembers: assignedTeam.length,
    agencyMembers: assignedTeam.filter(m => m.team_type === 'agency').length,
    clientMembers: assignedTeam.filter(m => m.team_type === 'client').length,
    avgAvailability: assignedTeam.length > 0 
      ? Math.round(assignedTeam.reduce((sum, m) => sum + (m.availability || 0), 0) / assignedTeam.length)
      : 0,
    decisionMakers: decisionMakers.size,
    rolesFilledR: Object.keys(ROLE_DEFINITIONS).filter(role => 
      assignedTeam.some(m => m.assigned_role === role)
    ).length
  };
  
  // Group assigned team by role
  const teamByRole = {};
  Object.keys(ROLE_DEFINITIONS).forEach(role => {
    teamByRole[role] = assignedTeam.filter(m => m.assigned_role === role);
  });
  
  return (
    <div className="space-y-6">
      {/* Team Statistics */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{teamStats.agencyMembers}</div>
              <div className="text-sm text-gray-600">Agency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{teamStats.clientMembers}</div>
              <div className="text-sm text-gray-600">Client</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{teamStats.avgAvailability}%</div>
              <div className="text-sm text-gray-600">Avg Availability</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{teamStats.decisionMakers}/2</div>
              <div className="text-sm text-gray-600">Decision Makers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {teamStats.rolesFilledR}/{Object.keys(ROLE_DEFINITIONS).length}
              </div>
              <div className="text-sm text-gray-600">Roles Filled</div>
            </div>
          </div>
          
          {teamStats.totalMembers === 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Team Members Assigned</AlertTitle>
              <AlertDescription>
                Please assign at least one team member to the project. Drag members from the available pool to the roles below.
              </AlertDescription>
            </Alert>
          )}
          
          {teamStats.avgAvailability < 50 && teamStats.totalMembers > 0 && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Low Team Availability</AlertTitle>
              <AlertDescription>
                The average team availability is below 50%. Consider adding members with higher availability or adjusting allocations.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Team Members */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Available Team Members</CardTitle>
            <CardDescription>
              Drag team members to assign them to project roles
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High (70%+)</SelectItem>
                    <SelectItem value="medium">Medium (40-70%)</SelectItem>
                    <SelectItem value="low">Low (&lt;40%)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite New
                </Button>
              </div>
            </div>
            
            {/* Members List */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="available">
                {(provided) => (
                  <ScrollArea className="flex-1">
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2 pr-4"
                    >
                      {filteredMembers.map((member, index) => (
                        <Draggable
                          key={member.id}
                          draggableId={member.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                bg-white border rounded-lg p-3 transition-all cursor-move
                                ${snapshot.isDragging ? 'shadow-lg rotate-2' : 'shadow-sm hover:shadow-md'}
                                ${member.availability < 30 ? 'border-red-200' : 'border-gray-200'}
                              `}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  {member.profile_image ? (
                                    <AvatarImage src={member.profile_image} />
                                  ) : (
                                    <AvatarFallback>
                                      {member.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{member.name}</span>
                                    {member.invited && (
                                      <Badge variant="outline" className="text-xs">
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">{member.role}</div>
                                  
                                  {/* Availability Bar */}
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">Availability</span>
                                      <span className={`font-medium ${
                                        member.availability >= 70 ? 'text-green-600' :
                                        member.availability >= 40 ? 'text-yellow-600' :
                                        'text-red-600'
                                      }`}>
                                        {member.availability}%
                                      </span>
                                    </div>
                                    <Progress 
                                      value={member.availability} 
                                      className="h-1.5"
                                    />
                                  </div>
                                  
                                  {/* Current Projects */}
                                  {member.currentProjects > 0 && (
                                    <div className="mt-1 text-xs text-gray-500">
                                      {member.currentProjects} current project{member.currentProjects > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                                
                                <GripVertical className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </ScrollArea>
                )}
              </Droppable>
            </DragDropContext>
            
            {filteredMembers.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No available team members</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Team Member
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Assigned Roles */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Project Team</CardTitle>
            <CardDescription>
              Assigned team members organized by role
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {Object.entries(ROLE_DEFINITIONS).map(([role, config]) => {
                  const RoleIcon = config.icon;
                  const members = teamByRole[role] || [];
                  const isFull = config.maxCount && members.length >= config.maxCount;
                  
                  return (
                    <div key={role} className="space-y-2">
                      {/* Role Header */}
                      <div className={`flex items-center justify-between p-3 rounded-lg ${config.bgColor}`}>
                        <div className="flex items-center gap-2">
                          <RoleIcon className={`w-5 h-5 ${config.color}`} />
                          <div>
                            <div className="font-medium text-gray-900">{role}</div>
                            <div className="text-xs text-gray-600">{config.description}</div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {members.length}{config.maxCount ? `/${config.maxCount}` : ''}
                        </Badge>
                      </div>
                      
                      {/* Role Members */}
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId={`role-${role}`}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`
                                min-h-[60px] rounded-lg border-2 border-dashed p-2 transition-colors
                                ${snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
                                ${isFull ? 'bg-gray-50' : ''}
                              `}
                            >
                              {members.length === 0 ? (
                                <div className="text-center py-4 text-sm text-gray-500">
                                  Drag team members here to assign as {role}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {members.map((member, index) => (
                                    <Draggable
                                      key={member.id}
                                      draggableId={`assigned-${member.id}`}
                                      index={index}
                                      isDragDisabled={true} // Disable reordering for now
                                    >
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className="bg-white border rounded-lg p-3 shadow-sm"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <Avatar className="h-8 w-8">
                                                {member.profile_image ? (
                                                  <AvatarImage src={member.profile_image} />
                                                ) : (
                                                  <AvatarFallback className="text-xs">
                                                    {member.name.split(' ').map(n => n[0]).join('')}
                                                  </AvatarFallback>
                                                )}
                                              </Avatar>
                                              
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <span className="font-medium text-sm">{member.name}</span>
                                                  {decisionMakers.has(member.id) && (
                                                    <Crown className="w-4 h-4 text-yellow-500" />
                                                  )}
                                                </div>
                                                <div className="text-xs text-gray-600">{member.role}</div>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleDecisionMaker(member.id)}
                                                title="Toggle Decision Maker"
                                              >
                                                <Crown className={`w-4 h-4 ${
                                                  decisionMakers.has(member.id) ? 'text-yellow-500' : 'text-gray-400'
                                                }`} />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveFromTeam(member.id)}
                                              >
                                                <X className="w-4 h-4 text-red-500" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                </div>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to a new team member to join the project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="John Doe"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Role</label>
              <Input
                placeholder="e.g., Designer, Developer"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite}>
              <Send className="w-4 h-4 mr-2" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Capacity Warning Dialog */}
      <Dialog open={showCapacityWarning} onOpenChange={setShowCapacityWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Low Availability Warning</DialogTitle>
            <DialogDescription>
              The following team member(s) have low availability:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {capacityIssues.map(member => (
              <Alert key={member.id} className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <strong>{member.name}</strong> has only {member.availability}% availability 
                  and is already on {member.currentProjects} project(s).
                </AlertDescription>
              </Alert>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCapacityWarning(false)}>
              Cancel Assignment
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                // Proceed with assignment anyway
                setShowCapacityWarning(false);
              }}
            >
              Assign Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}