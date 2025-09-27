import React, { useState, useEffect } from "react";
import { TeamMember } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Phone,
  MoreVertical,
  Plus,
  UserPlus,
  Loader2,
  Search,
  Grid3X3,
  List,
  Crown,
  Eye,
  Edit,
  Linkedin
} from "lucide-react";
import { motion } from "framer-motion";
import TeamMemberModal from "../components/team/TeamMemberModal";
import InviteTeamMemberDialog from "../components/team/InviteTeamMemberDialog";
import { useUser } from '@/contexts/ClerkUserContext';
import { useProject } from '@/contexts/ProjectContext';
import { canManageTeamMember } from '@/lib/permissions';
import { useToast } from "@/components/ui/use-toast";
import { checkAndMigrate, migrateTeamMembersToSupabase } from '@/utils/migrateToSupabase';
import { testSupabaseConnection } from '@/utils/testSupabaseConnection';
import { debugAuth } from '@/utils/debugAuth';
import { refreshSession } from '@/utils/authHelpers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Team() {
  const { user } = useUser();
  const { currentProjectId } = useProject();
  const { toast } = useToast();
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Modal state for viewing/editing/adding team members
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', or 'add'
  
  // State for search, filter (removed pagination)
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [teamTypeFilter, setTeamTypeFilter] = useState("agency"); // New state for team type tabs
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  useEffect(() => {
    // Check for migration on component mount
    checkAndMigrate().then(() => {
      loadTeamMembers();
    });
  }, []);

  const loadTeamMembers = async () => {
    setIsLoading(true);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Loading team members timed out')), 10000)
      );
      
      const dataPromise = TeamMember.list('name');
      
      // Race between data loading and timeout
      const data = await Promise.race([dataPromise, timeoutPromise]);
      
      // Remove duplicates based on email (keep first occurrence)
      const uniqueMembers = data ? data.reduce((acc, member) => {
        const exists = acc.find(m => m.email === member.email);
        if (!exists) {
          acc.push(member);
        }
        return acc;
      }, []) : [];
      
      setTeamMembers(uniqueMembers);
    } catch (error) {
      console.error("Error loading team members:", error);
      // Still show existing data if refresh fails
    } finally {
      setIsLoading(false);
    }
  };

  // Bio fields can be manually added by users if desired
  // No auto-generation of professional descriptions

  // Open modal for viewing a team member (click on card)
  const handleViewMember = (member) => {
    setSelectedMember(member);
    setModalMode('view');
    setModalOpen(true);
  };

  // Open modal for editing a team member
  const handleEditMember = (member) => {
    setSelectedMember(member);
    setModalMode('edit');
    setModalOpen(true);
  };

  // Open modal for adding a new team member
  const handleAddMember = () => {
    // Pre-populate with current team type filter
    setSelectedMember({ team_type: teamTypeFilter });
    setModalMode('add');
    setModalOpen(true);
  };

  // Handle save from modal (both edit and add)
  const handleModalSave = async () => {
    await loadTeamMembers();
  };

  // Handle delete from modal
  const handleModalDelete = async () => {
    await loadTeamMembers();
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Manual migration function for testing
  const handleManualMigration = async () => {
    const result = await migrateTeamMembersToSupabase();
    if (result.success) {
      toast({
        title: "Migration Complete",
        description: `Migrated ${result.migrated} team members to Supabase`,
      });
      await loadTeamMembers();
    } else {
      toast({
        title: "Migration Failed",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  // Refresh session helper
  const handleRefreshSession = async () => {
    const { success, error } = await refreshSession();
    if (success) {
      toast({
        title: "Session Refreshed",
        description: "Your authentication session has been refreshed",
      });
    } else {
      toast({
        title: "Session Refresh Failed",
        description: error?.message || "Please login again",
        variant: "destructive"
      });
    }
  };

  // Get role badge color and label
  const getRoleBadge = (member) => {
    // First check if explicitly marked as decision maker
    if (member.is_decision_maker) {
      return { color: "bg-yellow-100 text-yellow-800", label: "Decision Maker" };
    }
    
    // Map roles to badge types (without automatic decision maker assignment)
    const roleMap = {
      "Creative Director": { color: "bg-purple-100 text-purple-800", label: "Creative Director" },
      "Project Manager": { color: "bg-indigo-100 text-indigo-800", label: "Project Manager" },
      "UX Designer": { color: "bg-blue-100 text-blue-800", label: "Designer" },
      "UI Designer": { color: "bg-blue-100 text-blue-800", label: "Designer" },
      "Design Lead": { color: "bg-blue-100 text-blue-800", label: "Designer" },
      "Frontend Developer": { color: "bg-green-100 text-green-800", label: "Developer" },
      "Backend Developer": { color: "bg-green-100 text-green-800", label: "Developer" },
      "Full Stack Developer": { color: "bg-green-100 text-green-800", label: "Developer" },
      "QA Engineer": { color: "bg-purple-100 text-purple-800", label: "QA" },
      "Brand Strategist": { color: "bg-indigo-100 text-indigo-800", label: "Strategy" },
      "Senior Copywriter": { color: "bg-pink-100 text-pink-800", label: "Content" },
      "Marketing Director": { color: "bg-orange-100 text-orange-800", label: "Marketing" }
    };
    
    return roleMap[member.role] || { color: "bg-gray-100 text-gray-800", label: member.team_type === 'client' ? 'Client' : 'Team' };
  };

  // Filter members based on search, role, and team type
  const filteredMembers = teamMembers.filter(member => {
    const matchesTeamType = member.team_type === teamTypeFilter;
    
    const matchesSearch = searchQuery === "" || 
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || 
      (roleFilter === "decision_maker" && member.is_decision_maker) ||
      (roleFilter === "designer" && (member.role?.includes('Design') || member.role?.includes('UX') || member.role?.includes('UI'))) ||
      (roleFilter === "developer" && member.role?.includes('Developer'));
    
    return matchesTeamType && matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-500 mt-1">
              {teamTypeFilter === 'client' 
                ? 'Manage your client team members and decision makers.'
                : 'Manage your agency team members and their roles.'}
            </p>
          </div>
          {/* Show different buttons based on team type and user role */}
          {teamTypeFilter === 'agency' && canManageTeamMember(user, {}) && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsInviteDialogOpen(true)}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Team Member
              </button>
              <button 
                onClick={handleAddMember}
                className="bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 flex items-center shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Without Invitation
              </button>
            </div>
          )}
          {/* For client team, only show invite button for decision makers */}
          {teamTypeFilter === 'client' && (user?.is_decision_maker || user?.role === 'admin' || user?.role === 'agency') && (
            <button 
              onClick={() => setIsInviteDialogOpen(true)}
              className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Team Member
            </button>
          )}
        </header>

        {/* Team Type Tabs */}
        <Tabs value={teamTypeFilter} onValueChange={setTeamTypeFilter} className="mb-6">
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
            <TabsTrigger 
              value="agency" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-4 pb-3 font-medium"
            >
              Deutsch&Co Agency Team
            </TabsTrigger>
            <TabsTrigger 
              value="client"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-4 pb-3 font-medium"
            >
              Client Team
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Controls Bar */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search members..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="decision_maker">Decision Maker</option>
                <option value="designer">Designer</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setViewMode('list')}
                className={`${viewMode === 'list' ? 'text-white bg-indigo-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} p-2 rounded-md transition-colors`}
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`${viewMode === 'grid' ? 'text-white bg-indigo-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} p-2 rounded-md transition-colors`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Team Grid - Updated with more columns and smaller cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
            {filteredMembers.map((member, index) => {
              const badge = getRoleBadge(member);
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => handleViewMember(member)}
                >
                  {member.profile_image ? (
                    <img 
                      alt={member.name}
                      className="w-16 h-16 rounded-full mb-3 object-cover"
                      src={member.profile_image}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full mb-3 bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                      {getInitials(member.name)}
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-gray-500 text-xs mb-1">{member.role}</p>
                  <span className={`${badge.color} text-xs font-medium px-2 py-0.5 rounded-full mb-2`}>
                    {badge.label}
                  </span>
                  <div className="flex space-x-2 mt-auto">
                    <a 
                      className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      href={`mailto:${member.email}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    <a 
                      className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleViewMember(member);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${member.email}`;
                        }}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        {member.linkedin_url && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            window.open(member.linkedin_url, '_blank');
                          }}>
                            <Linkedin className="w-4 h-4 mr-2" />
                            View LinkedIn
                          </DropdownMenuItem>
                        )}
                        {canManageTeamMember(user, member) && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleEditMember(member);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Member
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Add Member Card - Updated to match smaller size */}
            {canManageTeamMember(user, {}) && (
              <div 
                onClick={handleAddMember}
                className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-indigo-500 transition-all duration-300 min-h-[200px]"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Add Member</h3>
                <p className="text-gray-500 text-xs">Add a new team member</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <TeamMemberModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        member={selectedMember}
        canEdit={modalMode === 'edit' || modalMode === 'add'}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />

      <InviteTeamMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        projectId={currentProjectId}
      />
    </div>
  );
}