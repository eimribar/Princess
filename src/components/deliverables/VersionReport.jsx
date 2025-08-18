import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  X, 
  Download,
  FileText,
  FileSpreadsheet,
  BookOpen,
  Calendar,
  BarChart3,
  Users,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function VersionReport({ 
  deliverable,
  versions = [],
  comments = [],
  isOpen, 
  onClose 
}) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [reportType, setReportType] = useState('full');
  const [includeComments, setIncludeComments] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !deliverable) return null;

  const getVersionStats = () => {
    const total = versions.length;
    const approved = versions.filter(v => v.status === 'approved').length;
    const pending = versions.filter(v => v.status === 'pending_approval').length;
    const declined = versions.filter(v => v.status === 'declined').length;
    const drafts = versions.filter(v => v.status === 'draft').length;

    return { total, approved, pending, declined, drafts };
  };

  const getTimeToApproval = () => {
    const approvedVersions = versions.filter(v => v.status === 'approved' && v.uploaded_date && v.approval_date);
    if (approvedVersions.length === 0) return null;

    const totalDays = approvedVersions.reduce((sum, v) => {
      const upload = new Date(v.uploaded_date);
      const approval = new Date(v.approval_date);
      const days = (approval - upload) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return (totalDays / approvedVersions.length).toFixed(1);
  };

  const generateCSVData = () => {
    const headers = [
      'Version',
      'Status', 
      'File Name',
      'File Size (MB)',
      'Uploaded Date',
      'Uploaded By',
      'Approval Date',
      'Approved By',
      'Iteration Count',
      'Changes Summary',
      'Feedback'
    ];

    const rows = versions.map(version => [
      version.version_number || '',
      version.status || '',
      version.file_name || '',
      version.file_size ? (version.file_size / 1024 / 1024).toFixed(2) : '',
      version.uploaded_date ? format(new Date(version.uploaded_date), 'yyyy-MM-dd') : '',
      version.uploaded_by || '',
      version.approval_date ? format(new Date(version.approval_date), 'yyyy-MM-dd') : '',
      version.approved_by || '',
      version.iteration_count || '',
      version.changes_summary || '',
      version.feedback || ''
    ]);

    return [headers, ...rows];
  };

  const generateHTMLReport = () => {
    const stats = getVersionStats();
    const avgApprovalTime = getTimeToApproval();

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Version Report - ${deliverable.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 40px; color: #374151; }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; color: #111827; margin: 0; }
        .subtitle { color: #6b7280; margin: 5px 0 0 0; }
        .section { margin: 30px 0; }
        .section-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #3b82f6; }
        .stat-label { color: #6b7280; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .status-approved { color: #059669; background: #ecfdf5; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status-pending { color: #d97706; background: #fffbeb; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status-declined { color: #dc2626; background: #fef2f2; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status-draft { color: #6b7280; background: #f9fafb; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .comment { background: #f9fafb; border-left: 4px solid #e5e7eb; padding: 15px; margin: 10px 0; }
        .comment-author { font-weight: 600; color: #111827; }
        .comment-date { color: #6b7280; font-size: 12px; }
        .generated-note { color: #6b7280; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${deliverable.name}</h1>
        <p class="subtitle">Version Control Report - Generated ${format(new Date(), 'MMM d, yyyy')}</p>
    </div>

    ${includeMetrics ? `
    <div class="section">
        <h2 class="section-title">Project Overview</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">Total Versions</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.approved}</div>
                <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.pending}</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${avgApprovalTime || 'N/A'}</div>
                <div class="stat-label">Avg. Approval Time (days)</div>
            </div>
        </div>
    </div>
    ` : ''}

    ${includeTimeline ? `
    <div class="section">
        <h2 class="section-title">Version Timeline</h2>
        <table>
            <thead>
                <tr>
                    <th>Version</th>
                    <th>Status</th>
                    <th>File</th>
                    <th>Uploaded</th>
                    <th>Size</th>
                    <th>Changes</th>
                </tr>
            </thead>
            <tbody>
                ${versions.map(version => `
                    <tr>
                        <td>${version.version_number}</td>
                        <td><span class="status-${version.status}">${version.status.replace('_', ' ').toUpperCase()}</span></td>
                        <td>${version.file_name || 'N/A'}</td>
                        <td>${version.uploaded_date ? format(new Date(version.uploaded_date), 'MMM d, yyyy') : 'N/A'}</td>
                        <td>${version.file_size ? (version.file_size / 1024 / 1024).toFixed(1) + ' MB' : 'N/A'}</td>
                        <td>${version.changes_summary || 'No description'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${includeComments && comments.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Activity Log</h2>
        ${comments.slice(0, 10).map(comment => `
            <div class="comment">
                <div class="comment-author">${comment.author_name}</div>
                <div class="comment-date">${format(new Date(comment.created_date), 'MMM d, yyyy h:mm a')}</div>
                <p>${comment.content}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="generated-note">
        Report generated by Princess Project Management System<br>
        Generated on ${format(new Date(), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
    </div>
</body>
</html>`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'csv') {
        const csvData = generateCSVData();
        const csvContent = csvData.map(row => 
          row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${deliverable.name.replace(/[^a-z0-9]/gi, '_')}_version_report.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } else if (exportFormat === 'html') {
        const htmlContent = generateHTMLReport();
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${deliverable.name.replace(/[^a-z0-9]/gi, '_')}_version_report.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } else if (exportFormat === 'json') {
        const reportData = {
          deliverable: {
            id: deliverable.id,
            name: deliverable.name,
            type: deliverable.type,
            status: deliverable.status,
            current_version: deliverable.current_version
          },
          versions: versions,
          comments: includeComments ? comments : [],
          stats: includeMetrics ? getVersionStats() : null,
          generated_at: new Date().toISOString(),
          generated_by: 'Princess Project Management System'
        };
        
        const jsonContent = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${deliverable.name.replace(/[^a-z0-9]/gi, '_')}_version_report.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Close modal after successful export
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Export failed:', error);
    }
    
    setIsExporting(false);
  };

  const stats = getVersionStats();

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
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Export Version Report</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Generate and download detailed version analytics
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

            <CardContent className="p-6 space-y-6">
              {/* Quick Stats Preview */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <div className="text-xs text-gray-600">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
                  <div className="text-xs text-gray-600">Declined</div>
                </div>
              </div>

              {/* Export Format */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Export Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-600" />
                        HTML Report (Recommended)
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        CSV Spreadsheet
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileDown className="w-4 h-4 text-blue-600" />
                        JSON Data
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Complete Report</SelectItem>
                    <SelectItem value="summary">Summary Only</SelectItem>
                    <SelectItem value="timeline">Timeline Only</SelectItem>
                    <SelectItem value="metrics">Metrics Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Include Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Include in Report</label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="metrics" 
                    checked={includeMetrics}
                    onCheckedChange={setIncludeMetrics}
                  />
                  <label htmlFor="metrics" className="text-sm text-gray-700 cursor-pointer">
                    Metrics and Statistics
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="timeline" 
                    checked={includeTimeline}
                    onCheckedChange={setIncludeTimeline}
                  />
                  <label htmlFor="timeline" className="text-sm text-gray-700 cursor-pointer">
                    Version Timeline
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="comments" 
                    checked={includeComments}
                    onCheckedChange={setIncludeComments}
                  />
                  <label htmlFor="comments" className="text-sm text-gray-700 cursor-pointer">
                    Activity Log & Comments ({comments.length} items)
                  </label>
                </div>
              </div>

              {/* Export Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isExporting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isExporting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isExporting ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}