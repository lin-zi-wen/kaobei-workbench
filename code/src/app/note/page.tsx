"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Pin, Trash2, Edit3, Save, X } from "lucide-react";

export default function NotePage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", tagList: "" });

  const load = () => {
    api.notes().then(r => setNotes(r.notes));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.updateNote(editing.id, form);
      setEditing(null);
    } else {
      await api.createNote(form);
    }
    setShowForm(false);
    setForm({ title: "", content: "", tagList: "" });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await api.deleteNote(id);
    load();
  };

  const togglePin = async (n: any) => {
    await api.updateNote(n.id, { isPinned: n.isPinned ? 0 : 1 });
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-900">笔记</h1>
          <p className="text-sm text-ink-900-500 mt-1">记录学习心得与重点</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> 新建笔记
        </button>
      </header>

      {showForm && (
        <div className="bg-white rounded-xl border border-paper-300 p-5">
          <h3 className="font-serif font-bold mb-4">{editing ? "编辑笔记" : "新建笔记"}</h3>
          <form onSubmit={submit} className="space-y-4">
            <input required placeholder="标题" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="form-input" />
            <textarea required placeholder="内容（支持 Markdown）" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} className="form-input" />
            <input placeholder="标签，用逗号分隔" value={form.tagList} onChange={e => setForm({ ...form, tagList: e.target.value })} className="form-input" />
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-1"><Save size={14} /> 保存</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex items-center gap-1"><X size={14} /> 取消</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {notes.map(n => (
          <div key={n.id} className={`bg-white rounded-xl border p-4 card-hover ${n.isPinned ? "border-ochre-300" : "border-paper-300"}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {n.isPinned && <Pin size={14} className="text-ochre" />}
                <h3 className="font-medium text-ink-900">{n.title}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => togglePin(n)} className="p-1 hover:bg-paper-200 rounded"><Pin size={14} className={n.isPinned ? "text-ochre" : "text-ink-900-500"} /></button>
                <button onClick={() => { setEditing(n); setForm({ title: n.title, content: n.content, tagList: n.tagList || "" }); setShowForm(true); }} className="p-1 hover:bg-paper-200 rounded"><Edit3 size={14} /></button>
                <button onClick={() => del(n.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-sm text-ink-900-500 mt-2 whitespace-pre-wrap line-clamp-3">{n.content}</p>
            {n.tagList && (
              <div className="flex gap-1 mt-3 flex-wrap">
                {n.tagList.split(",").map((t: string) => (
                  <span key={t} className="tag-pill">{t.trim()}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {notes.length === 0 && <p className="text-sm text-ink-900-500 text-center py-8">暂无笔记</p>}
    </div>
  );
}
