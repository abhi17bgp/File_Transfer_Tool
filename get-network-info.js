const os = require('os');

function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const networkInfo = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        networkInfo.push({
          interface: name,
          ip: iface.address,
          frontend: `http://${iface.address}:3000`,
          backend: `http://${iface.address}:5000`
        });
      }
    }
  }
  
  return networkInfo;
}

const networks = getNetworkInfo();
console.log('\n🌐 Network Information for Phone Access:');
console.log('=====================================');

if (networks.length === 0) {
  console.log('❌ No network interfaces found');
} else {
  networks.forEach((net, index) => {
    console.log(`\n📱 Network ${index + 1}: ${net.interface}`);
    console.log(`   IP Address: ${net.ip}`);
    console.log(`   Frontend URL: ${net.frontend}`);
    console.log(`   Backend URL: ${net.backend}`);
  });
  
  console.log('\n📋 Instructions:');
  console.log('1. Make sure your phone is connected to the same WiFi network');
  console.log('2. Open the Frontend URL in your phone\'s browser');
  console.log('3. The app should automatically detect the correct backend URL');
}

console.log('\n');
