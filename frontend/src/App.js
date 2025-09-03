import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Upload, Download, Smartphone, Laptop } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { useToast } from './hooks/use-toast';
import { Toaster } from './components/ui/toast-provider';
import ServerStatus from './components/ServerStatus';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';

// API base URL - use environment variable in production, fallback to localhost for development
const API_BASE = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : `http://${window.location.hostname}:5000`);

function App() {
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { toast } = useToast();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
    fetchFiles();
  }, []);

  // Auto-refresh files every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchFiles, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        const ipResponse = await fetch(`${API_BASE}/api/ip`);
        if (ipResponse.ok) {
          const data = await ipResponse.json();
          setServerInfo(data);
          setIsServerRunning(true);
        }
      }
    } catch (error) {
      console.log('Server not running');
    }
  };

  const startServer = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/ip`);
      if (response.ok) {
        const data = await response.json();
        setServerInfo(data);
        setIsServerRunning(true);
        toast({
          title: "Server Started",
          description: "File transfer server is now running",
        });
      } else {
        throw new Error('Failed to start server');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/files`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const handleUpload = async (selectedFiles) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      toast({
        title: "Upload Complete",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      });

      // Refresh files list
      await fetchFiles();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(`${API_BASE}/api/download/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Started",
          description: `${filename} is being downloaded`,
        });
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh files list
        await fetchFiles();
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCopyLink = async () => {
    if (serverInfo?.url) {
      try {
        await navigator.clipboard.writeText(serverInfo.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Link Copied",
          description: "Server URL copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy link to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            File Transfer
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Transfer files between your phone and laptop seamlessly
          </p>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {isMobile ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
              <span>{isMobile ? 'Mobile Device' : 'Desktop Device'}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Server Status & Upload */}
          <div className="space-y-6">
            {/* Server Status */}
            <ServerStatus
              serverInfo={serverInfo}
              isServerRunning={isServerRunning}
              onCopyLink={handleCopyLink}
              copied={copied}
            />

            {/* Start Server Button (only show if server not running) */}
            <AnimatePresence>
              {!isServerRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Start File Transfer Server
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Click the button below to start the server and get connection details
                          </p>
                          <Button
                            onClick={startServer}
                            disabled={isLoading}
                            size="lg"
                            className="w-full"
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Starting Server...
                              </>
                            ) : (
                              <>
                                <Server className="h-4 w-4 mr-2" />
                                Start Server
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Upload */}
            <AnimatePresence>
              {isServerRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <FileUpload
                    onUpload={handleUpload}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - File List */}
          <div className="space-y-6">
            <AnimatePresence>
              {isServerRunning && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                                     <FileList
                     files={files}
                     onDownload={handleDownload}
                     onDelete={handleDelete}
                     isLoading={false}
                   />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-sm text-muted-foreground"
        >
          <p>Built with React, Express, and Tailwind CSS</p>
        </motion.div>
      </div>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default App;
