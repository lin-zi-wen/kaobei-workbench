"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ERROR_TAG_LABELS, QUESTION_TYPE_LABELS } from "@/lib/utils";
import { AlertCircle, CheckCircle, HelpCircle, RotateCcw, BrainCircuit } from "lucide-react";

export default function MistakePage() {
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [filter, setFilter] = useState("due");
  const [reviewing, setReviewing] = useState<any>(null);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);

  const load = () => {
    const params = filter === "due" ? "?due=today" : filter ? `?status=${filter}` : "";
    api.mistakes(params).then(r => setMistakes(r.mistakes));
  };

  useEffect(() => { load(); }, [filter]);

  const startReview = (m: any) => {
    setReviewing(m);
    setSelectedQuality(null);
  };

  const submitReview = async () => {
    if (!reviewing || selectedQuality === null) return;
    await api.reviewMistake(reviewing.id, { quality: selectedQuality });
    setReviewing(null);
    setSelectedQuality(null);
    load();
  };

  if (reviewing) {
    const options = reviewing.questionType === "single_choice" && reviewing.optionsJson
      ? JSON.parse(reviewing.optionsJson)
      : [];

    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-serif font-bold text-ink-900">错题复习</h1>
          <p className="text-sm text-ink-900-500 mt-1">SM-2 算法驱动，科学间隔复习</p>
        </header>

        <div className="bg-white rounded-xl border border-paper-300 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="tag-pill">{QUESTION_TYPE_LABELS[reviewing.questionType] || reviewing.questionType}</span>
            <span className="tag-pill bg-ochre-100 text-ochre-700">第 {reviewing.reviewCount + 1} 次复习</span>
          </div>

          <p className="text-base font-medium text-ink-900 mb-4">{reviewing.questionStem}</p>

          {options.length > 0 && (
            <div className="space-y-2 mb-6">
              {options.map((opt: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-paper-300 bg-paper-50">
                  <span className="text-sm">{opt.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 bg-pine-50 rounded-lg mb-6">
            <p className="text-sm"><span className="font-medium">正确答案：</span>{reviewing.correctAnswer}</p>
            {reviewing.explanation && <p className="text-sm mt-2"><span className="font-medium">解析：</span>{reviewing.explanation}</p>}
          </div>

          <div className="space-y-3">
            <p className="font-medium text-sm">本次复习结果：</p>
            <div className="flex gap-3">
              <button onClick={() => setSelectedQuality(0)} className={`flex-1 p-3 rounded-lg border text-center transition-colors ${selectedQuality === 0 ? "border-red-400 bg-red-50 text-red-700" : "border-paper-300 hover:bg-paper-50"}`}>
                <XCircle size={20} className="mx-auto mb-1" />
                <p className="text-sm font-medium">答错</p>
                <p className="text-xs text-ink-900-500">重置间隔</p>
              </button>
              <button onClick={() => setSelectedQuality(3)} className={`flex-1 p-3 rounded-lg border text-center transition-colors ${selectedQuality === 3 ? "border-ochre-400 bg-ochre-50 text-ochre-700" : "border-paper-300 hover:bg-paper-50"}`}>
                <HelpCircle size={20} className="mx-auto mb-1" />
                <p className="text-sm font-medium">不确定</p>
                <p className="text-xs text-ink-900-500">缩短间隔</p>
              </button>
              <button onClick={() => setSelectedQuality(5)} className={`flex-1 p-3 rounded-lg border text-center transition-colors ${selectedQuality === 5 ? "border-pine-400 bg-pine-50 text-pine-700" : "border-paper-300 hover:bg-paper-50"}`}>
                <CheckCircle size={20} className="mx-auto mb-1" />
                <p className="text-sm font-medium">答对</p>
                <p className="text-xs text-ink-900-500">延长间隔</p>
              </button>
            </div>
            <button onClick={submitReview} disabled={selectedQuality === null} className="btn-primary w-full">提交复习结果</button>
            <button onClick={() => setReviewing(null)} className="btn-secondary w-full">取消</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-900">错题本</h1>
          <p className="text-sm text-ink-900-500 mt-1">基于 SM-2 算法的智能复习队列</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter("due")} className={`px-3 py-1.5 rounded-lg text-sm ${filter === "due" ? "bg-pine-600 text-white" : "bg-paper-200 text-ink-900"}`}>今日待复习</button>
          <button onClick={() => setFilter("unmastered")} className={`px-3 py-1.5 rounded-lg text-sm ${filter === "unmastered" ? "bg-pine-600 text-white" : "bg-paper-200 text-ink-900"}`}>未掌握</button>
          <button onClick={() => setFilter("reviewing")} className={`px-3 py-1.5 rounded-lg text-sm ${filter === "reviewing" ? "bg-pine-600 text-white" : "bg-paper-200 text-ink-900"}`}>复习中</button>
          <button onClick={() => setFilter("mastered")} className={`px-3 py-1.5 rounded-lg text-sm ${filter === "mastered" ? "bg-pine-600 text-white" : "bg-paper-200 text-ink-900"}`}>已掌握</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {mistakes.map(m => (
          <div key={m.id} className="bg-white rounded-xl border border-paper-300 p-4 card-hover flex items-start gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 line-clamp-2">{m.questionStem}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="tag-pill">{ERROR_TAG_LABELS[m.errorTag] || m.errorTag}</span>
                <span className="tag-pill">{QUESTION_TYPE_LABELS[m.questionType] || m.questionType}</span>
                <span className="tag-pill">错{m.wrongCount}次</span>
                <span className="text-xs text-ink-900-500 flex items-center gap-1">
                  <RotateCcw size={12} /> 下次：{m.nextReviewDate}
                </span>
              </div>
            </div>
            <button onClick={() => startReview(m)} className="btn-primary text-sm flex items-center gap-1 shrink-0">
              <BrainCircuit size={14} /> 复习
            </button>
          </div>
        ))}
      </div>

      {mistakes.length === 0 && <p className="text-sm text-ink-900-500 text-center py-8">暂无错题</p>}
    </div>
  );
}
