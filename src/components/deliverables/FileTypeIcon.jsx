import React from 'react';
import { 
  FileText, 
  Image, 
  FileVideo, 
  File, 
  FileSpreadsheet,
  Presentation,
  Archive,
  Code,
  Music,
  FileImage
} from 'lucide-react';

export default function FileTypeIcon({ fileName, fileType, size = 'md', className = '' }) {
  const getFileTypeInfo = (fileName, fileType) => {
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    const mimeType = fileType || '';
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(extension) || mimeType.startsWith('image/')) {
      return {
        icon: FileImage,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Image'
      };
    }
    
    // Videos
    if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(extension) || mimeType.startsWith('video/')) {
      return {
        icon: FileVideo,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        label: 'Video'
      };
    }
    
    // PDFs and Documents
    if (['pdf'].includes(extension) || mimeType === 'application/pdf') {
      return {
        icon: FileText,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'PDF'
      };
    }
    
    // Word Documents
    if (['doc', 'docx', 'rtf'].includes(extension) || mimeType.includes('word')) {
      return {
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Document'
      };
    }
    
    // Spreadsheets
    if (['xls', 'xlsx', 'csv'].includes(extension) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return {
        icon: FileSpreadsheet,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Spreadsheet'
      };
    }
    
    // Presentations
    if (['ppt', 'pptx', 'key'].includes(extension) || mimeType.includes('presentation')) {
      return {
        icon: Presentation,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Presentation'
      };
    }
    
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
      return {
        icon: Archive,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'Archive'
      };
    }
    
    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(extension)) {
      return {
        icon: Code,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        label: 'Code'
      };
    }
    
    // Audio
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension) || mimeType.startsWith('audio/')) {
      return {
        icon: Music,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        label: 'Audio'
      };
    }
    
    // Text files
    if (['txt', 'md', 'readme'].includes(extension) || mimeType.startsWith('text/')) {
      return {
        icon: FileText,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        label: 'Text'
      };
    }
    
    // Default
    return {
      icon: File,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      label: 'File'
    };
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-8 h-8',
          icon: 'w-4 h-4'
        };
      case 'lg':
        return {
          container: 'w-16 h-16',
          icon: 'w-8 h-8'
        };
      case 'xl':
        return {
          container: 'w-20 h-20',
          icon: 'w-10 h-10'
        };
      case 'md':
      default:
        return {
          container: 'w-12 h-12',
          icon: 'w-6 h-6'
        };
    }
  };

  const fileInfo = getFileTypeInfo(fileName, fileType);
  const sizeClasses = getSizeClasses(size);
  const IconComponent = fileInfo.icon;

  return (
    <div className={`flex items-center justify-center ${sizeClasses.container} ${fileInfo.bgColor} ${fileInfo.borderColor} border rounded-lg ${className}`}>
      <IconComponent className={`${sizeClasses.icon} ${fileInfo.color}`} />
    </div>
  );
}

// Export individual components for specific use cases
export function FileTypeLabel({ fileName, fileType, className = '' }) {
  const getFileTypeInfo = (fileName, fileType) => {
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    const mimeType = fileType || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(extension) || mimeType.startsWith('image/')) {
      return { label: 'Image', color: 'text-green-600 bg-green-50 border-green-200' };
    }
    if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(extension) || mimeType.startsWith('video/')) {
      return { label: 'Video', color: 'text-purple-600 bg-purple-50 border-purple-200' };
    }
    if (['pdf'].includes(extension) || mimeType === 'application/pdf') {
      return { label: 'PDF', color: 'text-red-600 bg-red-50 border-red-200' };
    }
    if (['doc', 'docx', 'rtf'].includes(extension) || mimeType.includes('word')) {
      return { label: 'Document', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    }
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return { label: 'Spreadsheet', color: 'text-green-600 bg-green-50 border-green-200' };
    }
    if (['ppt', 'pptx', 'key'].includes(extension)) {
      return { label: 'Presentation', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
      return { label: 'Archive', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    }
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java'].includes(extension)) {
      return { label: 'Code', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
    }
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension) || mimeType.startsWith('audio/')) {
      return { label: 'Audio', color: 'text-pink-600 bg-pink-50 border-pink-200' };
    }
    return { label: 'File', color: 'text-gray-600 bg-gray-50 border-gray-200' };
  };

  const fileInfo = getFileTypeInfo(fileName, fileType);
  
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${fileInfo.color} ${className}`}>
      {fileInfo.label}
    </span>
  );
}