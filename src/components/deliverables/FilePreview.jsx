import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  FileText,
  Image,
  FileVideo,
  File,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FilePreview({ 
  file, 
  isOpen, 
  onClose, 
  onDownload 
}) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!file || !isOpen) return null;

  const getFileType = (url, fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension) || mimeType.startsWith('image/')) {
      return 'image';
    }
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension) || mimeType.startsWith('video/')) {
      return 'video';
    }
    if (['pdf'].includes(extension) || mimeType === 'application/pdf') {
      return 'pdf';
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension) || mimeType.includes('text') || mimeType.includes('word')) {
      return 'document';
    }
    return 'other';
  };

  const fileType = getFileType(file.file_url, file.file_name);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
    } else {
      // Fallback download
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            <img 
              src={file.file_url} 
              alt={file.file_name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)` 
              }}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex items-center justify-center h-full">
            <video 
              src={file.file_url} 
              controls 
              className="max-w-full max-h-full"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'pdf':
        return (
          <div className="w-full h-full">
            <iframe 
              src={file.file_url} 
              className="w-full h-full border-0"
              title={file.file_name}
            />
          </div>
        );
      
      case 'document':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <FileText className="w-24 h-24 text-gray-400" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{file.file_name}</h3>
              <p className="text-gray-600 mt-2">
                Document preview not available. Click download to view the file.
              </p>
              <div className="mt-4 space-x-3">
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download to View
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(file.file_url, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <File className="w-24 h-24 text-gray-400" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{file.file_name}</h3>
              <p className="text-gray-600 mt-2">
                Preview not available for this file type.
              </p>
              <Button onClick={handleDownload} className="mt-4 gap-2">
                <Download className="w-4 h-4" />
                Download File
              </Button>
            </div>
          </div>
        );
    }
  };

  const showZoomControls = fileType === 'image' || fileType === 'video';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50"
        onClick={onClose}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-white font-semibold">{file.file_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-white border-white/30">
                  {file.version_number}
                </Badge>
                {file.file_size && (
                  <span className="text-white/70 text-sm">
                    {(file.file_size / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            {showZoomControls && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(Math.max(25, zoom - 25));
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-white text-sm min-w-[50px] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(Math.min(200, zoom + 25));
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {/* Rotate for images */}
            {fileType === 'image' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setRotation(rotation + 90);
                }}
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            )}
            
            {/* Download */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Preview Content */}
        <div 
          className="flex-1 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {renderPreview()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}