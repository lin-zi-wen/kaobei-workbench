"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, todayStr } from "@/lib/utils";
import { Plus, Trash2, Edit3, CalendarDays, Clock, AlertTriangle } from "lucide-react";

export default function PlanPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", planDate: todayStr(), startTime: "", endTime: "", estimatedMinutes: "", note: "" });

  const load = () => {
    const params = new URLSearchParams();
    if (filterDate) params.set("date", filterDate);
    if (filterStatus) params.set("status", filterStatus);
    api.plans(`?${params.toString()}`).then(r => setPlans(r.plans));
  };

  useEffect(() => { load(); }, [filterDate, filterStatus]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : null };
    if (editing) {
      await api.updatePlan(editing.id, body);
      setEditing(null);
    } else {
      await api.createPlan(body);
    }
    setShowForm(false);
    setForm({ title: "", planDate: todayStr(), startTime: "", endTime: "", estimatedMinutes: "", note: "" });
    load();
  };

  const toggleStatus = async (p: any) => {
    const newStatus = p.status === "done" ? "todo" : "done";
    await api.updatePlan(p.id, { status: newStatus, completedAt: newStatus === "done" ? new Date().toISOString() : null });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await api.deletePlan(id);
    load();
  };

  const overdue = (p: any) => p.planDate < todayStr() && p.status !== "done";
  const postponed = (p: any) => p.originalDate && p.originalDate !== p.planDate;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-900">计划中心</h1>
          <p className="text-sm text-ink-900-500 mt-1">管理每日学习任务，逾期自动顺延</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> 新建计划
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="form-input w-auto" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-input w-auto">
          <option value="">全部状态</option>
          <option value="todo">待办</option>
          <option value="done">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
        {(filterDate || filterStatus) && (
          <button onClick={() => { setFilterDate(""); setFilterStatus(""); }} className="btn-secondary">清除筛选</button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-paper-300 p-5">
          <h3 className="font-serif font-bold mb-4">{editing ? "编辑计划" : "新建计划"}</h3>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required placeholder="任务标题" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="form-input" />
            <input type="date" required value={form.planDate} onChange={e => setForm({ ...form, planDate: e.target.value })} className="form-input" />
            <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="form-input" />
            <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="form-input" />
            <input type="number" placeholder="预计分钟" value={form.estimatedMinutes} onChange={e => setForm({ ...form, estimatedMinutes: e.target.value })} className="form-input" />
            <input placeholder="备注" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="form-input" />
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">保存</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-paper-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">标题</th>
                <th className="text-left px-4 py-3 font-medium">日期</th>
                <th className="text-left px-4 py-3 font-medium">时长</th>
                <th className="text-left px-4 py-3 font-medium">标签</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {plans.map(p => (
                <tr key={p.id} className={overdue(p) ? "bg-ochre-50" : ""}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(p)} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${p.status === "done" ? "bg-pine-600 border-pine-600" : "border-ink-500"}`}>
                      {p.status === "done" && <span className="text-white text-xs">✓</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.status === "done" ? "line-through text-ink-900-500" : "text-ink-900"}>{p.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <CalendarDays size={14} className="text-ink-900-500" />
                      <span>{p.planDate}</span>
                      {overdue(p) && <AlertTriangle size={14} className="text-ochre" />}
                      {postponed(p) && <span className="text-xs text-ochre">(顺延)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.estimatedMinutes ? <span className="flex items-center gap-1"><Clock size={14} className="text-ink-900-500" /> {p.estimatedMinutes}m</span> : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {overdue(p) && <span className="tag-pill bg-ochre-100 text-ochre-700">逾期</span>}
                      {postponed(p) && <span className="tag-pill bg-seal-100 text-seal-700">顺延</span>}
                      {p.status === "done" && <span className="tag-pill bg-pine-100 text-pine-700">完成</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(p); setForm({ title: p.title, planDate: p.planDate, startTime: p.startTime || "", endTime: p.endTime || "", estimatedMinutes: p.estimatedMinutes || "", note: p.note || "" }); setShowForm(true); }} className="p-1 hover:bg-paper-200 rounded"><Edit3 size={14} /></button>
                      <button onClick={() => del(p.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {plans.length === 0 && <p className="p-6 text-sm text-ink-900-500 text-center">暂无计划</p>}
      </div>
    </div>
  );
}
