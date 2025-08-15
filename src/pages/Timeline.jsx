import React, { useState, useEffect } from "react";
import { Stage, TeamMember } from "@/api/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { List, CheckCircle2, Clock, AlertTriangle, User, Calendar, Loader2 } from "lucide-react";

export default function Timeline() {
  const [stages, setStages] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stagesData, teamMembersData] = await Promise.all([
        Stage.list('order_index'),
        TeamMember.list()
      ]);
      setStages(stagesData || []);
      setTeamMembers(teamMembersData || []);
    } catch (error) {
      console.error("Error loading timeline data:", error);
    }
    setIsLoading(false);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-50' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50' };
      case 'blocked':
        return { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50' };
      default:
        return { icon: Clock, color: 'text-slate-400', bgColor: 'bg-slate-50' };
    }
  };
  
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <List className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Timeline</h1>
            <p className="text-slate-600 mt-1">A detailed, list-based view of all project stages.</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-16 text-center">#</TableHead>
                <TableHead>Stage Name</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead className="w-48">Assigned To</TableHead>
                <TableHead className="w-40">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage) => {
                const statusInfo = getStatusInfo(stage.status);
                const assignedMember = teamMembers.find(m => m.email === stage.assigned_to);
                return (
                  <TableRow key={stage.id} className="hover:bg-slate-50/60">
                    <TableCell className="text-center font-medium text-slate-500">{stage.number_index}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{stage.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusInfo.bgColor} ${statusInfo.color} border-${statusInfo.color.replace('text-', '')}/20`}>
                        <statusInfo.icon className="w-3.5 h-3.5 mr-1.5" />
                        {stage.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignedMember ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={assignedMember.profile_image} />
                            <AvatarFallback>{getInitials(assignedMember.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-700">{assignedMember.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {stage.deadline ? (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(stage.deadline), "MMM d, yyyy")}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}