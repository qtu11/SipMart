'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, CheckCircle, AlertCircle, Camera, Keyboard, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { User as FirebaseUser } from 'firebase/auth';

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    action: 'borrow' | 'return' | 'cleaning' | 'invalid';
    cupId?: string;
    message?: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCupId, setManualCupId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader';

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      // Lấy user hiện tại
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserId(currentUser.id);
      } else {
        const unsubscribe = onAuthChange((user: any | null) => {
          if (user) {
            setUserId(user.id);
          } else {
            router.push('/auth/login');
          }
        });
        return () => unsubscribe();
      }
    };
    checkUser();
  }, [router]);

  const startScanning = async () => {
    try {
      setCameraError(null);

      // Kiểm tra xem có hỗ trợ camera không
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ camera');
      }

      // Tạo instance Html5Qrcode
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      // Bắt đầu quét với camera sau
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code được quét thành công
          handleQRScan(decodedText);
        },
        (errorMessage) => {
          // Lỗi quét (không phải lỗi camera)
          // Không hiển thị lỗi vì đây là quá trình quét bình thường
        }
      );

      setScanning(true);
    } catch (error: unknown) {
      const err = error as Error;
      // Removed console.error
      setCameraError(err.message || 'Không thể truy cập camera');

      // Hiển thị thông báo lỗi chi tiết
      if (err.name === 'NotAllowedError') {
        toast.error('Vui lòng cấp quyền truy cập camera');
      } else if (err.name === 'NotFoundError') {
        toast.error('Không tìm thấy camera. Vui lòng nhập mã QR thủ công.');
        setShowManualInput(true);
      } else if (err.name === 'NotReadableError') {
        toast.error('Camera đang được sử dụng bởi ứng dụng khác');
      } else {
        toast.error('Không thể truy cập camera. Vui lòng thử lại hoặc nhập mã thủ công.');
        setShowManualInput(true);
      }
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
      scannerRef.current = null;
    } catch (error: unknown) {
      const err = error as Error;
      // Removed console.error
    }
    setScanning(false);
    setResult(null);
    setCameraError(null);
  };

  const handleQRScan = async (qrData: string) => {
    // Tránh xử lý nhiều lần
    if (processing) return;

    setProcessing(true);
    try {
      // Dừng quét để tránh quét nhiều lần
      await stopScanning();

      // Parse QR code data để lấy cup ID
      const { parseQRCodeData } = await import('@/lib/utils/cupId');
      const parsed = parseQRCodeData(qrData);

      if (!parsed || !parsed.cupId) {
        toast.error('Mã QR không hợp lệ. Vui lòng quét lại.');
        setProcessing(false);
        return;
      }

      const cupId = parsed.cupId;

      // Get current session token
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        router.push('/auth/login');
        setProcessing(false);
        return;
      }

      // Gọi API để nhận diện hành vi
      const res = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ qrData }),
      });

      const data = await res.json();
      setResult(data);

      // Tự động xử lý nếu là borrow hoặc return
      if (data.action === 'borrow') {
        await handleBorrow(cupId);
      } else if (data.action === 'return') {
        await handleReturn(cupId);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Lỗi khi quét QR');
      // Log removed
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCupId.trim()) {
      toast.error('Vui lòng nhập mã QR');
      return;
    }
    handleQRScan(manualCupId.trim());
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    setProcessing(true);
    try {
      // Sử dụng html5-qrcode để decode từ file
      // Sử dụng html5-qrcode để decode từ file
      // Sử dụng div ẩn có sẵn trong DOM để tránh lỗi element not found
      const tempId = 'file-scan-temp';
      const html5QrCode = new Html5Qrcode(tempId);

      // Decode từ file (true = verbose logging)
      const decodedText = await html5QrCode.scanFile(file, true);

      if (decodedText) {
        await handleQRScan(decodedText);
      } else {
        toast.error('Không tìm thấy mã QR trong ảnh. Vui lòng thử lại với ảnh khác.');
      }
    } catch (error: unknown) {
      const err = error as Error;
      // Log removed
      const errorMessage = err.message || '';
      if (errorMessage.includes('No QR code found') || errorMessage.includes('QR code parse error')) {
        toast.error('Không tìm thấy mã QR trong ảnh. Vui lòng thử lại với ảnh khác hoặc chụp lại ảnh rõ hơn.');
      } else {
        toast.error('Không thể đọc mã QR từ ảnh. Vui lòng thử lại với ảnh khác hoặc quét bằng camera.');
      }
    } finally {
      setProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleBorrow = async (cupId: string) => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập');
      router.push('/auth/login');
      return;
    }

    try {
      // Get auth token & fetch cup's storeId
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Phiên đăng nhập đã hết hạn.');
        router.push('/auth/login');
        return;
      }

      // Fetch storeId from cup
      const { data: cupData, error: cupError } = await supabase
        .from('cups')
        .select('store_id')
        .eq('cup_id', cupId)
        .single();

      if (cupError || !cupData?.store_id) {
        toast.error('Không tìm thấy thông tin cửa hàng của ly.');
        return;
      }

      const storeId = cupData.store_id;

      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ cupId, storeId }),
      });

      const data = await res.json();
      if (data.success) {
        // Redirect to home with success notification
        router.push('/?borrowSuccess=true');
      } else {
        toast.error(data.error);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Lỗi khi mượn ly');
    }
  };

  const handleReturn = async (cupId: string) => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập');
      router.push('/auth/login');
      return;
    }

    const storeId = 'store1'; // Mock

    try {
      // Get auth token
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Phiên đăng nhập đã hết hạn.');
        router.push('/auth/login');
        return;
      }

      const res = await fetch('/api/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ cupId, storeId }),
      });

      const data = await res.json();
      if (data.success) {
        // Redirect to home with success notification
        router.push('/?returnSuccess=true');
      } else {
        toast.error(data.error);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Lỗi khi trả ly');
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="relative bg-dark-800/80 backdrop-blur-md px-4 py-4 flex items-center gap-4 border-b border-dark-700">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 hover:bg-dark-700 rounded-xl flex items-center justify-center transition"
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Quét QR Code</h1>
      </header>

      {/* Scanner Area */}
      <div className="relative flex-1">
        {!scanning && !showManualInput ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-dark-800 rounded-2xl p-8 mb-6"
            >
              <QrCode className="w-24 h-24 text-primary-400 mx-auto" />
            </motion.div>
            <div className="space-y-3 w-full max-w-sm">
              <button
                onClick={startScanning}
                className="w-full bg-primary-500 text-white rounded-2xl px-8 py-4 font-semibold shadow-medium flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Bắt đầu quét bằng camera
              </button>
              <button
                onClick={handleSelectImage}
                disabled={processing}
                className="w-full bg-primary-400 text-white rounded-2xl px-8 py-4 font-semibold shadow-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon className="w-5 h-5" />
                Chọn ảnh từ gallery
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full bg-dark-800 text-white rounded-2xl px-8 py-4 font-semibold border border-dark-700 flex items-center justify-center gap-2"
              >
                <Keyboard className="w-5 h-5" />
                Nhập mã QR thủ công
              </button>
            </div>
            {cameraError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-sm text-red-200 max-w-sm"
              >
                <p className="font-semibold mb-1">Lỗi camera:</p>
                <p>{cameraError}</p>
              </motion.div>
            )}
          </div>
        ) : showManualInput ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-800 rounded-2xl p-6 w-full max-w-sm"
            >
              <h2 className="text-xl font-semibold mb-4 text-center">
                Nhập mã QR thủ công
              </h2>
              <input
                type="text"
                value={manualCupId}
                onChange={(e) => setManualCupId(e.target.value)}
                placeholder="Nhập mã QR code..."
                className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowManualInput(false);
                    setManualCupId('');
                  }}
                  className="flex-1 bg-dark-700 text-white rounded-xl py-3 font-semibold"
                >
                  Hủy
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={processing || !manualCupId.trim()}
                  className="flex-1 bg-primary-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="relative">
            <div id={scannerId} className="w-full" />
            {/* Overlay với khung quét */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-primary-500 rounded-2xl relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-2xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-2xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-2xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-2xl" />
              </div>
            </div>
            {/* Hướng dẫn */}
            <div className="absolute bottom-20 left-0 right-0 text-center px-4 pointer-events-none">
              <p className="text-white/80 text-sm bg-black/50 rounded-lg px-4 py-2 inline-block">
                Đưa mã QR vào khung để quét
              </p>
            </div>
            <button
              onClick={stopScanning}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-dark-800/90 text-white rounded-full p-4 shadow-lg hover:bg-dark-700 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Hidden div for file scanning */}
        <div id="file-scan-temp" style={{ display: 'none' }} />

        {/* Result Modal */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setResult(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  {result.action === 'borrow' || result.action === 'return' ? (
                    <CheckCircle className="w-16 h-16 text-primary-500 mx-auto" />
                  ) : (
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">
                  {result.message}
                </h3>
                <p className="text-dark-500 text-center text-sm mb-6">
                  {result.cupId}
                </p>
                <button
                  onClick={() => setResult(null)}
                  className="w-full bg-primary-500 text-white rounded-xl py-3 font-semibold"
                >
                  Đóng
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

