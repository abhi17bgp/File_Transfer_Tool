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
  filePath: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add index for faster queries
fileSchema.index({ uploadDate: -1 });
fileSchema.index({ filename: 1 });

module.exports = mongoose.model('File', fileSchema);
