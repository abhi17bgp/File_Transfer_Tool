import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';
import { motion } from 'framer-motion';

const QRCode = ({ url, size = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (url && canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [url, size]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center space-y-4"
    >
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Scan this QR code with your laptop to connect
      </p>
    </motion.div>
  );
};

export default QRCode;
