import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, File, Image, Video, Music, Archive, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';

const FileList = ({ files, onDownload, onDelete, isLoading }) => {
  const { toast } = useToast();
  const [isMobile, setIsMobile] = React.useState(false);

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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownload(file.filename)}
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownload(file.filename)}
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
  );
};

export default FileList;
