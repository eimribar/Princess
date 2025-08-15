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
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import AddTeamMemberDialog from "../components/team/AddTeamMemberDialog";

export default function Team() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setIsLoading(true);
    try {
      const data = await TeamMember.list('name');
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Error loading team members:", error);
    }
    setIsLoading(false);
  };

  const handleMemberAdded = async () => {
    await loadTeamMembers();
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const decisionMakers = teamMembers.filter(member => member.is_decision_maker);
  const regularMembers = teamMembers.filter(member => !member.is_decision_maker);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Members</h1>
            <p className="text-slate-600 mt-2">Connect with your project team</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{teamMembers.length}</p>
                  <p className="text-sm text-slate-600">Total Members</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-full px-6 py-4"
              size="lg"
            >
              <UserPlus className="w-5 h-5" />
              Add Team Member
            </Button>
          </div>
        </motion.div>

        {/* Decision Makers Section */}
        {decisionMakers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-semibold text-slate-900">Decision Makers</h2>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {decisionMakers.length}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {decisionMakers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                  >
                    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <Avatar className="w-16 h-16 border-4 border-amber-100">
                              <AvatarImage src={member.profile_image} alt={member.name} />
                              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 text-lg">{member.name}</h3>
                            <p className="text-slate-600 mb-3">{member.role}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Decision Maker
                              </Badge>
                              {member.notification_preferences?.email && (
                                <Badge variant="outline" className="text-xs">
                                  <Bell className="w-3 h-3 mr-1" />
                                  Email
                                </Badge>
                              )}
                              {member.notification_preferences?.sms && (
                                <Badge variant="outline" className="text-xs">
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  SMS
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={`mailto:${member.email}`}>
                                  <Mail className="w-4 h-4 mr-1" />
                                  Email
                                </a>
                              </Button>
                              {member.linkedin_url && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="w-4 h-4 mr-1" />
                                    LinkedIn
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular Team Members */}
        {regularMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-semibold text-slate-900">Team Members</h2>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {regularMembers.length}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-slate-100">
                            <AvatarImage src={member.profile_image} alt={member.name} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-lg">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <h3 className="font-semibold text-slate-900 text-lg mb-1">{member.name}</h3>
                          <p className="text-slate-600 mb-4">{member.role}</p>
                          
                          <div className="flex flex-wrap justify-center gap-1 mb-4">
                            {member.notification_preferences?.email && (
                              <Badge variant="outline" className="text-xs">
                                <Bell className="w-3 h-3 mr-1" />
                                Email
                              </Badge>
                            )}
                            {member.notification_preferences?.sms && (
                              <Badge variant="outline" className="text-xs">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                SMS
                              </Badge>
                            )}
                            {member.notification_preferences?.level && (
                              <Badge variant="secondary" className="text-xs">
                                {member.notification_preferences.level.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-2 justify-center">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`mailto:${member.email}`}>
                                <Mail className="w-4 h-4" />
                              </a>
                            </Button>
                            {member.linkedin_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                                  <Linkedin className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {teamMembers.length === 0 && (
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

        <AddTeamMemberDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onMemberAdded={handleMemberAdded}
        />
      </div>
    </div>
  );
}