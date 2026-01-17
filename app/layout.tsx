import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
import ConditionalFooter from '@/components/ConditionalFooter';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SipSmart - Mượn Ly Sành Điệu, Sống Xanh Đúng Điệu',
  description: 'SipSmart là nền tảng tiên phong giúp thế hệ trẻ trải nghiệm lối sống không rác thải nhựa. Mượn ly dễ dàng tại mọi cửa hàng đối tác, tích điểm xanh và nhận ưu đãi độc quyền. Cùng chúng mình cứu hành tinh từ những ngụm nước nhỏ nhất!',
  keywords: 'SipSmart, mượn ly, bảo vệ môi trường, rác thải nhựa, Gen Z, sống bền vững',

  // Thêm Logo Favicon
  icons: {
    icon: 'https://files.catbox.moe/9k6yfb.png',
    apple: 'https://files.catbox.moe/9k6yfb.png',
  },

  // Thêm OG Image để hiển thị khi share link
  openGraph: {
    title: 'SipSmart - Giải Pháp Ly Tái Sử Dụng Thông Minh',
    description: 'Tham gia cộng đồng sống xanh cùng SipSmart ngay hôm nay!',
    url: 'https://sipsmart.vn',
    siteName: 'SipSmart',
    images: [
      {
        url: 'https://files.catbox.moe/6w06d9.png',
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
      <head>
      </head>
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
