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
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import FileTypeIcon from './FileTypeIcon';
import VersionComparison from './VersionComparison';
import VersionReport from './VersionReport';

export default function VersionControl({ deliverable, onVersionUpload, onApprovalAction, onFilePreview, onFileDownload, onVersionRollback, comments = [] }) {
  const versions = deliverable?.versions || [];
  const currentVersion = deliverable?.current_version;
  const [showComparison, setShowComparison] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);
  
  const getVersionStatus = (version) => {
    switch (version.status) {
      case 'approved':
        return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 };
      case 'submitted':
        return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'declined':
        return { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle };
      case 'not_started':
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
      {/* Simplified Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
        <div className="flex items-center gap-2">
          {currentVersion && (
            <Badge variant="outline" className="text-xs">
              Current: {currentVersion}
            </Badge>
          )}
          {onVersionUpload && (
            <Button 
              onClick={() => onVersionUpload(getNextVersionNumber())}
              disabled={!canUploadNewVersion()}
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload {getNextVersionNumber()}
            </Button>
          )}
        </div>
      </div>

      {/* Simplified Version Cards */}
      {versions.length > 0 && (
        <div className="space-y-3">
          {versions.map((version, index) => {
            const isLatest = index === versions.length - 1;
            
            return (
              <div
                key={version.id}
                className={`border rounded-lg p-4 ${
                  isLatest ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      version.status === 'approved' ? 'bg-green-500' : 'bg-amber-500'
                    }`} />
                    <h4 className="font-medium text-gray-900">{version.version_number}</h4>
                    <Badge variant="outline" className="text-xs">
                      {version.status.replace('_', ' ')}
                    </Badge>
                    {version.uploaded_date && (
                      <span className="text-xs text-gray-500">
                        {format(new Date(version.uploaded_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
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
                    {version.status === 'submitted' && onApprovalAction && (
                      <>
                        <Button 
                          onClick={() => onApprovalAction(version.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => onApprovalAction(version.id, 'decline')}
                          variant="outline"
                          size="sm"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Version Comparison Modal */}
      <VersionComparison
        versions={versions}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        onFilePreview={onFilePreview}
        onFileDownload={onFileDownload}
      />

      {/* Version Report Modal */}
      <VersionReport
        deliverable={deliverable}
        versions={versions}
        comments={comments}
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />

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