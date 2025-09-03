// Test script to check different ports
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080; // Test with a different port

app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test endpoint working on port ' + PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Test server is running on port ' + PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`📱 Test from phone: http://10.226.82.107:${PORT}/test`);
  console.log(`🔌 Health check: http://10.226.82.107:${PORT}/api/health`);
});

console.log('💡 If this works, the issue is with port 5000 specifically');
console.log('💡 If this also fails, it\'s a general firewall/network issue');
