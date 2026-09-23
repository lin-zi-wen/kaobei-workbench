"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, todayStr } from "@/lib/utils";
import {
  CalendarDays,
  Flame,
  Target,
  BookOpen,
  Award,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-ink-900-500">加载中...</div>;
  if (!data) return <div className="text-ink-900-500">加载失败</div>;

  const today = todayStr();
  const year = new Date().getFullYear();

  // Build heatmap grid (last 52 weeks)
  const weeks: { date: string; value: number }[][] = [];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 364);
  let currentWeek: { date: string; value: number }[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ date: ds, value: data.heatmap[ds] || 0 });
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const heatmapLevel = (seconds: number) => {
    if (seconds === 0) return "bg-paper-200";
    if (seconds < 1800) return "bg-ochre-200";
    if (seconds < 3600) return "bg-ochre-400";
    if (seconds < 7200) return "bg-ochre-600";
    return "bg-ochre-800";
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-900">学习驾驶舱</h1>
          <p className="text-sm text-ink-900-500 mt-1">{today} · 系统分析师备考</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-pine-50 rounded-lg">
            <Flame size={18} className="text-ochre" />
            <span className="text-sm font-medium">连续打卡 {data.streak} 天</span>
          </div>
        </div>
      </header>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="今日任务" value={`${data.tasksToday.filter((t: any) => t.status === "done").length}/${data.tasksToday.length}`} color="pine" />
        <StatCard icon={Target} label="本周完成" value={`${data.weekly.done}/${data.weekly.total}`} color="ochre" />
        <StatCard icon={BookOpen} label="在学科目" value={`${data.subjectProgress?.length || 0}`} color="seal" />
        <StatCard icon={Award} label="已获得徽章" value={`${data.badges?.length || 0}`} color="pine" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's tasks */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-paper-300 p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-bold text-lg">今日任务</h2>
            <Link href="/plan" className="text-sm text-pine-600 hover:underline">查看全部</Link>
          </div>
          {data.tasksToday.length === 0 ? (
            <p className="text-sm text-ink-900-500">今日暂无计划任务</p>
          ) : (
            <div className="space-y-3">
              {data.tasksToday.map((t: any) => (
                <div key={t.id} className="flex items-start gap-3 p-3 bg-paper-50 rounded-lg">
                  {t.status === "done" ? <CheckCircle2 size={18} className="text-pine-600 mt-0.5 shrink-0" /> : <Circle size={18} className="text-ink-900-500 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${t.status === "done" ? "line-through text-ink-900-500" : "text-ink-900"}`}>{t.title}</p>
                    {t.estimatedMinutes && <p className="text-xs text-ink-900-500 mt-0.5 flex items-center gap-1"><Clock size={12} /> {t.estimatedMinutes} 分钟</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-paper-300 p-5 card-hover">
          <h2 className="font-serif font-bold text-lg mb-4">学习热力图 · {year}</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className={`heatmap-cell ${heatmapLevel(day.value)}`}
                      title={`${day.date}: ${Math.round(day.value / 60)} 分钟`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-ink-900-500">
            <span>少</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-paper-200 rounded-sm" />
              <div className="w-3 h-3 bg-ochre-200 rounded-sm" />
              <div className="w-3 h-3 bg-ochre-400 rounded-sm" />
              <div className="w-3 h-3 bg-ochre-600 rounded-sm" />
              <div className="w-3 h-3 bg-ochre-800 rounded-sm" />
            </div>
            <span>多</span>
          </div>
        </div>
      </div>

      {/* Subject progress */}
      <div className="bg-white rounded-xl border border-paper-300 p-5 card-hover">
        <h2 className="font-serif font-bold text-lg mb-4">科目进度</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.subjectProgress?.map((s: any) => {
            const pct = s.totalQuestions > 0 ? Math.round((s.correctQuestions / s.totalQuestions) * 100) : 0;
            return (
              <div key={s.id} className="p-4 bg-paper-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{s.name}</span>
                  <span className="text-xs text-ink-900-500">{s.correctQuestions}/{s.totalQuestions}</span>
                </div>
                <div className="w-full h-2 bg-paper-200 rounded-full overflow-hidden">
                  <div className="h-full bg-pine-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-ink-900-500 mt-1">正确率 {pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mock exams */}
      <div className="bg-white rounded-xl border border-paper-300 p-5 card-hover">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-bold text-lg">近期模考</h2>
          <Link href="/exam" className="text-sm text-pine-600 hover:underline">去题库</Link>
        </div>
        {data.mockExams?.length === 0 ? (
          <p className="text-sm text-ink-900-500">暂无模考记录</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.mockExams.map((e: any) => (
              <div key={e.id} className="p-4 bg-paper-50 rounded-lg">
                <p className="font-medium text-sm truncate">{e.name}</p>
                <p className="text-xs text-ink-900-500 mt-1">{e.examDate}</p>
                <p className="text-lg font-bold text-pine-700 mt-2">{e.score}<span className="text-xs text-ink-900-500 font-normal"> / {e.fullScore}</span></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    pine: "bg-pine-50 text-pine-700",
    ochre: "bg-ochre-50 text-ochre-700",
    seal: "bg-seal-50 text-seal-700",
  };
  return (
    <div className={`p-4 rounded-xl ${colorMap[color] || "bg-paper-100"} card-hover`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
