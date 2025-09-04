const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  pin: { 
    type: String, 
    required: true,
    index: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: { 
    type: String, 
    default: 'unknown' // Could be device ID, IP, etc.
  },
  sessionType: { 
    type: String, 
    enum: ['private', 'shared', 'public'], 
    default: 'private' 
  },
  fileCount: { 
    type: Number, 
    default: 0 
  },
  totalSize: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

// Indexes for performance
sessionSchema.index({ sessionId: 1, pin: 1 });
sessionSchema.index({ expiresAt: 1 });

// Static method to create a new session
sessionSchema.statics.createSession = function(sessionType = 'private', ttlHours = 24) {
  const sessionId = this.generateSessionId();
  const pin = this.generatePin();
  const expiresAt = new Date(Date.now() + (ttlHours * 60 * 60 * 1000));
  
  return this.create({
    sessionId,
    pin,
    expiresAt,
    sessionType
  });
};

// Generate unique session ID
sessionSchema.statics.generateSessionId = function() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Generate 6-digit PIN
sessionSchema.statics.generatePin = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if session is valid and not expired
sessionSchema.methods.isValid = function() {
  return this.isActive && new Date() < this.expiresAt;
};

// Get session folder path
sessionSchema.methods.getFolderPath = function() {
  return `uploads/${this.sessionId}`;
};

module.exports = mongoose.model('Session', sessionSchema);
