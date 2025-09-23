import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

export default function PremiumRequiresAttention({ deliverables, outOfScopeRequests }) {
  const pendingDeliverables = deliverables?.filter(d => d.status === 'submitted') || [];
  const pendingRequests = outOfScopeRequests?.filter(r => r.status === 'pending') || [];
  const totalItems = pendingDeliverables.length + pendingRequests.length;

  if (totalItems === 0) {
    return (
      <Card className="overflow-hidden border border-gray-200 shadow-lg bg-white">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">All Clear</h3>
                <p className="text-sm text-gray-500">No items require attention</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-50 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">You're all caught up</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-lg bg-white">
      <CardHeader className="bg-gray-50 border-b border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-medium text-gray-900">Requires Attention</h3>
              <p className="text-sm text-gray-500">{totalItems} item{totalItems !== 1 ? 's' : ''} pending</p>
            </div>
          </div>
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            {totalItems}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <AnimatePresence>
          {pendingDeliverables.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-gray-100"
            >
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Pending Deliverables</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {pendingDeliverables.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {pendingDeliverables.slice(0, 3).map((deliverable, index) => (
                    <motion.div
                      key={deliverable.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-all duration-200">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {deliverable.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Awaiting approval</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 px-2 text-xs border-gray-200 hover:bg-gray-50"
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-7 px-2 hover:bg-gray-50"
                          >
                            <XCircle className="w-3.5 h-3.5 text-gray-400" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {pendingDeliverables.length > 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3"
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    >
                      View all {pendingDeliverables.length} deliverables
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {pendingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Out of Scope Requests</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {pendingRequests.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {pendingRequests.slice(0, 2).map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-all duration-200">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {request.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Pending review</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Review
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {pendingRequests.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3"
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    >
                      View all {pendingRequests.length} requests
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}