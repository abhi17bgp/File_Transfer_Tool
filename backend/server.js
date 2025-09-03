require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const connectDB = require('./config/database');
const File = require('./models/File');
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
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
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

// Get server IP address
app.get('/api/ip', (req, res) => {
  try {
    const ip = getLocalIP();
    const port = PORT;
    // Use frontend port (3000) for the URL since that's what users should access
    const serverUrl = `http://${ip}:3000`;
    
    res.json({
      success: true,
      ip: ip,
      port: port,
      url: serverUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get IP address'
    });
  }
});

// Upload file endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Create file record in MongoDB (if connected)
    let fileRecord = null;
    if (dbConnected) {
      fileRecord = new File({
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        filePath: req.file.path
      });

      await fileRecord.save();
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: dbConnected ? fileRecord._id : req.file.filename,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadDate: dbConnected ? fileRecord.uploadDate : new Date()
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
app.get('/api/files', async (req, res) => {
  try {
    if (!dbConnected) {
      // Fallback: read files from uploads directory
      const files = fs.readdirSync(uploadsDir).map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        return {
          id: filename,
          filename: filename,
          originalName: filename,
          size: stats.size,
          uploadDate: stats.birthtime,
          mimetype: 'application/octet-stream',
          downloadUrl: `/api/download/${filename}`
        };
      }).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

      res.json({ success: true, files });
      return;
    }

    const files = await File.find({})
      .sort({ uploadDate: -1 })
      .select('filename originalName size uploadDate mimetype');

    res.json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        uploadDate: file.uploadDate,
        mimetype: file.mimetype,
        downloadUrl: `/api/download/${file.filename}`
      }))
    });
  } catch (error) {
    console.error('Files list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get files list'
    });
  }
});

// Download file endpoint
app.get('/api/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

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
        }
      } catch (dbError) {
        console.log('Database lookup failed, using fallback metadata');
      }
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', mimetype);

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
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file'
    });
  }
});

// Delete file endpoint
app.delete('/api/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    let filename = fileId;
    let filePath = path.join(uploadsDir, fileId);

    // If database is connected, try to get file info
    if (dbConnected) {
      try {
        const fileRecord = await File.findById(fileId);
        if (fileRecord) {
          filename = fileRecord.filename;
          filePath = path.join(uploadsDir, fileRecord.filename);
        }
      } catch (dbError) {
        console.log('Database lookup failed, using ID as filename');
      }
    }

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    // Delete file from disk
    fs.unlinkSync(filePath);

    // Delete from database if connected
    if (dbConnected) {
      try {
        await File.findByIdAndDelete(fileId);
      } catch (dbError) {
        console.log('Database delete failed, but file removed from disk');
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
    mongodb: dbConnected ? 'connected' : 'disconnected'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 File Transfer Server running on port ${PORT}`);
  console.log(`📱 Local IP: http://${getLocalIP()}:${PORT}`);
  console.log(`🌐 Frontend accessible from other devices: http://${getLocalIP()}:3000`);
  console.log(`🔌 Backend API accessible from other devices: http://${getLocalIP()}:${PORT}`);
  console.log(`🗄️  MongoDB: ${dbConnected ? 'Connected' : 'Not Connected (Running in Fallback Mode)'}`);
});

module.exports = app;
