"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { QUESTION_TYPE_LABELS } from "@/lib/utils";
import { FileText, Play, CheckCircle, XCircle, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

export default function ExamPage() {
  const [view, setView] = useState<"list" | "exam">("list");
  const [exams, setExams] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [result, setResult] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    api.mockExams().then(r => setExams(r.exams));
  }, []);

  const startExam = async (source: string) => {
    const res = await api.questions(`?source=${encodeURIComponent(source)}`);
    const qs = res.questions;
    if (qs.length === 0) return;
    setQuestions(qs);
    setCurrentIndex(0);
    setSelectedAnswer("");
    setResult(null);
    setScore(0);
    setAnsweredCount(0);
    setView("exam");
  };

  const submitAnswer = async () => {
    const q = questions[currentIndex];
    const res = await api.submitAnswer({ questionId: q.id, answerGiven: selectedAnswer, source: "practice" });
    setResult(res);
    setAnsweredCount(prev => prev + 1);
    if (res.isCorrect) setScore(prev => prev + 1);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer("");
      setResult(null);
    }
  };

  const currentQ = questions[currentIndex];
  const options = currentQ?.optionsJson ? JSON.parse(currentQ.optionsJson) : [];

  if (view === "exam" && currentQ) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("list")} className="flex items-center gap-1 text-sm text-ink-900-500 hover:text-ink-900">
            <ChevronLeft size={16} /> 返回列表
          </button>
          <div className="text-sm text-ink-900-500">
            第 {currentIndex + 1} / {questions.length} 题 · 得分 {score}/{answeredCount}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-paper-300 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="tag-pill">{QUESTION_TYPE_LABELS[currentQ.type] || currentQ.type}</span>
            {currentQ.source && <span className="tag-pill">{currentQ.source}</span>}
          </div>
          <p className="text-base font-medium text-ink-900 mb-6">{currentQ.stem}</p>

          {options.length > 0 && (
            <div className="space-y-2 mb-6">
              {options.map((opt: any, i: number) => (
                <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAnswer === opt.value ? "border-pine-400 bg-pine-50" : "border-paper-300 hover:bg-paper-50"}`}>
                  <input
                    type={currentQ.type === "multiple_choice" ? "checkbox" : "radio"}
                    name="answer"
                    value={opt.value}
                    checked={selectedAnswer === opt.value}
                    onChange={e => setSelectedAnswer(e.target.value)}
                    className="mt-1"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          )}

          {currentQ.type === "fill_blank" && (
            <input value={selectedAnswer} onChange={e => setSelectedAnswer(e.target.value)} placeholder="填写答案" className="form-input mb-6" />
          )}

          {!result ? (
            <button onClick={submitAnswer} disabled={!selectedAnswer} className="btn-primary">提交答案</button>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 ${result.isCorrect ? "text-pine-700" : "text-red-600"}`}>
                {result.isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <span className="font-medium">{result.isCorrect ? "回答正确" : "回答错误"}</span>
              </div>
              {!result.isCorrect && (
                <div className="p-3 bg-paper-50 rounded-lg">
                  <p className="text-sm"><span className="font-medium">正确答案：</span>{result.correctAnswer}</p>
                </div>
              )}
              {result.explanation && (
                <div className="p-3 bg-pine-50 rounded-lg">
                  <p className="text-sm"><span className="font-medium">解析：</span>{result.explanation}</p>
                </div>
              )}
              {currentIndex < questions.length - 1 ? (
                <button onClick={nextQuestion} className="btn-primary flex items-center gap-1">下一题 <ChevronRight size={16} /></button>
              ) : (
                <div className="p-4 bg-ochre-50 rounded-lg">
                  <p className="font-medium">练习完成！</p>
                  <p className="text-sm mt-1">最终得分：{score} / {questions.length}</p>
                  <button onClick={() => setView("list")} className="btn-secondary mt-3">返回列表</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-serif font-bold text-ink-900">题库与做题</h1>
        <p className="text-sm text-ink-900-500 mt-1">历年真题卷与在线练习</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map(exam => (
          <div key={exam.id} className="bg-white rounded-xl border border-paper-300 p-5 card-hover">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-pine-50 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-pine-600" />
              </div>
              {exam.sourceUrl && (
                <a href={exam.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-ink-900-500 hover:text-pine-600">
                  <BookOpen size={16} />
                </a>
              )}
            </div>
            <h3 className="font-medium text-ink-900 mt-3 truncate">{exam.title}</h3>
            <p className="text-xs text-ink-900-500 mt-1">{exam.sourceName || "历年真题"} · {exam.contentType}</p>
            <button onClick={() => startExam(exam.title)} className="mt-4 w-full btn-primary flex items-center justify-center gap-2">
              <Play size={14} /> 开始练习
            </button>
          </div>
        ))}
      </div>

      {exams.length === 0 && <p className="text-sm text-ink-900-500 text-center py-8">暂无真题卷数据，请先执行种子数据导入</p>}
    </div>
  );
}
