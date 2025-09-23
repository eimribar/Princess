import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/SupabaseUserContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Download,
  ChevronRight,
  Calendar,
  Star,
  Zap,
  BarChart3
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter, addDays } from 'date-fns';

export default function ClientApprovalDashboard({ deliverables = [], onApprove, onDecline, onBulkAction }) {
  const navigate = useNavigate();
  const { user } = useUser();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [filterPriority, setFilterPriority] = useState('all');

  // Filter deliverables by status
  const pendingDeliverables = deliverables.filter(d => 
    d.status === 'submitted'
  );
  
  const approvedToday = deliverables.filter(d => {
    const approvedDate = d.approved_at ? new Date(d.approved_at) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.status === 'approved' && approvedDate && approvedDate >= today;
  });

  const declinedToday = deliverables.filter(d => {
    const declinedDate = d.updated_at ? new Date(d.updated_at) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.status === 'declined' && declinedDate && declinedDate >= today;
  });

  // Prioritize deliverables
  const getPriority = (deliverable) => {
    const deadline = deliverable.adjusted_deadline || deliverable.original_deadline;
    if (!deadline) return 'normal';
    
    const daysUntilDeadline = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline <= 1) return 'urgent';
    if (daysUntilDeadline <= 3) return 'high';
    if (deliverable.current_iteration >= 2) return 'high';
    return 'normal';
  };

  const sortedPending = [...pendingDeliverables].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2 };
    const aPriority = getPriority(a);
    const bPriority = getPriority(b);
    
    if (filterPriority !== 'all') {
      if (aPriority !== filterPriority && bPriority === filterPriority) return 1;
      if (aPriority === filterPriority && bPriority !== filterPriority) return -1;
    }
    
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });

  const handleSelectAll = () => {
    if (selectedItems.size === sortedPending.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(sortedPending.map(d => d.id)));
    }
  };

  const handleSelect = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBatchApprove = async () => {
    if (selectedItems.size === 0) return;
    
    if (onBulkAction) {
      await onBulkAction('approve', Array.from(selectedItems));
    }
    setSelectedItems(new Set());
  };

  const handleBatchDecline = async () => {
    if (selectedItems.size === 0) return;
    
    if (onBulkAction) {
      await onBulkAction('decline', Array.from(selectedItems));
    }
    setSelectedItems(new Set());
  };

  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Clock className="w-5 h-5 text-amber-600" />
            <Badge className="bg-amber-100 text-amber-700">Action Required</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-900">{pendingDeliverables.length}</div>
          <p className="text-sm text-amber-700">Pending Approval</p>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{approvedToday.length}</div>
          <p className="text-sm text-green-700">Approved Today</p>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <XCircle className="w-5 h-5 text-red-600" />
            <FileText className="w-4 h-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">{declinedToday.length}</div>
          <p className="text-sm text-red-700">Changes Requested</p>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">
            {Math.round((approvedToday.length / (approvedToday.length + declinedToday.length || 1)) * 100)}%
          </div>
          <p className="text-sm text-blue-700">Approval Rate</p>
        </CardContent>
      </Card>
    </div>
  );

  const PriorityBadge = ({ priority }) => {
    const config = {
      urgent: { color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
      high: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Zap },
      normal: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock }
    };

    const { color, icon: Icon } = config[priority] || config.normal;

    return (
      <Badge className={`${color} gap-1`}>
        <Icon className="w-3 h-3" />
        {priority}
      </Badge>
    );
  };

  const DeliverableCard = ({ deliverable, isSelected, onSelect }) => {
    const priority = getPriority(deliverable);
    const deadline = deliverable.adjusted_deadline || deliverable.original_deadline;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-lg p-4 hover:shadow-md transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-start gap-3">
          {user?.permissions?.canBatchApprove && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(deliverable.id)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium text-gray-900">{deliverable.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{deliverable.description}</p>
              </div>
              <PriorityBadge priority={priority} />
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {deadline ? format(new Date(deadline), 'MMM dd') : 'No deadline'}
              </div>
              {deliverable.current_iteration > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Iteration {deliverable.current_iteration}/{deliverable.max_iterations}
                </div>
              )}
              {deliverable.stage_name && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Stage {deliverable.stage_number}: {deliverable.stage_name}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                className="gap-1"
                onClick={() => onApprove && onApprove(deliverable)}
              >
                <ThumbsUp className="w-3 h-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => onDecline && onDecline(deliverable)}
              >
                <ThumbsDown className="w-3 h-3" />
                Request Changes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1"
                onClick={() => navigate(`/deliverables/${deliverable.id}`)}
              >
                <Eye className="w-3 h-3" />
                Review
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Dashboard</h1>
          <p className="text-gray-600">Review and approve deliverables quickly</p>
        </div>
        
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-700">
              {selectedItems.size} selected
            </span>
            <Button
              size="sm"
              variant="default"
              className="gap-1"
              onClick={handleBatchApprove}
            >
              <CheckCircle2 className="w-3 h-3" />
              Approve All
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={handleBatchDecline}
            >
              <XCircle className="w-3 h-3" />
              Decline All
            </Button>
          </div>
        )}
      </div>

      <QuickStats />

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingDeliverables.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Approved Today ({approvedToday.length})
          </TabsTrigger>
          <TabsTrigger value="declined" className="gap-2">
            <XCircle className="w-4 h-4" />
            Changes Requested ({declinedToday.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {user?.permissions?.canBatchApprove && sortedPending.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.size === sortedPending.length && sortedPending.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="text-sm border-gray-300 rounded-md"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent Only</option>
                  <option value="high">High Priority</option>
                  <option value="normal">Normal Priority</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {sortedPending.map((deliverable) => (
              <DeliverableCard
                key={deliverable.id}
                deliverable={deliverable}
                isSelected={selectedItems.has(deliverable.id)}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {sortedPending.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">All Caught Up!</h3>
              <p className="text-gray-600">No deliverables pending your approval</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 mt-6">
          {approvedToday.map((deliverable) => (
            <DeliverableCard
              key={deliverable.id}
              deliverable={deliverable}
              isSelected={false}
              onSelect={() => {}}
            />
          ))}
          {approvedToday.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-gray-600">No deliverables approved today</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="declined" className="space-y-3 mt-6">
          {declinedToday.map((deliverable) => (
            <DeliverableCard
              key={deliverable.id}
              deliverable={deliverable}
              isSelected={false}
              onSelect={() => {}}
            />
          ))}
          {declinedToday.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-gray-600">No changes requested today</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}