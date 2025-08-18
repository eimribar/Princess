import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Eye, 
  MessageSquare, 
  Share2, 
  MoreVertical,
  Check,
  X,
  Clock,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingActions({ 
  deliverable, 
  onVersionUpload, 
  onFilePreview, 
  onFileDownload,
  onApprovalAction,
  onAddComment,
  className = '' 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickComment, setShowQuickComment] = useState(false);
  const [quickComment, setQuickComment] = useState('');

  const versions = deliverable?.versions || [];
  const latestVersion = versions[versions.length - 1];
  const hasPendingApproval = versions.some(v => v.status === 'pending_approval');

  const canUploadNewVersion = () => {
    if (versions.length === 0) return true;
    const latest = versions[versions.length - 1];
    return latest.status === 'approved' || latest.status === 'declined';
  };

  const getNextVersionNumber = () => {
    if (versions.length === 0) return 'V0';
    const latest = versions[versions.length - 1];
    if (latest.version_number === 'V0') return 'V1';
    if (latest.version_number === 'V1') return 'V2';
    return 'V3';
  };

  const handleQuickComment = () => {
    if (quickComment.trim() && onAddComment) {
      onAddComment(quickComment);
      setQuickComment('');
      setShowQuickComment(false);
    }
  };

  const actions = [
    // Upload new version
    canUploadNewVersion() && {
      icon: Upload,
      label: `Upload ${getNextVersionNumber()}`,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => onVersionUpload && onVersionUpload(getNextVersionNumber())
    },
    // Preview latest
    latestVersion && {
      icon: Eye,
      label: 'Preview Latest',
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => onFilePreview && onFilePreview(latestVersion)
    },
    // Download latest
    latestVersion && {
      icon: Download,
      label: 'Download Latest',
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => onFileDownload && onFileDownload(latestVersion)
    },
    // Quick comment
    {
      icon: MessageSquare,
      label: 'Quick Comment',
      color: 'bg-orange-600 hover:bg-orange-700',
      onClick: () => setShowQuickComment(true)
    },
    // Quick approve (if pending)
    hasPendingApproval && {
      icon: Check,
      label: 'Quick Approve',
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => {
        const pendingVersion = versions.find(v => v.status === 'pending_approval');
        if (pendingVersion && onApprovalAction) {
          onApprovalAction(pendingVersion.id, 'approve', 'Quick approval via floating actions');
        }
      }
    }
  ].filter(Boolean);

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        {/* Quick Comment Modal */}
        <AnimatePresence>
          {showQuickComment && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 mb-2"
            >
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Add Quick Comment</h4>
                <textarea
                  value={quickComment}
                  onChange={(e) => setQuickComment(e.target.value)}
                  placeholder="Type your comment..."
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleQuickComment}
                    disabled={!quickComment.trim()}
                    size="sm"
                    className="flex-1"
                  >
                    Post Comment
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowQuickComment(false);
                      setQuickComment('');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-col items-end gap-3">
          <AnimatePresence>
            {isExpanded && actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  x: 0,
                  transition: { delay: index * 0.1 }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8, 
                  x: 20,
                  transition: { delay: (actions.length - index - 1) * 0.05 }
                }}
                className="flex items-center gap-3"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge variant="secondary" className="px-3 py-1 text-sm bg-white shadow-sm">
                    {action.label}
                  </Badge>
                </motion.div>
                <Button
                  onClick={() => {
                    action.onClick();
                    setIsExpanded(false);
                  }}
                  className={`w-12 h-12 rounded-full shadow-lg ${action.color} text-white border-2 border-white`}
                >
                  <action.icon className="w-5 h-5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Main Toggle Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-14 h-14 rounded-full shadow-xl text-white border-2 border-white transition-all duration-200 ${
                isExpanded 
                  ? 'bg-red-600 hover:bg-red-700 rotate-45' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isExpanded ? (
                <X className="w-6 h-6" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </Button>
          </motion.div>
        </div>

        {/* Status Indicators */}
        {!isExpanded && (
          <div className="absolute -top-2 -left-2 flex flex-col gap-1">
            {hasPendingApproval && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-sm"
                title="Pending Approval"
              />
            )}
            {latestVersion && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"
                title="Has Files"
              />
            )}
          </div>
        )}
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-20 z-30"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}