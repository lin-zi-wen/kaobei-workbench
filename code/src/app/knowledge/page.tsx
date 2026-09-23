"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { KNOWLEDGE_CATEGORIES } from "@/lib/utils";
import { Search, BookOpen, ExternalLink, Filter } from "lucide-react";

export default function KnowledgePage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    api.knowledge(`?${params.toString()}`)
      .then(r => setItems(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [cat]);
  useEffect(() => {
    api.knowledgeCategories().then(r => setCategories(r.categories));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-serif font-bold text-ink-900">知识库</h1>
        <p className="text-sm text-ink-900-500 mt-1">浏览、搜索与管理学习资料</p>
      </header>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-900-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索标题或内容..." className="form-input pl-9" />
        </div>
        <button type="submit" className="btn-primary">搜索</button>
      </form>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setCat("")} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${cat === "" ? "bg-pine-600 text-white" : "bg-paper-200 text-ink-900 hover:bg-paper-300"}`}>
          全部
        </button>
        {KNOWLEDGE_CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${cat === c.key ? "bg-pine-600 text-white" : "bg-paper-200 text-ink-900 hover:bg-paper-300"}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map(c => (
          <div key={c.category} onClick={() => setCat(c.category)} className="p-3 bg-white rounded-lg border border-paper-300 cursor-pointer hover:border-pine-300 transition-colors">
            <p className="text-xs text-ink-900-500">{KNOWLEDGE_CATEGORIES.find(k => k.key === c.category)?.label || c.category}</p>
            <p className="text-lg font-bold text-ink-900 mt-1">{c.count}</p>
          </div>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <p className="text-ink-900-500">加载中...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-paper-300 p-4 card-hover flex items-start gap-4">
              <div className="w-10 h-10 bg-paper-100 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-seal" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-ink-900 truncate">{item.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="tag-pill">{KNOWLEDGE_CATEGORIES.find(k => k.key === item.category)?.label || item.category}</span>
                  {item.sourceName && <span className="tag-pill">{item.sourceName}</span>}
                  {item.status === "failed" && <span className="tag-pill bg-red-100 text-red-600">解析失败</span>}
                </div>
                {item.contentText && <p className="text-sm text-ink-900-500 mt-2 line-clamp-2">{item.contentText}</p>}
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2">
                {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-pine-600 hover:underline">
                    <ExternalLink size={14} /> 打开
                  </a>
                )}
                <span className="text-xs text-ink-900-500">{item.contentType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && items.length === 0 && <p className="text-sm text-ink-900-500 text-center py-8">无匹配结果</p>}
    </div>
  );
}
