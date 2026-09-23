"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BarChart3, TrendingUp, Calendar, Clock } from "lucide-react";

export default function ReportPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [type, setType] = useState("weekly");

  useEffect(() => {
    api.reports(`?type=${type}`).then(r => setReports(r.reports));
  }, [type]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-900">学习报告</h1>
          <p className="text-sm text-ink-900-500 mt-1">周报统计与学习趋势</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setType("weekly")} className={`px-3 py-1.5 rounded-lg text-sm ${type === "weekly" ? "bg-pine-600 text-white" : "bg-paper-200 text-ink-900"}`}>周报</button>
          <button onClick={() => setType("monthly")} className={`px-3 py-1.5 rounded-lg text-sm ${type === "monthly" ? "bg-pine-600 text-white" : "bg-paper-200 text-ink-900"}`}>月报</button>
        </div>
      </header>

      <div className="space-y-4">
        {reports.map(r => {
          const data = r.dataJson ? JSON.parse(r.dataJson) : {};
          return (
            <div key={r.id} className="bg-white rounded-xl border border-paper-300 p-5 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-pine-600" />
                  <h3 className="font-medium text-ink-900">{type === "weekly" ? "周报" : "月报"} · {r.periodStart} ~ {r.periodEnd}</h3>
                </div>
                <span className="text-xs text-ink-900-500">{r.generatedAt?.slice(0, 10)}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <StatBox icon={Clock} label="总学习时长" value={`${Math.round((data.totalDurationSeconds || 0) / 60)} 分钟`} />
                <StatBox icon={Calendar} label="打卡天数" value={`${data.checkInDays || 0} 天`} />
                <StatBox icon={BarChart3} label="做题数量" value={`${data.questionCount || 0} 题`} />
                <StatBox icon={TrendingUp} label="正确率" value={`${data.correctRate || 0}%`} />
              </div>

              {r.aiSummary && (
                <div className="p-3 bg-pine-50 rounded-lg">
                  <p className="text-sm text-ink-900"><span className="font-medium">AI 总结：</span>{r.aiSummary}</p>
                </div>
              )}

              {data.subjectBreakdown && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">科目分布</p>
                  <div className="space-y-2">
                    {Object.entries(data.subjectBreakdown).map(([name, val]: [string, any]) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-sm w-20 truncate">{name}</span>
                        <div className="flex-1 h-2 bg-paper-200 rounded-full overflow-hidden">
                          <div className="h-full bg-pine-500 rounded-full" style={{ width: `${Math.min(val.percentage || 0, 100)}%` }} />
                        </div>
                        <span className="text-xs text-ink-900-500 w-12 text-right">{val.percentage || 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reports.length === 0 && <p className="text-sm text-ink-900-500 text-center py-8">暂无报告数据</p>}
    </div>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-3 bg-paper-50 rounded-lg text-center">
      <Icon size={16} className="mx-auto mb-1 text-seal" />
      <p className="text-xs text-ink-900-500">{label}</p>
      <p className="text-lg font-bold text-ink-900 mt-0.5">{value}</p>
    </div>
  );
}
