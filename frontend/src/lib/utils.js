import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function getFileIcon(filename) {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const iconMap = {
    // Images
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'svg': '🖼️',
    'webp': '🖼️',
    
    // Documents
    'pdf': '📄',
    'doc': '📄',
    'docx': '📄',
    'txt': '📄',
    'rtf': '📄',
    
    // Spreadsheets
    'xls': '📊',
    'xlsx': '📊',
    'csv': '📊',
    
    // Presentations
    'ppt': '📽️',
    'pptx': '📽️',
    
    // Archives
    'zip': '📦',
    'rar': '📦',
    '7z': '📦',
    'tar': '📦',
    'gz': '📦',
    
    // Videos
    'mp4': '🎥',
    'avi': '🎥',
    'mov': '🎥',
    'wmv': '🎥',
    'flv': '🎥',
    
    // Audio
    'mp3': '🎵',
    'wav': '🎵',
    'flac': '🎵',
    'aac': '🎵',
    
    // Code
    'js': '💻',
    'ts': '💻',
    'html': '💻',
    'css': '💻',
    'json': '💻',
    'py': '💻',
    'java': '💻',
    'cpp': '💻',
    'c': '💻',
  };
  
  return iconMap[extension] || '📁';
}
