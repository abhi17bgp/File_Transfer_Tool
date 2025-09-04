import React from 'react';
import { motion } from 'framer-motion';
import { Server, Copy, Check, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import QRCode from './QRCode';

const ServerStatus = ({ serverInfo, sessionInfo, isServerRunning, onCopyLink, copied }) => {
  if (!isServerRunning) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Server Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <WifiOff className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Server Not Running</h3>
            <p className="text-muted-foreground">
              Click "Start Server" to begin file transfers
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wifi className="h-5 w-5 text-green-500" />
          <span>Server Running</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Server Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Server IP:</span>
                <span className="font-mono text-sm">{serverInfo.ip}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Port:</span>
                <span className="font-mono text-sm">{serverInfo.port}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">URL:</span>
                <span className="font-mono text-sm break-all">{serverInfo.url}</span>
              </div>
              {sessionInfo && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Session ID:</span>
                    <span className="font-mono text-sm">{sessionInfo.sessionId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">PIN:</span>
                    <span className="font-mono text-sm font-bold text-green-600">{sessionInfo.pin}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Expires:</span>
                    <span className="font-mono text-sm">{new Date(sessionInfo.expiresAt).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Copy Link Button */}
          <Button
            onClick={onCopyLink}
            variant="outline"
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <QRCode url={serverInfo.url} size={180} />
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-2"
        >
          <h4 className="font-medium">Connect from your laptop:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>1. Scan the QR code above, or</p>
            <p>2. Open the copied link in your browser</p>
            {sessionInfo && (
              <p className="font-semibold text-green-600">3. Use PIN: <span className="font-mono">{sessionInfo.pin}</span></p>
            )}
            <p>4. Start transferring files!</p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default ServerStatus;
