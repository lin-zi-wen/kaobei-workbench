"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Bot,
  FileQuestion,
  AlertCircle,
  NotebookPen,
  BarChart3,
  Settings,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "学习驾驶舱", icon: LayoutDashboard },
  { href: "/plan", label: "计划中心", icon: CalendarDays },
  { href: "/knowledge", label: "知识库", icon: BookOpen },
  { href: "/ai", label: "AI 助手", icon: Bot },
  { href: "/exam", label: "题库与做题", icon: FileQuestion },
  { href: "/mistake", label: "错题本", icon: AlertCircle },
  { href: "/note", label: "笔记", icon: NotebookPen },
  { href: "/report", label: "学习报告", icon: BarChart3 },
  { href: "/settings", label: "设置", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="desktop:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="desktop:hidden fixed inset-0 z-40 sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed desktop:static inset-y-0 left-0 z-40 w-sidebar bg-paper-100 border-r border-paper-300 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full desktop:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-paper-300 flex items-center gap-3">
          <div className="w-9 h-9 bg-pine-600 rounded-lg flex items-center justify-center text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-ink-900 leading-tight">备考工作台</h1>
            <p className="text-[11px] text-ink-900-500">系统分析师</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-pine-50 text-pine-700 font-medium"
                    : "text-ink-900-500 hover:bg-paper-200 hover:text-ink-900"
                )}
              >
                <Icon size={18} className={cn("shrink-0", active ? "text-pine-600" : "text-seal")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-paper-300 text-[11px] text-ink-900-500 text-center">
          v0.1.0 · 单用户本地版
        </div>
      </aside>
    </>
  );
}
