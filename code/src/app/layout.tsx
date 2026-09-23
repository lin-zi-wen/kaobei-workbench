import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "备考工作台 - 系统分析师",
  description: "单用户 AI 增强型个人备考系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-paper-50">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 desktop:pl-0 pl-0">
            <div className="desktop:p-8 p-4 pt-16 desktop:pt-8 max-w-6xl mx-auto page-enter">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
