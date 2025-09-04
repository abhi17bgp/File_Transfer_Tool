const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  filePath: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  sessionPin: {
    type: String,
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  maxDownloads: {
    type: Number,
    default: null // null = unlimited
  },
  isOneTimeLink: {
    type: Boolean,
    default: false
  },
  oneTimeToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Add index for faster queries
fileSchema.index({ uploadDate: -1 });
fileSchema.index({ filename: 1 });
fileSchema.index({ sessionId: 1 });
fileSchema.index({ oneTimeToken: 1 });

module.exports = mongoose.model('File', fileSchema);
