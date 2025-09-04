import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, File, Image, Video, Music, Archive, FileText, Eye, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';

// Get API base URL (same logic as App.js)
const getApiBase = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  return 'https://file-transfer-tool-2.onrender.com';
};

const FileList = ({ files, onDownload, onDelete, isLoading }) => {
  const { toast } = useToast();
  const [isMobile, setIsMobile] = React.useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get file icon based on mimetype
  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (mimetype?.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (mimetype?.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (mimetype?.includes('zip') || mimetype?.includes('rar') || mimetype?.includes('tar')) return <Archive className="h-5 w-5" />;
    if (mimetype?.includes('text') || mimetype?.includes('pdf') || mimetype?.includes('document')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format upload date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if file is an image
  const isImageFile = (mimetype) => {
    return mimetype && (
      mimetype.startsWith('image/') ||
      mimetype.includes('png') ||
      mimetype.includes('jpg') ||
      mimetype.includes('jpeg') ||
      mimetype.includes('gif') ||
      mimetype.includes('webp')
    );
  };

  // Handle image preview
  const handlePreview = (file) => {
    console.log('Preview clicked for file:', file);
    console.log('File mimetype:', file.mimetype);
    console.log('Is image file:', isImageFile(file.mimetype));
    if (isImageFile(file.mimetype)) {
      setPreviewImage(file);
    } else {
      toast({
        title: "Preview Not Available",
        description: "This file type cannot be previewed",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDelete = async (fileId, filename) => {
    try {
      await onDelete(fileId);
      // Success toast is now handled in App.js
    } catch (error) {
      toast({
        title: "❌ Delete Failed",
        description: `Failed to delete ${filename}. Please try again.`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No files uploaded yet</p>
            <p className="text-sm">Upload your first file to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Uploaded Files</h3>
            <span className="text-sm text-muted-foreground">{files.length} file(s)</span>
          </div>
        
        <div className="space-y-3">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    {isMobile ? (
                      // Mobile Layout - Stacked
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              {getFileIcon(file.mimetype)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.originalName}>
                              {file.originalName}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {formatFileSize(file.size)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(file.uploadDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {isImageFile(file.mimetype) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(file)}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownload(file)}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(file.id, file.originalName)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Desktop Layout - Horizontal
                      <div className="flex items-center space-x-4">
                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            {getFileIcon(file.mimetype)}
                          </div>
                        </div>
                        
                        {/* File Info */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2" title={file.originalName}>
                              {file.originalName}
                            </p>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(file.uploadDate)}
                          </p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {isImageFile(file.mimetype) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(file)}
                              className="flex items-center"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden lg:inline ml-1">Preview</span>
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownload(file)}
                            className="flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            <span className="hidden lg:inline">Download</span>
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(file.id, file.originalName)}
                            className="flex items-center"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden lg:inline ml-1">Delete</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>

    {/* Image Preview Modal */}
    <AnimatePresence>
      {previewImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-4xl max-h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {previewImage.originalName}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewImage(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Image */}
            <div className="p-4">
              <img
                src={`${getApiBase()}/api/download/${previewImage.filename}?token=${previewImage.downloadToken}`}
                alt={previewImage.originalName}
                className="max-w-full max-h-96 object-contain mx-auto rounded-lg"
                onError={(e) => {
                  console.error('Image preview failed:', e);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div 
                className="hidden text-center text-gray-500 dark:text-gray-400 py-8"
                style={{ display: 'none' }}
              >
                <p>Failed to load image preview</p>
                <p className="text-sm mt-2">Try downloading the file instead</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(previewImage.size)} • {formatDate(previewImage.uploadDate)}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownload(previewImage)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    handleDelete(previewImage.id, previewImage.originalName);
                    setPreviewImage(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default FileList;
