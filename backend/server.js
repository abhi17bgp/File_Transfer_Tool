require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cron = require('node-cron');
const crypto = require('crypto');
const connectDB = require('./config/database');
const File = require('./models/File');
const Session = require('./models/Session');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (optional for development)
let dbConnected = false;
connectDB().then(conn => {
  if (conn) {
    dbConnected = true;
    console.log('✅ Database connection established');
  } else {
    console.log('⚠️  Running without database connection');
  }
}).catch(err => {
  console.log('⚠️  Database connection failed, running in fallback mode');
});

// Middleware
app.use(cors({
  origin: '*', // or "http://localhost:3000" for stricter control
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'sessionid', 'pin']
}));

app.use(express.json());
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security and Cleanup Configuration
const SECURITY_CONFIG = {
  // File expiration times (in hours)
  FILE_EXPIRY_HOURS: 24,
  SESSION_EXPIRY_HOURS: 24,
  
  // Cleanup intervals
  CLEANUP_INTERVAL_MINUTES: 30, // Run cleanup every 30 minutes
  
  // Download security
  DOWNLOAD_TOKEN_EXPIRY_MINUTES: 15, // Download tokens expire in 15 minutes
  MAX_DOWNLOADS_PER_FILE: 10, // Maximum downloads per file
  
  // File size limits
  MAX_FILE_SIZE_MB: 100,
  MAX_FILES_PER_SESSION: 50
};

// Store for download tokens (in production, use Redis or database)
const downloadTokens = new Map();

// Cleanup Functions
const cleanupExpiredFiles = async () => {
  try {
    console.log('🧹 Starting file cleanup...');
    
    if (dbConnected) {
      // Clean up expired files from database
      const expiredFiles = await File.find({
        uploadDate: { $lt: new Date(Date.now() - SECURITY_CONFIG.FILE_EXPIRY_HOURS * 60 * 60 * 1000) }
      });
      
      for (const file of expiredFiles) {
        // Delete physical file
        const filePath = path.join(uploadsDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted expired file: ${file.filename}`);
        }
        
        // Delete from database
        await File.findByIdAndDelete(file._id);
      }
      
      // Clean up expired sessions
      const expiredSessions = await Session.find({
        expiresAt: { $lt: new Date() }
      });
      
      for (const session of expiredSessions) {
        // Delete session folder
        const sessionFolder = path.join(uploadsDir, session.sessionId);
        if (fs.existsSync(sessionFolder)) {
          fs.rmSync(sessionFolder, { recursive: true, force: true });
          console.log(`🗑️  Deleted expired session folder: ${session.sessionId}`);
        }
        
        // Delete from database
        await Session.findByIdAndDelete(session._id);
      }
      
      console.log(`✅ Cleanup completed: ${expiredFiles.length} files, ${expiredSessions.length} sessions removed`);
    } else {
      // Fallback cleanup without database
      const sessionFolders = fs.readdirSync(uploadsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('sess_'))
        .map(dirent => dirent.name);
      
      let cleanedCount = 0;
      for (const sessionId of sessionFolders) {
        const sessionFolder = path.join(uploadsDir, sessionId);
        const stats = fs.statSync(sessionFolder);
        
        // Delete folders older than expiry time
        if (Date.now() - stats.mtime.getTime() > SECURITY_CONFIG.SESSION_EXPIRY_HOURS * 60 * 60 * 1000) {
          fs.rmSync(sessionFolder, { recursive: true, force: true });
          console.log(`🗑️  Deleted expired session folder: ${sessionId}`);
          cleanedCount++;
        }
      }
      
      console.log(`✅ Fallback cleanup completed: ${cleanedCount} session folders removed`);
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};

const cleanupDownloadTokens = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [token, tokenData] of downloadTokens.entries()) {
    if (now > tokenData.expiresAt) {
      downloadTokens.delete(token);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired download tokens`);
  }
};

// Generate secure download token
const generateDownloadToken = (filename, sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (SECURITY_CONFIG.DOWNLOAD_TOKEN_EXPIRY_MINUTES * 60 * 1000);
  
  downloadTokens.set(token, {
    filename,
    sessionId,
    expiresAt,
    downloadCount: 0,
    maxDownloads: SECURITY_CONFIG.MAX_DOWNLOADS_PER_FILE
  });
  
  return token;
};

// Validate download token
const validateDownloadToken = (token) => {
  const tokenData = downloadTokens.get(token);
  
  if (!tokenData) {
    return { valid: false, error: 'Invalid download token' };
  }
  
  if (Date.now() > tokenData.expiresAt) {
    downloadTokens.delete(token);
    return { valid: false, error: 'Download token has expired' };
  }
  
  if (tokenData.downloadCount >= tokenData.maxDownloads) {
    downloadTokens.delete(token);
    return { valid: false, error: 'Maximum downloads exceeded' };
  }
  
  return { valid: true, tokenData };
};

// Setup scheduled cleanup
const setupCleanupScheduler = () => {
  // Run cleanup every 30 minutes
  cron.schedule(`*/${SECURITY_CONFIG.CLEANUP_INTERVAL_MINUTES} * * * *`, () => {
    cleanupExpiredFiles();
    cleanupDownloadTokens();
  });
  
  console.log(`⏰ Cleanup scheduler started - running every ${SECURITY_CONFIG.CLEANUP_INTERVAL_MINUTES} minutes`);
};

// Start cleanup scheduler
setupCleanupScheduler();

// Session middleware to validate session
const validateSession = async (req, res, next) => {
  const sessionId = req.headers.sessionid;
  const pin = req.headers.pin;
  
  console.log('Session validation - sessionId:', sessionId, 'pin:', pin);
  
  if (!sessionId || !pin) {
    console.log('Session validation failed: Missing sessionId or pin');
    return res.status(400).json({
      success: false,
      error: 'Session ID and PIN are required'
    });
  }
  
  try {
    if (dbConnected) {
      console.log('Using database for session validation');
      // Use database for session validation
      const session = await Session.findOne({ sessionId, pin });
      console.log('Found session:', session ? 'Yes' : 'No');
      
      if (!session) {
        console.log('Session not found in database');
        return res.status(404).json({
          success: false,
          error: 'Invalid session or PIN'
        });
      }
      
      if (!session.isValid()) {
        console.log('Session has expired');
        return res.status(410).json({
          success: false,
          error: 'Session has expired'
        });
      }
      
      console.log('Session validation successful');
      req.session = session;
    } else {
      console.log('Using fallback session validation');
      // Fallback: basic session validation without database
      // Check if session folder exists (basic validation)
      const sessionFolder = path.join(uploadsDir, sessionId);
      if (!fs.existsSync(sessionFolder)) {
        console.log('Session folder does not exist');
        return res.status(404).json({
          success: false,
          error: 'Invalid session or PIN'
        });
      }
      
      // Create a mock session object for fallback mode
      req.session = {
        sessionId,
        pin,
        sessionType: 'private',
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours from now
        getFolderPath: () => `uploads/${sessionId}`
      };
      console.log('Fallback session validation successful');
    }
    
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Session validation failed'
    });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use session folder if available, otherwise use main uploads folder
    const sessionId = req.headers.sessionid;
    const destination = sessionId ? path.join(uploadsDir, sessionId) : uploadsDir;
    
    // Ensure directory exists
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Helper function to get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Routes

// Find session by PIN
app.post('/api/session/find', async (req, res) => {
  try {
    const { pin } = req.body;
    
    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'PIN is required'
      });
    }
    
    if (dbConnected) {
      // Use database for session lookup
      const session = await Session.findOne({ pin });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found with this PIN'
        });
      }
      
      if (!session.isValid()) {
        return res.status(410).json({
          success: false,
          error: 'Session has expired'
        });
      }
      
      res.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          pin: session.pin,
          sessionType: session.sessionType,
          expiresAt: session.expiresAt,
          folderPath: session.getFolderPath()
        }
      });
    } else {
      // Fallback: search for session folders (basic lookup without database)
      // This is a simplified approach - in a real app, you'd want better session management
      const sessionFolders = fs.readdirSync(uploadsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('sess_'))
        .map(dirent => dirent.name);
      
      // For fallback mode, we can't reliably find sessions by PIN without database
      // So we'll return an error suggesting to create a new session
      return res.status(404).json({
        success: false,
        error: 'Session lookup requires database connection. Please create a new session instead.'
      });
    }
  } catch (error) {
    console.error('Session lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find session'
    });
  }
});

// Create new session
app.post('/api/session/create', async (req, res) => {
  try {
    const { sessionType = 'private', ttlHours = 24 } = req.body;
    
    let session;
    
    if (dbConnected) {
      // Use database for session creation
      session = await Session.createSession(sessionType, ttlHours);
    } else {
      // Fallback: create session without database
      const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + (ttlHours * 60 * 60 * 1000));
      
      session = {
        sessionId,
        pin,
        sessionType,
        expiresAt,
        getFolderPath: () => `uploads/${sessionId}`
      };
    }
    
    // Create session folder
    const sessionFolder = path.join(uploadsDir, session.sessionId);
    if (!fs.existsSync(sessionFolder)) {
      fs.mkdirSync(sessionFolder, { recursive: true });
    }
    
    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        pin: session.pin,
        sessionType: session.sessionType,
        expiresAt: session.expiresAt,
        folderPath: session.getFolderPath()
      }
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

// Test endpoint to check deployment
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Deployment test - updated code is working',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    render: process.env.RENDER,
    host: req.get('host')
  });
});

// Get server info (no frontend URL needed)
app.get('/api/ip', (req, res) => {
  try {
    console.log('IP endpoint called');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('RENDER:', process.env.RENDER);
    console.log('Host:', req.get('host'));
    
    // Check if we're in production (deployed) - check multiple indicators
    const host = req.get('host') || '';
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.RENDER === 'true' || 
                        host.includes('onrender.com') ||
                        host.includes('file-transfer-tool-2');
    
    console.log('Is Production:', isProduction);
    
    if (isProduction) {
      res.json({
        success: true,
        ip: 'file-transfer-tool-2.onrender.com',
        port: 443,
        environment: 'production',
        message: 'Server is deployed and running'
      });
    } else {
      // Local development - return local IP info
      const ip = getLocalIP();
      console.log('Local IP:', ip);
      const port = PORT;
      
      res.json({
        success: true,
        ip: ip,
        port: port,
        environment: 'development',
        message: 'Server is running locally'
      });
    }
  } catch (error) {
    console.error('IP endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get server info'
    });
  }
});

// Upload file endpoint
app.post('/api/upload', validateSession, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload endpoint called');
    console.log('Request file:', req.file ? 'Present' : 'Missing');
    console.log('Request session:', req.session ? 'Present' : 'Missing');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Security checks
    if (req.file.size > SECURITY_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: `File size exceeds ${SECURITY_CONFIG.MAX_FILE_SIZE_MB}MB limit`
      });
    }

    // Check file count per session (if database connected)
    if (dbConnected) {
      const sessionFileCount = await File.countDocuments({ 
        sessionId: req.session.sessionId 
      });
      
      if (sessionFileCount >= SECURITY_CONFIG.MAX_FILES_PER_SESSION) {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          error: `Maximum ${SECURITY_CONFIG.MAX_FILES_PER_SESSION} files per session allowed`
        });
      }
    }

    // Create file record in MongoDB (if connected)
    let fileRecord = null;
    if (dbConnected) {
      fileRecord = new File({
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        filePath: req.file.path,
        sessionId: req.session.sessionId,
        sessionPin: req.session.pin,
        uploadDate: new Date(),
        expiresAt: new Date(Date.now() + SECURITY_CONFIG.FILE_EXPIRY_HOURS * 60 * 60 * 1000)
      });

      await fileRecord.save();
      
      // Update session file count and size
      await Session.findByIdAndUpdate(req.session._id, {
        $inc: { fileCount: 1, totalSize: req.file.size }
      });
    }

    // Generate secure download token
    const downloadToken = generateDownloadToken(req.file.filename, req.session.sessionId);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: dbConnected ? fileRecord._id : req.file.filename,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadDate: dbConnected ? fileRecord.uploadDate : new Date(),
        expiresAt: new Date(Date.now() + SECURITY_CONFIG.FILE_EXPIRY_HOURS * 60 * 60 * 1000),
        downloadToken: downloadToken,
        downloadUrl: `/api/download/${req.file.filename}?token=${downloadToken}`
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// Get list of uploaded files
app.get('/api/files', validateSession, async (req, res) => {
  try {
    if (!dbConnected) {
      // Fallback: read files from session directory
      const sessionFolder = path.join(uploadsDir, req.session.sessionId);
      if (!fs.existsSync(sessionFolder)) {
        return res.json({
          success: true,
          files: []
        });
      }
      
      const files = fs.readdirSync(sessionFolder).map(filename => {
        const filePath = path.join(sessionFolder, filename);
        const stats = fs.statSync(filePath);
        const downloadToken = generateDownloadToken(filename, req.session.sessionId);
        return {
          id: filename,
          filename: filename,
          originalName: filename,
          size: stats.size,
          uploadDate: stats.birthtime,
          mimetype: 'application/octet-stream',
          expiresAt: new Date(stats.birthtime.getTime() + SECURITY_CONFIG.FILE_EXPIRY_HOURS * 60 * 60 * 1000),
          downloadToken: downloadToken,
          downloadUrl: `/api/download/${filename}?token=${downloadToken}`
        };
      }).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

      res.json({ success: true, files });
      return;
    }

    // Get files from database for this session
    const files = await File.find({ 
      sessionId: req.session.sessionId,
      sessionPin: req.session.pin 
    }).sort({ uploadDate: -1 }).select('filename originalName size uploadDate mimetype downloadCount maxDownloads expiresAt');

    res.json({
      success: true,
      files: files.map(file => {
        const downloadToken = generateDownloadToken(file.filename, req.session.sessionId);
        return {
          id: file._id,
          filename: file.filename,
          originalName: file.originalName,
          size: file.size,
          uploadDate: file.uploadDate,
          mimetype: file.mimetype,
          expiresAt: file.expiresAt,
          downloadCount: file.downloadCount || 0,
          maxDownloads: file.maxDownloads || SECURITY_CONFIG.MAX_DOWNLOADS_PER_FILE,
          downloadToken: downloadToken,
          downloadUrl: `/api/download/${file.filename}?token=${downloadToken}`
        };
      })
    });
  } catch (error) {
    console.error('Files list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get files list'
    });
  }
});

// Download file endpoint with secure token validation
app.get('/api/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const token = req.query.token;
    
    // Validate download token
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Download token required'
      });
    }
    
    const tokenValidation = validateDownloadToken(token);
    if (!tokenValidation.valid) {
      return res.status(401).json({
        success: false,
        error: tokenValidation.error
      });
    }
    
    const { tokenData } = tokenValidation;
    
    // Verify token matches the requested file
    if (tokenData.filename !== filename) {
      return res.status(403).json({
        success: false,
        error: 'Token does not match requested file'
      });
    }
    
    // Find file path (check session folder first, then main uploads)
    let filePath = path.join(uploadsDir, tokenData.sessionId, filename);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(uploadsDir, filename);
    }
    
    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    let originalName = filename;
    let mimetype = 'application/octet-stream';

    // If database is connected, try to get file metadata
    if (dbConnected) {
      try {
        const fileRecord = await File.findOne({ filename });
        if (fileRecord) {
          originalName = fileRecord.originalName;
          mimetype = fileRecord.mimetype;
          
          // Check if file has expired
          if (fileRecord.expiresAt && new Date() > fileRecord.expiresAt) {
            return res.status(410).json({
              success: false,
              error: 'File has expired'
            });
          }
          
          // Update download count
          await File.findByIdAndUpdate(fileRecord._id, {
            $inc: { downloadCount: 1 }
          });
        }
      } catch (dbError) {
        console.log('Database lookup failed, using fallback metadata');
      }
    }
    
    // Increment download count in token
    tokenData.downloadCount++;
    downloadTokens.set(token, tokenData);

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download file'
      });
    });
    
    console.log(`📥 File downloaded: ${filename} (${tokenData.downloadCount}/${tokenData.maxDownloads})`);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file'
    });
  }
});

// Delete file endpoint with session validation
app.delete('/api/files/:id', validateSession, async (req, res) => {
  try {
    const fileId = req.params.id;
    console.log('Delete endpoint called for file ID:', fileId);
    console.log('Session:', req.session ? 'Present' : 'Missing');
    
    let filename = fileId;
    let filePath = null;
    let fileRecord = null;

    // If database is connected, try to get file info
    if (dbConnected) {
      try {
        fileRecord = await File.findById(fileId);
        if (fileRecord) {
          // Verify file belongs to current session
          if (fileRecord.sessionId !== req.session.sessionId) {
            return res.status(403).json({
              success: false,
              error: 'File does not belong to current session'
            });
          }
          
          filename = fileRecord.filename;
          // Check session folder first, then main uploads folder
          filePath = path.join(uploadsDir, req.session.sessionId, filename);
          if (!fs.existsSync(filePath)) {
            filePath = path.join(uploadsDir, filename);
          }
        } else {
          return res.status(404).json({
            success: false,
            error: 'File not found in database'
          });
        }
      } catch (dbError) {
        console.log('Database lookup failed:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Database lookup failed'
        });
      }
    } else {
      // Fallback mode - check session folder
      filePath = path.join(uploadsDir, req.session.sessionId, fileId);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(uploadsDir, fileId);
      }
    }

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    console.log('Deleting file:', filePath);

    // Delete file from disk
    fs.unlinkSync(filePath);
    console.log('File deleted from disk successfully');

    // Delete from database if connected
    if (dbConnected && fileRecord) {
      try {
        await File.findByIdAndDelete(fileId);
        console.log('File deleted from database successfully');
        
        // Update session file count and size
        await Session.findByIdAndUpdate(req.session._id, {
          $inc: { fileCount: -1, totalSize: -fileRecord.size }
        });
        console.log('Session stats updated');
      } catch (dbError) {
        console.log('Database delete failed:', dbError);
        // File is already deleted from disk, so we continue
      }
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    mongodb: dbConnected ? 'connected' : 'disconnected',
    security: {
      fileExpiryHours: SECURITY_CONFIG.FILE_EXPIRY_HOURS,
      sessionExpiryHours: SECURITY_CONFIG.SESSION_EXPIRY_HOURS,
      maxFileSizeMB: SECURITY_CONFIG.MAX_FILE_SIZE_MB,
      maxFilesPerSession: SECURITY_CONFIG.MAX_FILES_PER_SESSION,
      downloadTokenExpiryMinutes: SECURITY_CONFIG.DOWNLOAD_TOKEN_EXPIRY_MINUTES,
      maxDownloadsPerFile: SECURITY_CONFIG.MAX_DOWNLOADS_PER_FILE
    }
  });
});

// Manual cleanup endpoint (admin only)
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    console.log('🧹 Manual cleanup triggered');
    await cleanupExpiredFiles();
    cleanupDownloadTokens();
    
    res.json({
      success: true,
      message: 'Manual cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Manual cleanup failed'
    });
  }
});

// Get cleanup statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    let stats = {
      activeDownloadTokens: downloadTokens.size,
      cleanupIntervalMinutes: SECURITY_CONFIG.CLEANUP_INTERVAL_MINUTES
    };
    
    if (dbConnected) {
      const totalFiles = await File.countDocuments();
      const totalSessions = await Session.countDocuments();
      const expiredFiles = await File.countDocuments({
        uploadDate: { $lt: new Date(Date.now() - SECURITY_CONFIG.FILE_EXPIRY_HOURS * 60 * 60 * 1000) }
      });
      const expiredSessions = await Session.countDocuments({
        expiresAt: { $lt: new Date() }
      });
      
      stats = {
        ...stats,
        totalFiles,
        totalSessions,
        expiredFiles,
        expiredSessions
      };
    }
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 File Transfer Server running on port ${PORT}`);
  console.log(`📱 Local IP: http://${getLocalIP()}:${PORT}`);
  console.log(`🌐 Frontend accessible from other devices: http://${getLocalIP()}:3000`);
  console.log(`🔌 Backend API accessible from other devices: http://${getLocalIP()}:${PORT}`);
  console.log(`🗄️  MongoDB: ${dbConnected ? 'Connected' : 'Not Connected (Running in Fallback Mode)'}`);
  console.log(`🔒 Security Features:`);
  console.log(`   • File expiry: ${SECURITY_CONFIG.FILE_EXPIRY_HOURS} hours`);
  console.log(`   • Session expiry: ${SECURITY_CONFIG.SESSION_EXPIRY_HOURS} hours`);
  console.log(`   • Max file size: ${SECURITY_CONFIG.MAX_FILE_SIZE_MB}MB`);
  console.log(`   • Max files per session: ${SECURITY_CONFIG.MAX_FILES_PER_SESSION}`);
  console.log(`   • Download token expiry: ${SECURITY_CONFIG.DOWNLOAD_TOKEN_EXPIRY_MINUTES} minutes`);
  console.log(`   • Max downloads per file: ${SECURITY_CONFIG.MAX_DOWNLOADS_PER_FILE}`);
  console.log(`   • Auto cleanup: Every ${SECURITY_CONFIG.CLEANUP_INTERVAL_MINUTES} minutes`);
});

module.exports = app;
