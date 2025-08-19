import React, { useState, useEffect } from "react";
import { TeamMember } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Mail, 
  Linkedin, 
  MessageCircle,
  Crown,
  User,
  Bell,
  BellOff,
  Plus,
  UserPlus,
  Loader2,
  Edit,
  Shield,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import AddTeamMemberDialog from "../components/team/AddTeamMemberDialog";
import EditTeamMemberDialog from "../components/team/EditTeamMemberDialog";
import { TeamMemberCard } from "../components/team/TeamMemberCard";
import { useUser } from '@/contexts/UserContext';
import { canManageTeamMember } from '@/lib/permissions';
import { useToast } from "@/components/ui/use-toast";

export default function Team() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setIsLoading(true);
    try {
      const data = await TeamMember.list('name');
      // Add enhanced bios and personal touches to existing members
      const enhancedMembers = (data || []).map(member => ({
        ...member,
        bio: generateBio(member),
        shortBio: generateShortBio(member),
        expertise: generateExpertise(member),
        personal: generatePersonalTouch(member)
      }));
      setTeamMembers(enhancedMembers);
    } catch (error) {
      console.error("Error loading team members:", error);
    }
    setIsLoading(false);
  };

  // Generate professional bios based on role
  const generateBio = (member) => {
    const bios = {
      "Creative Director": "Leading creative vision with over 15 years of brand transformation experience. Specializes in turning complex brand challenges into compelling visual narratives that resonate with audiences worldwide.",
      "Project Manager": "Strategic orchestrator of seamless project delivery. Expert in aligning creative teams with business objectives while maintaining the highest standards of quality and efficiency.",
      "Brand Strategist": "Architect of meaningful brand experiences. Combines data-driven insights with creative intuition to build brands that stand the test of time.",
      "Senior Copywriter": "Master storyteller crafting compelling narratives that drive engagement. Believes in the power of words to transform businesses and connect with hearts.",
      "Design Lead": "Pioneering innovative design solutions that push boundaries. Passionate about creating visual experiences that are both beautiful and functional.",
      "UX Designer": "Champion of user-centered design thinking. Creates intuitive digital experiences that delight users while achieving business goals.",
      "Marketing Director": "Growth catalyst with a track record of launching successful campaigns. Bridges the gap between creative excellence and measurable results."
    };
    return bios[member.role] || "Dedicated professional committed to delivering exceptional results and driving innovation in every project.";
  };

  const generateShortBio = (member) => {
    const shortBios = {
      "Creative Director": "Transforming brands through visionary design and strategic creativity.",
      "Project Manager": "Orchestrating seamless delivery of world-class creative projects.",
      "Brand Strategist": "Building meaningful connections between brands and audiences.",
      "Senior Copywriter": "Crafting stories that inspire, engage, and convert.",
      "Design Lead": "Creating visual experiences that captivate and communicate.",
      "UX Designer": "Designing intuitive experiences that users love.",
      "Marketing Director": "Driving growth through strategic creative campaigns."
    };
    return shortBios[member.role] || "Passionate about creating exceptional work that makes a difference.";
  };

  const generateExpertise = (member) => {
    const expertise = {
      "Creative Director": "Brand identity, visual storytelling, creative strategy, team leadership",
      "Project Manager": "Agile methodology, resource optimization, stakeholder management, risk mitigation",
      "Brand Strategist": "Market research, competitive analysis, brand positioning, consumer insights",
      "Senior Copywriter": "Brand voice, content strategy, storytelling, conversion optimization",
      "Design Lead": "Visual design, typography, color theory, design systems",
      "UX Designer": "User research, wireframing, prototyping, usability testing",
      "Marketing Director": "Campaign strategy, analytics, growth marketing, ROI optimization"
    };
    return expertise[member.role] || "Strategic thinking, creative problem-solving, collaborative leadership";
  };

  const generatePersonalTouch = (member) => {
    const personalTouches = [
      "Weekend chef experimenting with fusion cuisine. Believes the best ideas come while cooking.",
      "Marathon runner who finds clarity in morning runs. Applies endurance mindset to creative challenges.",
      "Coffee enthusiast with a home roasting setup. Approaches projects like brewing the perfect cup.",
      "Architecture photography hobbyist. Finds inspiration in urban landscapes and structural design.",
      "Jazz musician who brings rhythm and improvisation to the creative process.",
      "Vintage typography collector. Passionate about preserving design history while creating the future.",
      "Urban gardener cultivating ideas alongside heirloom tomatoes.",
      "Podcast host exploring the intersection of creativity and technology."
    ];
    return personalTouches[Math.floor(Math.random() * personalTouches.length)];
  };

  const handleMemberAdded = async () => {
    await loadTeamMembers();
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsEditDialogOpen(true);
  };

  const handleMemberUpdated = async () => {
    await loadTeamMembers();
  };

  const handleMemberDeleted = async () => {
    await loadTeamMembers();
  };

  const validateDecisionMakers = (newCount) => {
    if (newCount > 2) {
      toast({
        title: "Too Many Decision Makers",
        description: "A project can have a maximum of 2 decision makers.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const decisionMakers = teamMembers.filter(member => member.is_decision_maker);
  const regularMembers = teamMembers.filter(member => !member.is_decision_maker);
  const agencyMembers = teamMembers.filter(member => member.team_type === 'agency' || !member.team_type);
  const clientMembers = teamMembers.filter(member => member.team_type === 'client');


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-white rounded-2xl border border-slate-200"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Section */}
      <div className="px-8 pt-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Our Team</h1>
              </div>
              <p className="text-lg text-slate-600">Meet the brilliant minds behind your project's success</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-indigo-500" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{teamMembers.length}</p>
                    <p className="text-sm text-slate-600">Team Members</p>
                  </div>
                </div>
              </div>

              {canManageTeamMember(user, {}) && (
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-full px-6 py-4"
                  size="lg"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Team Member
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Premium Team Grid */}
      {teamMembers.length > 0 ? (
        <div className="px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            {/* Decision Makers Section */}
            {decisionMakers.length > 0 && (
              <div className="mb-12">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-amber-500" />
                    <h2 className="text-2xl font-bold text-slate-900">Decision Makers</h2>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {decisionMakers.length} / 2
                    </Badge>
                  </div>
                  <p className="text-slate-600 mt-2">Key stakeholders with approval authority</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {decisionMakers.map((member, index) => (
                    <TeamMemberCard
                      key={member.id}
                      member={member}
                      index={index}
                      onEdit={handleEditMember}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Team Members */}
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-indigo-500" />
                  <h2 className="text-2xl font-bold text-slate-900">All Team Members</h2>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {teamMembers.length}
                  </Badge>
                </div>
                <p className="text-slate-600 mt-2">The complete team working on your project</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {teamMembers.map((member, index) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    index={index}
                    onEdit={handleEditMember}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No team members yet</h3>
          <p className="text-slate-600 mb-6">Get started by adding your first team member to the project.</p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <Plus className="w-5 h-5" />
            Add First Team Member
          </Button>
        </motion.div>
      )}

      {/* Dialogs */}
      <AddTeamMemberDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onMemberAdded={handleMemberAdded}
      />

      <EditTeamMemberDialog
        member={editingMember}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onMemberUpdated={handleMemberUpdated}
        onMemberDeleted={handleMemberDeleted}
      />
    </div>
  );
}