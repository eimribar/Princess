import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileText,
  GitCommit,
  ArrowRight,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function VersionControl({ deliverable, onVersionUpload, onApprovalAction }) {
  const versions = deliverable?.versions || [];
  const currentVersion = deliverable?.current_version;
  
  const getVersionStatus = (version) => {
    switch (version.status) {
      case 'approved':
        return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 };
      case 'submitted':
      case 'pending_approval':
        return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'declined':
        return { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle };
      case 'draft':
      default:
        return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: FileText };
    }
  };

  const getNextVersionNumber = () => {
    if (versions.length === 0) return 'V0';
    const latestVersion = versions[versions.length - 1];
    if (latestVersion.version_number === 'V0') return 'V1';
    if (latestVersion.version_number === 'V1') return 'V2';
    return 'V3';
  };

  const canUploadNewVersion = () => {
    if (versions.length === 0) return true;
    const latestVersion = versions[versions.length - 1];
    return latestVersion.status === 'approved' || latestVersion.status === 'declined';
  };

  const getVersionProgress = () => {
    if (versions.length === 0) return 0;
    const approvedVersions = versions.filter(v => v.status === 'approved').length;
    return (approvedVersions / Math.min(versions.length, 3)) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-gray-600" />
              Version Control
            </CardTitle>
            <div className="flex items-center gap-3">
              {currentVersion && (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                  Current: {currentVersion}
                </Badge>
              )}
              <Button 
                onClick={() => onVersionUpload && onVersionUpload(getNextVersionNumber())}
                disabled={!canUploadNewVersion()}
                className="gap-2"
                size="sm"
              >
                <Upload className="w-4 h-4" />
                Upload {getNextVersionNumber()}
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Approval Progress</span>
              <span>{Math.round(getVersionProgress())}%</span>
            </div>
            <Progress value={getVersionProgress()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Version Timeline */}
      {versions.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versions.map((version, index) => {
                const statusConfig = getVersionStatus(version);
                const StatusIcon = statusConfig.icon;
                const isLatest = index === versions.length - 1;
                
                return (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative border rounded-lg p-4 ${
                      isLatest ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Version Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${statusConfig.color.replace('text-', 'text-').replace('border-', 'bg-')}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {version.version_number}
                            {isLatest && <span className="text-blue-600 ml-2">(Latest)</span>}
                          </h4>
                          <Badge variant="outline" className={statusConfig.color}>
                            {version.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {version.file_url && (
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        )}
                        {version.status === 'pending_approval' && onApprovalAction && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => onApprovalAction(version.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              Approve
                            </Button>
                            <Button 
                              onClick={() => onApprovalAction(version.id, 'decline')}
                              variant="outline"
                              size="sm"
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Version Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {version.uploaded_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Uploaded {format(new Date(version.uploaded_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      
                      {version.uploaded_by && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{version.uploaded_by}</span>
                        </div>
                      )}
                      
                      {version.file_size && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>{(version.file_size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      )}
                    </div>

                    {/* Changes Summary */}
                    {version.changes_summary && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Changes:</strong> {version.changes_summary}
                        </p>
                      </div>
                    )}

                    {/* Feedback */}
                    {version.feedback && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-sm text-amber-800 font-medium">Feedback</p>
                            <p className="text-sm text-amber-700 mt-1">{version.feedback}</p>
                            {version.feedback_date && (
                              <p className="text-xs text-amber-600 mt-2">
                                {format(new Date(version.feedback_date), 'MMM d, yyyy')} by {version.feedback_by}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Connection Line to Next Version */}
                    {index < versions.length - 1 && (
                      <div className="absolute left-6 -bottom-4 w-0.5 h-8 bg-gray-300"></div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Versions State */}
      {versions.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Versions Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Upload the first version of this deliverable to start the review and approval process.
            </p>
            <Button 
              onClick={() => onVersionUpload && onVersionUpload('V0')}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload V0 (Draft)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}