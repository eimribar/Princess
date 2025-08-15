import React, { useState, useEffect } from "react";
import { OutOfScopeRequest } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function OutofScope() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await OutOfScopeRequest.list('-created_date');
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading out-of-scope requests:", error);
    }
    setIsLoading(false);
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await OutOfScopeRequest.update(requestId, { status: newStatus });
      await loadRequests(); // Refresh the list
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending_review':
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: Clock,
          label: 'Pending Review'
        };
      case 'pending_approval':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: AlertTriangle,
          label: 'Pending Approval'
        };
      case 'approved':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircle2,
          label: 'Approved'
        };
      case 'declined':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: XCircle,
          label: 'Declined'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: Clock,
          label: 'Unknown'
        };
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending_review' || r.status === 'pending_approval').length,
    approved: requests.filter(r => r.status === 'approved').length,
    declined: requests.filter(r => r.status === 'declined').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
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
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Out of Scope Requests</h1>
            <p className="text-slate-600 mt-2">Manage requests that fall outside the original project scope</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-xs text-slate-600">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.pending}</p>
                  <p className="text-xs text-slate-600">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.approved}</p>
                  <p className="text-xs text-slate-600">Approved</p>
                </div>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.declined}</p>
                  <p className="text-xs text-slate-600">Declined</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {requests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Out of Scope Requests</h3>
            <p className="text-slate-600">All requests that fall outside the project scope will appear here.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {requests.map((request, index) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                        onClick={() => setSelectedRequest(request)}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                            {request.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`${statusConfig.color} border font-medium`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            <Badge className={`${getUrgencyColor(request.urgency)} text-xs`}>
                              {request.urgency.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                        {request.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>Created {formatDistanceToNow(new Date(request.created_date), { addSuffix: true })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <User className="w-3 h-3" />
                        <span>By {request.created_by}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Request Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRequest(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedRequest.title}</h2>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const statusConfig = getStatusConfig(selectedRequest.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <Badge variant="outline" className={`${statusConfig.color} border font-medium`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        );
                      })()}
                      <Badge className={`${getUrgencyColor(selectedRequest.urgency)}`}>
                        {selectedRequest.urgency.toUpperCase()} URGENCY
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedRequest(null)}>
                    ✕
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedRequest.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-500">Created:</span>
                      <p className="text-slate-900">{format(new Date(selectedRequest.created_date), 'PPP')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Submitted by:</span>
                      <p className="text-slate-900">{selectedRequest.created_by}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Update Status</h3>
                    <Select 
                      value={selectedRequest.status} 
                      onValueChange={(newStatus) => handleStatusUpdate(selectedRequest.id, newStatus)}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}