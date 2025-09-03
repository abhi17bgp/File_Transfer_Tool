import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

const QRCode = ({ url, size = 200 }) => {

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center space-y-4"
    >
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <QRCodeSVG value={url} size={size} />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Scan this QR code with your laptop to connect
      </p>
    </motion.div>
  );
};

export default QRCode;
