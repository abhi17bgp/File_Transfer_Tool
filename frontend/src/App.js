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
const getApiBase = () => {
  // Always check environment variable first
  if (process.env.REACT_APP_API_URL) {
    console.log('Using environment API URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // If accessing from localhost, use localhost for backend
  if (window.location.hostname === 'localhost') {
    console.log('Using localhost API URL');
    return 'http://localhost:5000';
  }
  
  // For external access (like from phone), use the same hostname but port 5000
  const externalUrl = `http://${window.location.hostname}:5000`;
  console.log('Using external API URL:', externalUrl);
  return externalUrl;
};

const API_BASE = getApiBase();
console.log('Final API_BASE:', API_BASE);

// Helper function to get session headers
const getSessionHeaders = (sessionInfo) => {
  if (!sessionInfo) return {};
  return {
    'sessionid': sessionInfo.sessionId,
    'pin': sessionInfo.pin
  };
};

function App() {
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showJoinSession, setShowJoinSession] = useState(false);
  const [joinPin, setJoinPin] = useState('');

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
    checkServerStatus(true);
  }, []);

  // Auto-refresh files every 5 seconds (only when session exists)
  useEffect(() => {
    if (!sessionInfo) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/files`, {
          headers: getSessionHeaders(sessionInfo)
        });
        
        if (response.status === 410) {
          // Session expired
          toast({
            title: "⏰ Session Expired",
            description: "Your session has expired. Please start a new session.",
            variant: "destructive",
            duration: 5000,
          });
          setSessionInfo(null);
          setIsServerRunning(false);
        } else if (response.ok) {
          const data = await response.json();
          setFiles(data.files);
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [sessionInfo]);

  const checkServerStatus = async (showToast = false) => {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        const ipResponse = await fetch(`${API_BASE}/api/ip`);
        if (ipResponse.ok) {
          const data = await ipResponse.json();
          
          // Generate frontend URL - always use current origin for deployed frontend
          let frontendUrl = window.location.origin;
          
          // If we're accessing from localhost, use the backend's IP for local development
          if (window.location.hostname === 'localhost' && data.environment === 'development') {
            frontendUrl = `http://${data.ip}:3000`;
          }
          
          // Add the frontend URL to the server info
          const serverInfoWithUrl = {
            ...data,
            url: frontendUrl
          };
          
          setServerInfo(serverInfoWithUrl);
          setIsServerRunning(true);
          
          if (showToast) {
            toast({
              title: "🟢 Server Connected",
              description: "File transfer server is running",
              duration: 3000,
            });
          }
        }
      }
    } catch (error) {
      console.log('Server not running');
      if (showToast) {
        toast({
          title: "🔴 Server Disconnected",
          description: "Cannot connect to file transfer server",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

  const joinSession = async () => {
    if (!joinPin.trim()) {
      toast({
        title: "Error",
        description: "Please enter a PIN",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if server is running
      const healthResponse = await fetch(`${API_BASE}/api/health`);
      if (!healthResponse.ok) {
        throw new Error('Server is not running');
      }
      
      // Get server info
      const ipResponse = await fetch(`${API_BASE}/api/ip`);
      if (!ipResponse.ok) {
        throw new Error('Failed to get server info');
      }
      const serverData = await ipResponse.json();
      
      // Find session by PIN
      const sessionResponse = await fetch(`${API_BASE}/api/session/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin: joinPin })
      });
      
      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Invalid PIN or session not found');
      }
      
      const sessionData = await sessionResponse.json();
      
      // Generate frontend URL
      let frontendUrl = window.location.origin;
      if (window.location.hostname === 'localhost' && serverData.environment === 'development') {
        frontendUrl = `http://${serverData.ip}:3000`;
      }
      
      // Set server and session info
      setServerInfo({
        ...serverData,
        url: frontendUrl
      });
      setSessionInfo(sessionData.session);
      
      setIsServerRunning(true);
      setShowJoinSession(false);
      
      toast({
        title: "✅ Session Joined Successfully!",
        description: `Connected to session with PIN: ${joinPin}`,
        duration: 4000,
      });
      
      // Load files after joining session
      setTimeout(() => fetchFiles(true), 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to join session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startServer = async () => {
    try {
      setIsLoading(true);
      console.log('Starting server with API_BASE:', API_BASE);
      
      // First, check if server is running
      console.log('Checking server health...');
      const healthResponse = await fetch(`${API_BASE}/api/health`);
      console.log('Health response:', healthResponse.status);
      if (!healthResponse.ok) {
        throw new Error('Server is not running');
      }
      
      // Get server info
      console.log('Getting server info...');
      const ipResponse = await fetch(`${API_BASE}/api/ip`);
      console.log('IP response:', ipResponse.status);
      if (!ipResponse.ok) {
        throw new Error('Failed to get server info');
      }
      const serverData = await ipResponse.json();
      console.log('Server data:', serverData);
      
      // Create a new session
      console.log('Creating session...');
      const sessionResponse = await fetch(`${API_BASE}/api/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionType: 'private',
          ttlHours: 24
        })
      });
      
      console.log('Session response:', sessionResponse.status);
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('Session creation failed:', errorText);
        throw new Error('Failed to create session');
      }
      const sessionData = await sessionResponse.json();
      console.log('Session data:', sessionData);
      
      // Generate frontend URL - always use current origin for deployed frontend
      let frontendUrl = window.location.origin;
      
      // If we're accessing from localhost, use the backend's IP for local development
      if (window.location.hostname === 'localhost' && serverData.environment === 'development') {
        frontendUrl = `http://${serverData.ip}:3000`;
      }
      
      // Set server and session info
      setServerInfo({
        ...serverData,
        url: frontendUrl
      });
      setSessionInfo(sessionData.session);
      setIsServerRunning(true);
      
      toast({
        title: "🎉 Session Created Successfully!",
        description: `File transfer session is ready! PIN: ${sessionData.session.pin}`,
        duration: 5000,
      });
      
      // Load files after session creation
      setTimeout(() => fetchFiles(true), 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to start server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiles = async (showToast = false) => {
    if (!sessionInfo) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/files`, {
        headers: getSessionHeaders(sessionInfo)
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        
        if (showToast && data.files.length > 0) {
          toast({
            title: "📁 Files Loaded",
            description: `Found ${data.files.length} file(s) in session`,
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
      if (showToast) {
        toast({
          title: "❌ Failed to Load Files",
          description: "Could not retrieve file list from server",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

  const handleUpload = async (selectedFiles) => {
    if (!sessionInfo) {
      toast({
        title: "No Session",
        description: "Please start a session first",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    // Show upload start toast
    toast({
      title: "📤 Upload Started",
      description: `Uploading ${selectedFiles.length} file(s)...`,
      duration: 2000,
    });

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: getSessionHeaders(sessionInfo),
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
        
        // Show progress toast for each file
        if (selectedFiles.length > 1) {
          toast({
            title: "📤 Upload Progress",
            description: `Uploaded ${i + 1}/${selectedFiles.length} files`,
            duration: 1500,
          });
        }
      }

      toast({
        title: "📤 Upload Complete!",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
        duration: 4000,
      });

      // Refresh files list
      await fetchFiles();
    } catch (error) {
      toast({
        title: "❌ Upload Failed",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (filename) => {
    if (!sessionInfo) {
      toast({
        title: "No Session",
        description: "Please start a session first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/download/${filename}`, {
        headers: getSessionHeaders(sessionInfo)
      });
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
          title: "📥 Download Started",
          description: `${filename} is being downloaded`,
          duration: 3000,
        });
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      toast({
        title: "❌ Download Failed",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleDelete = async (fileId) => {
    if (!sessionInfo) {
      toast({
        title: "No Session",
        description: "Please start a session first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Deleting file with ID:', fileId);
      console.log('Session headers:', getSessionHeaders(sessionInfo));
      
      const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
        method: 'DELETE',
        headers: getSessionHeaders(sessionInfo)
      });
      
      console.log('Delete response status:', response.status);
      
      if (response.ok) {
        // Refresh files list
        await fetchFiles();
        
        // Show success toast
        toast({
          title: "🗑️ File Deleted Successfully!",
          description: "File has been removed from the server",
          duration: 4000,
        });
      } else {
        const errorData = await response.text();
        console.error('Delete failed:', errorData);
        throw new Error(`Failed to delete file: ${response.status}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
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
          title: "📋 Link Copied!",
          description: "Server URL copied to clipboard",
          duration: 3000,
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
              sessionInfo={sessionInfo}
              isServerRunning={isServerRunning}
              onCopyLink={handleCopyLink}
              copied={copied}
            />

            {/* Session Management - Show when no session exists */}
            <AnimatePresence>
              {!sessionInfo && (
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
                            {isServerRunning ? 'Start File Transfer Session' : 'File Transfer Server'}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {isServerRunning 
                              ? 'Create a new session to start transferring files'
                              : 'Start a new session or join an existing one'
                            }
                          </p>
                          
                          {!showJoinSession ? (
                            <div className="space-y-3">
                              <Button
                                onClick={startServer}
                                disabled={isLoading}
                                size="lg"
                                className="w-full"
                              >
                                {isLoading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {isServerRunning ? 'Creating Session...' : 'Starting Server...'}
                                  </>
                                ) : (
                                  <>
                                    <Server className="h-4 w-4 mr-2" />
                                    {isServerRunning ? 'Start New Session' : 'Start Server & Session'}
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() => setShowJoinSession(true)}
                                variant="outline"
                                size="lg"
                                className="w-full"
                              >
                                Join Existing Session
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Enter Session PIN:</label>
                                <input
                                  type="text"
                                  value={joinPin}
                                  onChange={(e) => setJoinPin(e.target.value)}
                                  placeholder="Enter 6-digit PIN"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  maxLength="6"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={joinSession}
                                  disabled={isLoading || !joinPin.trim()}
                                  size="lg"
                                  className="flex-1"
                                >
                                  {isLoading ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Joining...
                                    </>
                                  ) : (
                                    'Join Session'
                                  )}
                                </Button>
                                <Button
                                  onClick={() => {
                                    setShowJoinSession(false);
                                    setJoinPin('');
                                  }}
                                  variant="outline"
                                  size="lg"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
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

        {/* Session Status Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          {!sessionInfo ? (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  No Session
                </span>
                <span className="text-xs text-yellow-600 dark:text-yellow-300">
                  Please start a session first
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Session Active
                </span>
                <span className="text-xs text-green-600 dark:text-green-300">
                  PIN: {sessionInfo.pin}
                </span>
              </div>
            </div>
          )}
          
          <div className="text-center mt-4 text-sm text-muted-foreground">
            <p>Built with React, Express, and Tailwind CSS</p>
          </div>
        </motion.div>
      </div>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default App;
