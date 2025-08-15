
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Users, 
  FileText, 
  Workflow,
  Bell,
  Calendar,
  Database,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";
import PlaybookSeeder from "../components/admin/PlaybookSeeder";
import DeliverablePlaybook from "../components/admin/DeliverablePlaybook";

export default function Admin() {
  const adminSections = [
    {
      title: "Project Templates",
      description: "Configure project templates and workflow stages",
      icon: Workflow,
      color: "from-blue-500 to-indigo-600",
      actions: ["Create Template", "Edit Stages", "Manage Dependencies"]
    },
    {
      title: "Team Management",
      description: "Add team members and configure roles",
      icon: Users,
      color: "from-green-500 to-emerald-600",
      actions: ["Add Members", "Set Permissions", "Assign Roles"]
    },
    {
      title: "Notification Settings",
      description: "Configure notification preferences and triggers",
      icon: Bell,
      color: "from-amber-500 to-orange-600",
      actions: ["Email Settings", "SMS Config", "Alert Levels"]
    },
    {
      title: "Project Settings",
      description: "Manage project-specific configurations",
      icon: Settings,
      color: "from-purple-500 to-pink-600",
      actions: ["Timeline Settings", "Custom Fields", "Client Access"]
    },
    {
      title: "Deliverable Types",
      description: "Define and manage deliverable categories",
      icon: FileText,
      color: "from-cyan-500 to-blue-600",
      actions: ["Add Types", "Set Templates", "Configure Approvals"]
    },
    {
      title: "Access Control",
      description: "Manage user permissions and authentication",
      icon: Shield,
      color: "from-red-500 to-rose-600",
      actions: ["User Roles", "Permissions", "Security Settings"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Admin Panel</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Configure and manage your Princess project management system
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                <CardHeader className={`bg-gradient-to-r ${section.color} text-white p-6`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {section.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 flex-1 flex flex-col">
                  <p className="text-slate-600 mb-6 flex-1">
                    {section.description}
                  </p>
                  
                  <div className="space-y-2">
                    {section.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left hover:bg-slate-50"
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* System Setup Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-slate-600" />
                <CardTitle className="text-xl">System Setup</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PlaybookSeeder />
            </CardContent>
          </Card>
        </motion.div>

        {/* Deliverable Playbook Reference */}
        <DeliverablePlaybook />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center py-12 border-t border-slate-200"
        >
          <p className="text-slate-500 text-sm">
            Need help configuring Princess? Contact your system administrator or check the documentation.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
