import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ConditionalFooter from '@/components/ConditionalFooter';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SipSmart - Mượn Ly Sành Điệu, Sống Xanh Đúng Điệu',
  description: 'SipSmart - Nền tảng mượn ly công nghệ giúp bạn sống xanh sành điệu. Quét QR mượn ly, trả tại bất kỳ trạm nào, tích điểm đổi voucher và quà tặng giá trị. Gia nhập cộng đồng Zero Waste bảo vệ môi trường ngay hôm nay!',
  keywords: 'SipSmart, mượn ly, bảo vệ môi trường, rác thải nhựa, Gen Z, sống bền vững, zero waste, tái sử dụng',

  // Thêm Logo Favicon
  icons: {
    icon: 'https://files.catbox.moe/9k6yfb.png',
    apple: 'https://files.catbox.moe/9k6yfb.png',
  },

  // Thêm OG Image để hiển thị khi share link
  openGraph: {
    title: 'SipSmart - Sống Xanh Sành Điệu Cùng Ly Thông Minh',
    description: 'Quét QR mượn ly, tích điểm đổi quà và chung tay giảm rác thải nhựa. Tham gia cộng đồng SipSmart ngay!',
    url: 'https://cupsipmart-uefedu-qt.vercel.app',
    siteName: 'SipSmart',
    images: [
      {
        url: 'https://files.catbox.moe/xn94e9.png',
        width: 1200,
        height: 630,
        alt: 'SipSmart Social Preview',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">

      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <ClientLayoutWrapper>
            <main className="flex-1">
              {children}
            </main>
            <ConditionalFooter />
          </ClientLayoutWrapper>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#1f2937',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            },
          }}
        />
      </body>
    </html>
  );
}
