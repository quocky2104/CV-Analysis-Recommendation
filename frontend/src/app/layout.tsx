import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CVision AI - Phân tích & Tối ưu hóa CV theo chuẩn JD',
  description:
    'Hệ thống đánh giá mức độ phù hợp hồ sơ ứng viên đối chiếu với mô tả công việc, trích xuất bằng chứng xác thực và hỗ trợ tối ưu hóa CV bằng AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <Toaster position="top-right" richColors closeButton theme="light" />
      </body>
    </html>
  );
}
