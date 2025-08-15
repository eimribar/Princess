import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ListChecks, Milestone, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { deliverablesByPhase, summaries } from "./PlaybookData";

const getPriorityStyles = (priority) => {
  switch (priority) {
    case "Critical":
      return "bg-red-100 text-red-800 border-red-200";
    case "High":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Low":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const DeliverableCard = ({ deliverable, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-slate-200/80 rounded-lg p-4 bg-white/60"
    >
      <div className="flex justify-between items-start">
        <p className="font-semibold text-slate-800 pr-4">{deliverable.name}</p>
        <div className="text-sm font-bold text-slate-400 w-8 text-right">#{deliverable.step}</div>
      </div>
      <div className="mt-3 space-y-3">
        <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Priority:</span>
            <Badge variant="outline" className={`${getPriorityStyles(deliverable.priority)}`}>
                {deliverable.priority}
            </Badge>
        </div>
        <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Axis:</span>
            <Badge variant="secondary">{deliverable.axis}</Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {deliverable.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
        {deliverable.note && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200">
            <strong>Note:</strong> {deliverable.note}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default function DeliverablePlaybook() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="mt-12"
    >
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-slate-600" />
            <CardTitle className="text-xl">Deliverable Playbook Reference</CardTitle>
          </div>
          <p className="text-slate-600 mt-2">
            Complete 45-deliverable guide for the Deutsch & Co. branding process
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-12">
          {deliverablesByPhase.map((phaseData, phaseIndex) => (
            <motion.div
              key={phaseData.phase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIndex * 0.1 }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-slate-800">{phaseData.phase}</h3>
                <p className="text-slate-500">{phaseData.total} deliverables</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {phaseData.deliverables.map((d, i) => (
                  <DeliverableCard key={d.step} deliverable={d} index={i} />
                ))}
              </div>
            </motion.div>
          ))}

          <div className="space-y-8 pt-8 border-t border-slate-200/80">
            <h3 className="text-3xl font-bold text-slate-900 text-center">
              Playbook Summaries
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <ListChecks className="w-6 h-6 text-indigo-500" />
                    Critical Path Deliverables
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summaries.criticalPath.map(item => (
                    <div key={item.name} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100">
                      <Milestone className="w-5 h-5 text-red-600 mt-1" />
                      <div>
                        <p className="font-semibold text-red-900">{item.name} <span className="text-sm font-normal text-red-700">(Step {item.step})</span></p>
                        <p className="text-sm text-red-800">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <UserCheck className="w-6 h-6 text-amber-500" />
                    Special Approval Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Requires Roee's Approval:</h4>
                    <ul className="list-disc list-inside text-amber-800 space-y-1">
                      {summaries.specialApproval.roee.map(item => <li key={item.name}>{item.name} (Step {item.step})</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Conditional Deliverables:</h4>
                    <ul className="list-disc list-inside text-amber-800 space-y-1">
                      {summaries.specialApproval.conditional.map(item => <li key={item.name}>{item.name} - <span className="italic">{item.reason}</span></li>)}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}