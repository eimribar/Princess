import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { format, isPast } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function DeliverablesStatusWidget({ deliverables }) {
  const navigate = useNavigate();

  // Show a mix of completed and upcoming deliverables
  const upcomingDeliverables = deliverables
    .filter(d => d.due_date && !isPast(new Date(d.due_date)))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3);
  
  const completedDeliverables = deliverables
    .filter(d => d.status === 'completed')
    .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
    .slice(0, 2);

  const items = [...completedDeliverables, ...upcomingDeliverables].slice(0, 5);

  return (
    <Card className="bg-white/80 border-slate-200/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
          <Star className="w-5 h-5 text-slate-400" />
          <span>Deliverables</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-5">
            {items.map((item, index) => (
              <motion.li 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {item.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm text-slate-500">
                    {item.due_date ? format(new Date(item.due_date), 'MMM dd') : 'N/A'}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
             <Star className="w-12 h-12 bg-slate-100 text-slate-400 p-3 rounded-full mx-auto" />
            <p className="mt-4 font-medium text-slate-700">No deliverables yet</p>
            <p className="text-sm text-slate-500">Upcoming and completed items will appear here.</p>
          </div>
        )}
        <Button 
          variant="outline" 
          className="w-full mt-6 bg-white"
          onClick={() => navigate(createPageUrl('Deliverables'))}
        >
          View All Deliverables
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}