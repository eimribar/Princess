import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X, 
  ArrowRight,
  Download,
  Eye,
  Calendar,
  User,
  FileText,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import FileTypeIcon from './FileTypeIcon';

export default function VersionComparison({ 
  versions, 
  isOpen, 
  onClose, 
  onFilePreview, 
  onFileDownload,
  initialLeftVersion = null,
  initialRightVersion = null
}) {
  const [leftVersion, setLeftVersion] = useState(initialLeftVersion || versions[0]);
  const [rightVersion, setRightVersion] = useState(initialRightVersion || versions[versions.length - 1]);

  if (!isOpen || !versions || versions.length < 2) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 };
      case 'submitted':
        return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock };
      case 'declined':
        return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle };
      case 'not_started':
      default:
        return { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', icon: FileText };
    }
  };

  const getFileSizeChange = () => {
    if (!leftVersion?.file_size || !rightVersion?.file_size) return null;
    const diff = rightVersion.file_size - leftVersion.file_size;
    const percent = ((diff / leftVersion.file_size) * 100).toFixed(1);
    return { diff, percent };
  };

  const getVersionNumber = (version) => {
    return version?.version_number || 'Unknown';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const renderVersionCard = (version, side) => {
    const statusConfig = getStatusColor(version?.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div className="flex-1 space-y-4">
        {/* Version Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {side === 'left' ? 'Compare From' : 'Compare To'}
          </label>
          <Select 
            value={version?.id} 
            onValueChange={(id) => {
              const selectedVersion = versions.find(v => v.id === id);
              if (side === 'left') {
                setLeftVersion(selectedVersion);
              } else {
                setRightVersion(selectedVersion);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {v.version_number}
                    </Badge>
                    <span className="text-sm">{v.file_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Version Info Card */}
        {version && (
          <Card className={`${statusConfig.bg} ${statusConfig.border} border`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${statusConfig.bg} ${statusConfig.border} border`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{version.version_number}</CardTitle>
                    <Badge variant="outline" className={`${statusConfig.color} ${statusConfig.bg} ${statusConfig.border} text-xs`}>
                      {version.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {version.file_url && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onFilePreview && onFilePreview(version)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onFileDownload && onFileDownload(version)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* File Info */}
              <div className="flex items-center gap-3">
                <FileTypeIcon 
                  fileName={version.file_name} 
                  fileType={version.file_type}
                  size="sm"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{version.file_name}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(version.file_size)}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm">
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

                {version.iteration_count && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>Iteration #{version.iteration_count}</span>
                  </div>
                )}
              </div>

              {/* Changes Summary */}
              {version.changes_summary && (
                <div className="p-3 bg-white/50 rounded-lg border border-white/50">
                  <p className="text-sm font-medium text-gray-900 mb-1">Changes</p>
                  <p className="text-sm text-gray-700">{version.changes_summary}</p>
                </div>
              )}

              {/* Feedback */}
              {version.feedback && (
                <div className="p-3 bg-white/50 rounded-lg border border-white/50">
                  <p className="text-sm font-medium text-gray-900 mb-1">Feedback</p>
                  <p className="text-sm text-gray-700">{version.feedback}</p>
                  {version.feedback_date && (
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(version.feedback_date), 'MMM d, yyyy')} by {version.feedback_by}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const fileSizeChange = getFileSizeChange();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <GitCompare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Version Comparison</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Compare changes between versions
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Comparison Summary */}
              {leftVersion && rightVersion && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{leftVersion.version_number}</Badge>
                      <span className="text-gray-600">
                        {leftVersion.uploaded_date && format(new Date(leftVersion.uploaded_date), 'MMM d')}
                      </span>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{rightVersion.version_number}</Badge>
                      <span className="text-gray-600">
                        {rightVersion.uploaded_date && format(new Date(rightVersion.uploaded_date), 'MMM d')}
                      </span>
                    </div>

                    {fileSizeChange && (
                      <div className="flex items-center gap-1 ml-4 px-2 py-1 bg-white rounded border">
                        {fileSizeChange.diff > 0 ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600">+{fileSizeChange.percent}%</span>
                          </>
                        ) : fileSizeChange.diff < 0 ? (
                          <>
                            <TrendingDown className="w-3 h-3 text-red-600" />
                            <span className="text-xs text-red-600">{fileSizeChange.percent}%</span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-3 h-3 text-gray-600" />
                            <span className="text-xs text-gray-600">No change</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Side-by-side Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderVersionCard(leftVersion, 'left')}
                {renderVersionCard(rightVersion, 'right')}
              </div>

              {/* Key Differences */}
              {leftVersion && rightVersion && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Key Differences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{leftVersion.status}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{rightVersion.status}</span>
                      </div>
                    </div>
                    
                    {fileSizeChange && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Size:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{formatFileSize(leftVersion.file_size)}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">{formatFileSize(rightVersion.file_size)}</span>
                        </div>
                      </div>
                    )}

                    {leftVersion.iteration_count && rightVersion.iteration_count && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Iteration:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">#{leftVersion.iteration_count}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">#{rightVersion.iteration_count}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}