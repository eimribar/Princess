import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Image,
  FileVideo,
  Archive,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VersionUpload({ 
  deliverable, 
  versionNumber, 
  onUpload, 
  onClose, 
  isUploading = false 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [changesSummary, setChangesSummary] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const allowedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'video/mp4',
    'video/quicktime',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return Image;
    if (fileType?.startsWith('video/')) return FileVideo;
    if (fileType?.includes('zip')) return Archive;
    return FileText;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    if (!allowedFileTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, images, videos, or documents.';
    }
    if (file.size > maxFileSize) {
      return 'File size too large. Maximum size is 50MB.';
    }
    return '';
  };

  const handleFileSelect = (file) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError('');
    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !changesSummary.trim()) {
      setValidationError('Please select a file and provide a summary of changes.');
      return;
    }

    try {
      // Simulate file upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const versionData = {
        id: Date.now().toString(),
        version_number: versionNumber,
        status: 'not_started',
        file_url: URL.createObjectURL(selectedFile), // In real app, this would be the uploaded file URL
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        uploaded_date: new Date().toISOString(),
        uploaded_by: 'Current User',
        changes_summary: changesSummary,
        iteration_count: deliverable.versions ? deliverable.versions.length + 1 : 1
      };

      if (onUpload) {
        await onUpload(versionData);
      }

      // Reset form
      setSelectedFile(null);
      setChangesSummary('');
      setUploadProgress(0);
      
    } catch (error) {
      setValidationError('Failed to upload file. Please try again.');
    }
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile.type) : File;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none h-full flex flex-col">
            <CardHeader className="border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Upload {versionNumber}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Badge className="w-fit bg-blue-50 text-blue-700 border-blue-200">
                {deliverable?.name}
              </Badge>
            </CardHeader>

            <CardContent className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* File Upload Area */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">
                  Upload File *
                </label>
                
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : selectedFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                    accept={allowedFileTypes.join(',')}
                  />
                  
                  {selectedFile ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <FileIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, Images, Videos, Documents (max 50MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Changes Summary */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Summary of Changes *
                </label>
                <Textarea
                  value={changesSummary}
                  onChange={(e) => setChangesSummary(e.target.value)}
                  placeholder="Describe what changes were made in this version..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-gray-500">
                  Briefly explain what's new or different in this version
                </p>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {validationError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Version Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Version Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Version:</span>
                    <span className="ml-2 font-medium">{versionNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium">Draft</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Iteration:</span>
                    <span className="ml-2 font-medium">
                      #{(deliverable?.versions?.length || 0) + 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium capitalize">{deliverable?.type}</span>
                  </div>
                </div>
              </div>

            </CardContent>
            
            {/* Action Buttons - Fixed at bottom */}
            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-200 flex-shrink-0 bg-white">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || !changesSummary.trim() || isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {versionNumber}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}