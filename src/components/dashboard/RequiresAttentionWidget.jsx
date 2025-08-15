import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, MessageSquare, Bell, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RequiresAttentionWidget({ deliverables, outOfScopeRequests = [] }) {
  const navigate = useNavigate();

  // Deliverables requiring attention (submitted for approval)
  const attentionDeliverables = deliverables
    .filter(d => {
      const latestVersion = d.versions?.[d.versions.length - 1];
      return latestVersion?.status === 'submitted';
    })
    .map(d => {
      const feedbackRoundsUsed = d.versions?.filter(v => v.status === 'needs_revision').length || 0;
      return {
        id: d.id,
        type: 'deliverable',
        name: d.name,
        versionName: d.versions[d.versions.length - 1].version_name,
        remaining_rounds: (d.max_revisions || 0) - feedbackRoundsUsed,
        urgency: 'medium'
      };
    });

  // Out of scope requests requiring attention (pending review or approval)
  const attentionOutOfScope = outOfScopeRequests
    .filter(r => r.status === 'pending_review' || r.status === 'pending_approval')
    .map(r => ({
      id: r.id,
      type: 'out_of_scope',
      name: r.title,
      description: r.description.length > 100 ? `${r.description.substring(0, 100)}...` : r.description,
      urgency: r.urgency,
      status: r.status
    }));

  // Combine all attention items
  const allAttentionItems = [...attentionDeliverables, ...attentionOutOfScope];

  // Sort by urgency (critical, high, medium, low)
  const urgencyOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
  allAttentionItems.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (allAttentionItems.length === 0) {
    return (
      <Card className="bg-white/80 border-slate-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
            <AlertTriangle className="w-5 h-5 text-slate-400" />
            <span>Requires Attention</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Check className="w-12 h-12 bg-emerald-100 text-emerald-600 p-3 rounded-full mx-auto" />
            <p className="mt-4 font-medium text-slate-700">All caught up!</p>
            <p className="text-sm text-slate-500">Nothing requires your attention right now.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 border-slate-200/60 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Requires Attention</span>
          </CardTitle>
          <div className="w-6 h-6 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full">
            {allAttentionItems.length}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {allAttentionItems.map((item, index) => (
          <motion.div
            key={`${item.type}-${item.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`p-4 rounded-lg border-l-4 ${getUrgencyColor(item.urgency)} space-y-4`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {item.type === 'deliverable' ? (
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Bell className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="text-xs font-medium text-slate-500 uppercase">
                      {item.type === 'deliverable' ? 'Deliverable' : 'Out of Scope'}
                    </span>
                    {item.urgency !== 'medium' && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                        item.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.urgency.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  {item.type === 'deliverable' && item.versionName && (
                    <p className="text-sm text-slate-500">{item.versionName}</p>
                  )}
                  {item.type === 'out_of_scope' && item.description && (
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                  )}
                  {item.type === 'out_of_scope' && item.status && (
                    <p className="text-sm text-slate-500 mt-1">
                      Status: {item.status.replace('_', ' ').toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {item.type === 'deliverable' ? (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-emerald-500 hover:bg-emerald-600 flex-1"
                      onClick={() => navigate(createPageUrl(`DeliverableDetail?id=${item.id}`))}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Review & Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-700 bg-white hover:bg-slate-50 flex-1"
                      onClick={() => navigate(createPageUrl(`DeliverableDetail?id=${item.id}`))}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Decline ({item.remaining_rounds})
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-blue-500 hover:bg-blue-600 flex-1"
                      onClick={() => navigate(createPageUrl('OutofScope'))}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review Request
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-700 bg-white hover:bg-slate-50"
                      onClick={() => navigate(createPageUrl('OutofScope'))}
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}