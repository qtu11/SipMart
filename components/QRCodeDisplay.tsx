'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface QRCode {
  cupId: string;
  material: string;
  qrData: string;
  qrImage?: string;
}

interface QRCodeDisplayProps {
  qrCodes: QRCode[];
  onClose: () => void;
}

export default function QRCodeDisplay({ qrCodes, onClose }: QRCodeDisplayProps) {
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);

  const downloadQRCode = (qr: QRCode) => {
    if (!qr.qrImage) {
      toast.error('QR code image not available');
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = qr.qrImage;
    link.download = `QR_CupSipSmart_${qr.cupId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Đã tải mã QR ${qr.cupId}`);
  };

  const downloadAllQRCodes = () => {
    qrCodes.forEach((qr, index) => {
      setTimeout(() => {
        downloadQRCode(qr);
      }, index * 200); // Delay 200ms giữa mỗi download
    });
    
    toast.success(`Đang tải ${qrCodes.length} mã QR...`);
  };

  const copyQRData = (qrData: string) => {
    navigator.clipboard.writeText(qrData);
    toast.success('Đã copy mã QR vào clipboard');
  };

  const getMaterialDisplayName = (material: string) => {
    const names: Record<string, string> = {
      pp_plastic: 'Nhựa PP cao cấp',
      bamboo_fiber: 'Sợi tre',
    };
    return names[material] || material;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-100">
            <div>
              <h2 className="text-2xl font-bold text-dark-800">
                Mã QR đã tạo thành công
              </h2>
              <p className="text-sm text-dark-500 mt-1">
                {qrCodes.length} mã QR - {getMaterialDisplayName(qrCodes[0]?.material || '')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadAllQRCodes}
                className="bg-primary-500 text-white rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-primary-600 transition font-medium"
              >
                <Download className="w-4 h-4" />
                Tải tất cả
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 hover:bg-dark-100 rounded-xl flex items-center justify-center transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* QR Codes Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {qrCodes.map((qr) => (
                <motion.div
                  key={qr.cupId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-4 border-2 border-primary-100 hover:border-primary-300 transition cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => setSelectedQR(qr)}
                >
                  {/* QR Image */}
                  {qr.qrImage ? (
                    <div className="bg-white rounded-xl p-2 mb-3 shadow-sm">
                      <Image
                        src={qr.qrImage}
                        alt={`QR Code ${qr.cupId}`}
                        width={200}
                        height={200}
                        className="w-full h-auto"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="bg-dark-100 rounded-xl p-8 mb-3 flex items-center justify-center">
                      <span className="text-dark-400 text-sm">No Image</span>
                    </div>
                  )}

                  {/* Cup ID */}
                  <div className="text-center">
                    <p className="text-xs text-dark-500 mb-1">Cup ID</p>
                    <p className="font-bold text-dark-800 text-lg">{qr.cupId}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadQRCode(qr);
                      }}
                      className="flex-1 bg-primary-500 text-white rounded-lg py-2 text-xs font-medium hover:bg-primary-600 transition flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Tải
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyQRData(qr.qrData);
                      }}
                      className="flex-1 bg-dark-100 text-dark-700 rounded-lg py-2 text-xs font-medium hover:bg-dark-200 transition flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Selected QR Detail Modal */}
          <AnimatePresence>
            {selectedQR && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
                onClick={() => setSelectedQR(null)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-2xl p-6 max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Large QR Image */}
                  {selectedQR.qrImage && (
                    <div className="bg-white rounded-xl p-4 mb-4 shadow-lg border-2 border-primary-200">
                      <Image
                        src={selectedQR.qrImage}
                        alt={`QR Code ${selectedQR.cupId}`}
                        width={400}
                        height={400}
                        className="w-full h-auto"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-3 mb-4">
                    <div className="bg-primary-50 rounded-xl p-3">
                      <p className="text-xs text-primary-600 mb-1">Cup ID</p>
                      <p className="font-bold text-primary-800 text-xl">
                        {selectedQR.cupId}
                      </p>
                    </div>

                    <div className="bg-dark-50 rounded-xl p-3">
                      <p className="text-xs text-dark-600 mb-1">QR Data</p>
                      <p className="font-mono text-sm text-dark-800 break-all">
                        {selectedQR.qrData}
                      </p>
                    </div>

                    <div className="bg-dark-50 rounded-xl p-3">
                      <p className="text-xs text-dark-600 mb-1">Chất liệu</p>
                      <p className="font-semibold text-dark-800">
                        {getMaterialDisplayName(selectedQR.material)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadQRCode(selectedQR)}
                      className="flex-1 bg-primary-500 text-white rounded-xl py-3 font-semibold hover:bg-primary-600 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Tải xuống
                    </button>
                    <button
                      onClick={() => {
                        copyQRData(selectedQR.qrData);
                        setSelectedQR(null);
                      }}
                      className="flex-1 bg-dark-100 text-dark-800 rounded-xl py-3 font-semibold hover:bg-dark-200 transition flex items-center justify-center gap-2"
                    >
                      <Copy className="w-5 h-5" />
                      Copy
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

