import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Phone,
  Linkedin,
  Users,
  Briefcase,
  Star,
  Clock,
  CheckCircle2,
  MessageSquare,
  Calendar,
  MapPin,
  Globe,
  Award,
  Target,
  Sparkles,
  User,
  Building,
  ExternalLink,
  Copy,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

/**
 * Premium Client Team Page
 * 
 * Beautiful, read-only team display designed for clients to connect with their project team.
 * Features:
 * - Elegant team member cards
 * - Contact information display
 * - Role and expertise showcase
 * - Availability indicators
 * - Quick contact actions
 */

const ClientTeam = () => {
  const { toast } = useToast();
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Mock team data
  const teamMembers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Creative Director',
      email: 'sarah.johnson@deutschco.com',
      phone: '+1 (555) 123-4567',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      avatar: 'https://i.pravatar.cc/150?img=1',
      team_type: 'agency',
      is_decision_maker: true,
      bio: 'Award-winning creative director with 15+ years of experience in brand transformation. Specializes in innovative visual storytelling and strategic brand positioning.',
      expertise: ['Brand Strategy', 'Visual Identity', 'Creative Direction'],
      availability: 'available',
      timezone: 'EST',
      location: 'New York, USA',
      currentProjects: 3,
      yearsExperience: 15,
      specialties: ['Luxury Brands', 'Tech Startups', 'Retail'],
      achievements: [
        'Cannes Lions Gold Winner 2023',
        'D&AD Pencil Award 2022',
        'Featured in Forbes 30 Under 30'
      ]
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Brand Strategist',
      email: 'michael.chen@deutschco.com',
      phone: '+1 (555) 234-5678',
      linkedin: 'https://linkedin.com/in/michaelchen',
      avatar: 'https://i.pravatar.cc/150?img=3',
      team_type: 'agency',
      is_decision_maker: false,
      bio: 'Strategic thinker with a passion for uncovering brand truths and creating meaningful connections between brands and their audiences.',
      expertise: ['Market Research', 'Brand Positioning', 'Consumer Insights'],
      availability: 'busy',
      timezone: 'PST',
      location: 'San Francisco, USA',
      currentProjects: 5,
      yearsExperience: 8,
      specialties: ['B2B', 'SaaS', 'Healthcare'],
      achievements: [
        'MBA from Wharton',
        'Published in Harvard Business Review'
      ]
    },
    {
      id: 3,
      name: 'Emma Williams',
      role: 'Senior Designer',
      email: 'emma.williams@deutschco.com',
      phone: '+1 (555) 345-6789',
      linkedin: 'https://linkedin.com/in/emmawilliams',
      avatar: 'https://i.pravatar.cc/150?img=5',
      team_type: 'agency',
      is_decision_maker: false,
      bio: 'Multidisciplinary designer focused on creating beautiful, functional designs that tell compelling brand stories.',
      expertise: ['UI/UX Design', 'Typography', 'Motion Graphics'],
      availability: 'available',
      timezone: 'CST',
      location: 'Chicago, USA',
      currentProjects: 4,
      yearsExperience: 6,
      specialties: ['Digital Design', 'Print', 'Packaging'],
      achievements: [
        'Awwwards Site of the Day',
        'Behance Featured Designer'
      ]
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Project Manager',
      email: 'david.kim@deutschco.com',
      phone: '+1 (555) 456-7890',
      linkedin: 'https://linkedin.com/in/davidkim',
      avatar: 'https://i.pravatar.cc/150?img=4',
      team_type: 'agency',
      is_decision_maker: false,
      bio: 'Certified PMP with expertise in agile methodologies and a track record of delivering complex brand projects on time and within budget.',
      expertise: ['Project Management', 'Agile', 'Risk Management'],
      availability: 'available',
      timezone: 'EST',
      location: 'Boston, USA',
      currentProjects: 2,
      yearsExperience: 10,
      specialties: ['Large-scale Projects', 'Cross-functional Teams'],
      achievements: [
        'PMP Certified',
        'Scrum Master Certified'
      ]
    },
    {
      id: 5,
      name: 'Robert Taylor',
      role: 'CEO',
      email: 'robert.taylor@techcorp.com',
      phone: '+1 (555) 567-8901',
      linkedin: 'https://linkedin.com/in/roberttaylor',
      avatar: 'https://i.pravatar.cc/150?img=7',
      team_type: 'client',
      is_decision_maker: true,
      bio: 'Visionary leader driving digital transformation and brand evolution at TechCorp Industries.',
      expertise: ['Business Strategy', 'Digital Transformation', 'Leadership'],
      availability: 'away',
      timezone: 'EST',
      location: 'Miami, USA',
      currentProjects: 1,
      yearsExperience: 20,
      specialties: ['Technology', 'Innovation'],
      achievements: [
        'CEO of the Year 2023',
        'TED Speaker'
      ]
    },
    {
      id: 6,
      name: 'Lisa Anderson',
      role: 'Marketing Director',
      email: 'lisa.anderson@techcorp.com',
      phone: '+1 (555) 678-9012',
      linkedin: 'https://linkedin.com/in/lisaanderson',
      avatar: 'https://i.pravatar.cc/150?img=9',
      team_type: 'client',
      is_decision_maker: true,
      bio: 'Marketing leader with expertise in brand development and integrated marketing campaigns.',
      expertise: ['Marketing Strategy', 'Brand Management', 'Digital Marketing'],
      availability: 'available',
      timezone: 'EST',
      location: 'Atlanta, USA',
      currentProjects: 1,
      yearsExperience: 12,
      specialties: ['Brand Marketing', 'Growth Strategy'],
      achievements: [
        'Marketing Excellence Award 2023',
        'Forbes CMO Next'
      ]
    }
  ];

  // Filter team members based on tab
  const filteredMembers = teamMembers.filter(member => {
    if (activeTab === 'all') return true;
    if (activeTab === 'agency') return member.team_type === 'agency';
    if (activeTab === 'client') return member.team_type === 'client';
    return true;
  });

  // Get availability configuration
  const getAvailabilityConfig = (status) => {
    const configs = {
      available: {
        label: 'Available',
        color: 'bg-green-500',
        icon: CheckCircle2,
        textColor: 'text-green-600'
      },
      busy: {
        label: 'In Meeting',
        color: 'bg-yellow-500',
        icon: Clock,
        textColor: 'text-yellow-600'
      },
      away: {
        label: 'Away',
        color: 'bg-gray-400',
        icon: Clock,
        textColor: 'text-gray-600'
      }
    };
    return configs[status] || configs.away;
  };

  // Copy to clipboard
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
      duration: 2000
    });
  };

  // Team member card component
  const TeamMemberCard = ({ member }) => {
    const availabilityConfig = getAvailabilityConfig(member.availability);
    const AvailabilityIcon = availabilityConfig.icon;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="group"
      >
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
          {/* Gradient Header */}
          <div className={cn(
            "h-32 relative",
            member.team_type === 'agency' 
              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
              : "bg-gradient-to-br from-green-500 to-emerald-600"
          )}>
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
              }} />
            </div>

            {/* Badges */}
            <div className="absolute top-3 right-3 flex gap-2">
              {member.is_decision_maker && (
                <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm">
                  <Star className="w-3 h-3 mr-1 text-yellow-500" />
                  Decision Maker
                </Badge>
              )}
              <Badge className={cn(
                "backdrop-blur-sm",
                member.team_type === 'agency' 
                  ? "bg-blue-900/50 text-white"
                  : "bg-green-900/50 text-white"
              )}>
                {member.team_type === 'agency' ? 'Agency' : 'Client'}
              </Badge>
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-white shadow-xl">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-100 to-gray-200">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {/* Availability Indicator */}
                <div className={cn(
                  "absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-white",
                  availabilityConfig.color
                )}>
                  <AvailabilityIcon className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>

          <CardContent className="pt-16 pb-6">
            {/* Name and Role */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {member.name}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {member.role}
              </p>
            </div>

            {/* Bio */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {member.bio}
            </p>

            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {member.expertise.slice(0, 3).map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-gray-100"
                >
                  {skill}
                </Badge>
              ))}
              {member.expertise.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-100">
                  +{member.expertise.length - 3}
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-gray-900">
                  {member.yearsExperience}
                </p>
                <p className="text-xs text-gray-500">Years Exp</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-gray-900">
                  {member.currentProjects}
                </p>
                <p className="text-xs text-gray-500">Projects</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-gray-900">
                  {member.timezone}
                </p>
                <p className="text-xs text-gray-500">Timezone</p>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.location.href = `mailto:${member.email}`}
              >
                <Mail className="w-4 h-4 mr-1" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedMember(member)}
              >
                <User className="w-4 h-4 mr-1" />
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Project Team</h1>
                <p className="mt-2 text-gray-600">Connect with your dedicated project team members</p>
              </div>

              {/* Team Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-2">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-500">Agency Team</p>
                  <p className="text-xl font-bold text-gray-900">
                    {teamMembers.filter(m => m.team_type === 'agency').length}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-2">
                    <Building className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">Client Team</p>
                  <p className="text-xl font-bold text-gray-900">
                    {teamMembers.filter(m => m.team_type === 'client').length}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-2">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-500">Decision Makers</p>
                  <p className="text-xl font-bold text-gray-900">
                    {teamMembers.filter(m => m.is_decision_maker).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All Members
              <Badge className="ml-2" variant="secondary">
                {teamMembers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="agency">
              Agency Team
              <Badge className="ml-2 bg-blue-100 text-blue-800">
                {teamMembers.filter(m => m.team_type === 'agency').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="client">
              Client Team
              <Badge className="ml-2 bg-green-100 text-green-800">
                {teamMembers.filter(m => m.team_type === 'client').length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMembers.map(member => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Member Detail Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedMember.avatar} />
                    <AvatarFallback className="text-2xl">
                      {selectedMember.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-1">
                      {selectedMember.name}
                    </DialogTitle>
                    <p className="text-gray-600 font-medium">
                      {selectedMember.role}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn(
                        selectedMember.team_type === 'agency'
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      )}>
                        {selectedMember.team_type === 'agency' ? 'Agency' : 'Client'}
                      </Badge>
                      {selectedMember.is_decision_maker && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Decision Maker
                        </Badge>
                      )}
                      <Badge variant="outline" className={getAvailabilityConfig(selectedMember.availability).textColor}>
                        {getAvailabilityConfig(selectedMember.availability).label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Bio */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600">{selectedMember.bio}</p>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{selectedMember.email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedMember.email, 'Email')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{selectedMember.phone}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedMember.phone, 'Phone')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Linkedin className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">LinkedIn Profile</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(selectedMember.linkedin, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Location & Timezone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedMember.location}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Timezone</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" />
                      <span>{selectedMember.timezone}</span>
                    </div>
                  </div>
                </div>

                {/* Expertise */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Areas of Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.expertise.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Industry Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                {selectedMember.achievements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Achievements</h3>
                    <div className="space-y-2">
                      {selectedMember.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="text-gray-700">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => window.location.href = `mailto:${selectedMember.email}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.location.href = `tel:${selectedMember.phone}`}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedMember.linkedin, '_blank')}
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientTeam;