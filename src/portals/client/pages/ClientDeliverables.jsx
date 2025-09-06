import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Image,
  Video,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Star,
  Upload,
  ExternalLink,
  Maximize2,
  Filter,
  Search,
  History,
  CheckCheck,
  Info,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

/**
 * Premium Client Deliverables
 * 
 * Approval-focused interface with exceptional UX for reviewing and approving deliverables.
 * Features:
 * - Beautiful preview gallery with lightbox
 * - Smooth approval workflows
 * - Guided feedback forms
 * - Version comparison
 * - Quick actions
 */

const ClientDeliverables = () => {
  const { toast } = useToast();
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('general');

  // Mock deliverables data
  const [deliverables] = useState([
    {
      id: 1,
      name: 'Logo Design',
      description: 'Primary brand logo with variations for different use cases',
      type: 'creative',
      status: 'pending_approval',
      version: 'V2',
      versions: ['V0', 'V1', 'V2'],
      currentIteration: 2,
      maxIterations: 3,
      submittedBy: 'John Doe',
      submittedDate: new Date('2024-03-10'),
      dueDate: new Date('2024-03-15'),
      files: [
        { name: 'logo-primary.svg', size: '245 KB', type: 'image/svg+xml' },
        { name: 'logo-variations.pdf', size: '1.2 MB', type: 'application/pdf' }
      ],
      preview: 'https://via.placeholder.com/800x600/4F46E5/ffffff?text=Logo+Design',
      category: 'Brand Identity',
      priority: 'high',
      hasChanges: true,
      changesSummary: 'Updated color palette based on your feedback. Added horizontal variation.'
    },
    {
      id: 2,
      name: 'Brand Strategy Document',
      description: 'Comprehensive brand positioning and messaging framework',
      type: 'strategy',
      status: 'pending_feedback',
      version: 'V1',
      versions: ['V0', 'V1'],
      currentIteration: 1,
      maxIterations: 2,
      submittedBy: 'Sarah Kim',
      submittedDate: new Date('2024-03-08'),
      dueDate: new Date('2024-03-20'),
      files: [
        { name: 'brand-strategy.pdf', size: '3.4 MB', type: 'application/pdf' },
        { name: 'executive-summary.docx', size: '156 KB', type: 'application/docx' }
      ],
      preview: null,
      category: 'Strategy',
      priority: 'medium',
      hasChanges: false
    },
    {
      id: 3,
      name: 'Color Palette',
      description: 'Primary and secondary color schemes with usage guidelines',
      type: 'creative',
      status: 'approved',
      version: 'V2',
      versions: ['V0', 'V1', 'V2'],
      currentIteration: 3,
      maxIterations: 3,
      submittedBy: 'Mike Brown',
      submittedDate: new Date('2024-03-05'),
      approvedDate: new Date('2024-03-07'),
      approvedBy: 'You',
      files: [
        { name: 'color-palette.ase', size: '12 KB', type: 'application/ase' },
        { name: 'color-guide.pdf', size: '890 KB', type: 'application/pdf' }
      ],
      preview: 'https://via.placeholder.com/800x400/10B981/ffffff?text=Color+Palette',
      category: 'Visual Identity',
      priority: 'low',
      hasChanges: false
    }
  ]);

  // Filter deliverables based on search and filters
  const filteredDeliverables = deliverables.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || d.type === filterType;
    const matchesTab = activeTab === 'all' ||
                       (activeTab === 'pending' && (d.status === 'pending_approval' || d.status === 'pending_feedback')) ||
                       (activeTab === 'approved' && d.status === 'approved') ||
                       (activeTab === 'declined' && d.status === 'declined');
    return matchesSearch && matchesFilter && matchesTab;
  });

  // Get status configuration
  const getStatusConfig = (status) => {
    const configs = {
      pending_approval: {
        label: 'Awaiting Approval',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        actionLabel: 'Review & Approve',
        actionColor: 'bg-gradient-to-r from-yellow-500 to-orange-500'
      },
      pending_feedback: {
        label: 'Needs Feedback',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: MessageSquare,
        actionLabel: 'Provide Feedback',
        actionColor: 'bg-gradient-to-r from-blue-500 to-indigo-500'
      },
      approved: {
        label: 'Approved',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle2,
        actionLabel: 'Download Files',
        actionColor: 'bg-gradient-to-r from-green-500 to-emerald-500'
      },
      declined: {
        label: 'Declined',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        actionLabel: 'View Feedback',
        actionColor: 'bg-gradient-to-r from-red-500 to-pink-500'
      }
    };
    return configs[status] || configs.pending_approval;
  };

  // Handle approval
  const handleApproval = () => {
    if (!selectedDeliverable) return;

    toast({
      title: "Deliverable Approved! 🎉",
      description: `${selectedDeliverable.name} has been approved successfully.`,
      className: "bg-green-50 border-green-200"
    });

    setShowApprovalDialog(false);
    setSelectedDeliverable(null);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback before submitting.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Feedback Submitted",
      description: "Your feedback has been sent to the team.",
      className: "bg-blue-50 border-blue-200"
    });

    setShowFeedbackDialog(false);
    setFeedback('');
    setSelectedDeliverable(null);
  };

  // Deliverable card component
  const DeliverableCard = ({ deliverable }) => {
    const statusConfig = getStatusConfig(deliverable.status);
    const StatusIcon = statusConfig.icon;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -4 }}
        className="group"
      >
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200">
          {/* Preview Image */}
          {deliverable.preview && (
            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              <img
                src={deliverable.preview}
                alt={deliverable.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Quick Actions Overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDeliverable(deliverable);
                    setShowPreviewDialog(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle download
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>

              {/* Priority Badge */}
              {deliverable.priority === 'high' && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-red-500 text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    High Priority
                  </Badge>
                </div>
              )}

              {/* Changes Indicator */}
              {deliverable.hasChanges && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-blue-500 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    New Changes
                  </Badge>
                </div>
              )}
            </div>
          )}

          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {deliverable.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {deliverable.description}
                </p>
              </div>
              <Badge variant="outline" className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{deliverable.submittedBy}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDistanceToNow(deliverable.submittedDate, { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <History className="w-4 h-4" />
                <span>Version {deliverable.version}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{deliverable.files.length} files</span>
              </div>
            </div>

            {/* Version Progress */}
            {deliverable.status !== 'approved' && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Iteration {deliverable.currentIteration} of {deliverable.maxIterations}</span>
                  <span>{deliverable.maxIterations - deliverable.currentIteration} remaining</span>
                </div>
                <div className="flex gap-1">
                  {[...Array(deliverable.maxIterations)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 flex-1 rounded-full",
                        i < deliverable.currentIteration
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                          : "bg-gray-200"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Changes Summary */}
            {deliverable.hasChanges && deliverable.changesSummary && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-blue-900 mb-1">What's Changed:</p>
                <p className="text-xs text-blue-700">{deliverable.changesSummary}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {deliverable.status === 'pending_approval' && (
                <>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    onClick={() => {
                      setSelectedDeliverable(deliverable);
                      setShowApprovalDialog(true);
                    }}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setSelectedDeliverable(deliverable);
                      setShowFeedbackDialog(true);
                    }}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </>
              )}
              
              {deliverable.status === 'pending_feedback' && (
                <Button
                  className={cn("flex-1", statusConfig.actionColor, "text-white")}
                  onClick={() => {
                    setSelectedDeliverable(deliverable);
                    setShowFeedbackDialog(true);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {statusConfig.actionLabel}
                </Button>
              )}

              {deliverable.status === 'approved' && (
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    // Handle download
                    toast({
                      title: "Download Started",
                      description: "Your files are being prepared for download.",
                    });
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {statusConfig.actionLabel}
                </Button>
              )}
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
                <h1 className="text-3xl font-bold text-gray-900">Deliverables</h1>
                <p className="mt-2 text-gray-600">Review and approve project deliverables</p>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {deliverables.filter(d => d.status.includes('pending')).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {deliverables.filter(d => d.status === 'approved').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {deliverables.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search deliverables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="strategy">Strategy</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all" className="relative">
              All
              <Badge className="ml-2 text-xs" variant="secondary">
                {deliverables.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending
              <Badge className="ml-2 text-xs bg-yellow-100 text-yellow-800">
                {deliverables.filter(d => d.status.includes('pending')).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <Badge className="ml-2 text-xs bg-green-100 text-green-800">
                {deliverables.filter(d => d.status === 'approved').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="declined">
              Declined
              <Badge className="ml-2 text-xs bg-red-100 text-red-800">
                {deliverables.filter(d => d.status === 'declined').length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Deliverables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDeliverables.map(deliverable => (
              <DeliverableCard key={deliverable.id} deliverable={deliverable} />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredDeliverables.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FolderKanban className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliverables found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Approve Deliverable
            </DialogTitle>
            <DialogDescription>
              You're about to approve "{selectedDeliverable?.name}". This action is final and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedDeliverable && (
            <div className="space-y-4">
              {/* Preview */}
              {selectedDeliverable.preview && (
                <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedDeliverable.preview}
                    alt={selectedDeliverable.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Version</p>
                  <p className="font-medium">{selectedDeliverable.version}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted by</p>
                  <p className="font-medium">{selectedDeliverable.submittedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Files</p>
                  <p className="font-medium">{selectedDeliverable.files.length} files</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium">{selectedDeliverable.category}</p>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCheck className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      By approving this deliverable:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-green-700">
                      <li>• You confirm it meets your requirements</li>
                      <li>• The team will proceed to the next stage</li>
                      <li>• This version will be marked as final</li>
                      <li>• Files will be available in your Brand Assets</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              onClick={handleApproval}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve Deliverable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Provide Feedback
            </DialogTitle>
            <DialogDescription>
              Share your feedback on "{selectedDeliverable?.name}" to help the team improve.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Feedback Category */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Feedback Category
              </label>
              <Select value={feedbackCategory} onValueChange={setFeedbackCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="design">Design & Visual</SelectItem>
                  <SelectItem value="content">Content & Messaging</SelectItem>
                  <SelectItem value="technical">Technical Issues</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Feedback Options */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Quick Feedback (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Colors need adjustment',
                  'Font size too small',
                  'Missing information',
                  'Layout needs work',
                  'Content unclear',
                  'Needs more options'
                ].map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => setFeedback(prev => prev + (prev ? '\n' : '') + option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Detailed Feedback */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Detailed Feedback
              </label>
              <Textarea
                placeholder="Please describe what changes or improvements you'd like to see..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-1 min-h-[120px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about what you'd like changed. The more detail you provide, the better the team can address your needs.
              </p>
            </div>

            {/* Iteration Warning */}
            {selectedDeliverable && selectedDeliverable.currentIteration === selectedDeliverable.maxIterations && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">
                      Final Iteration
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This is the last feedback round for this deliverable. Please ensure all necessary changes are communicated.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedbackDialog(false);
                setFeedback('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              onClick={handleFeedbackSubmit}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {selectedDeliverable?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedDeliverable && (
            <div className="space-y-4">
              {/* Large Preview */}
              {selectedDeliverable.preview && (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedDeliverable.preview}
                    alt={selectedDeliverable.name}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Version Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Version:</span>
                <div className="flex gap-2">
                  {selectedDeliverable.versions.map((version) => (
                    <Button
                      key={version}
                      variant={version === selectedDeliverable.version ? "default" : "outline"}
                      size="sm"
                    >
                      {version}
                    </Button>
                  ))}
                </div>
              </div>

              {/* File List */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Files</h4>
                <div className="space-y-2">
                  {selectedDeliverable.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDeliverables;