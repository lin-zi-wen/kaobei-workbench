"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Send, Bot, User, Sparkles, MessageSquare } from "lucide-react";

export default function AiPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.chatSessions().then(r => setSessions(r.sessions));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    try {
      const res = await api.sendMessage({ sessionId, content: userMsg });
      setSessionId(res.sessionId);
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
      api.chatSessions().then(r => setSessions(r.sessions));
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "发送失败，请重试。" }]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      <header>
        <h1 className="text-2xl font-serif font-bold text-ink-900">AI 助手</h1>
        <p className="text-sm text-ink-900-500 mt-1">备考问答，引用知识库来源</p>
      </header>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Session list */}
        <div className="w-56 bg-white rounded-xl border border-paper-300 overflow-hidden hidden lg:flex flex-col">
          <div className="p-3 border-b border-paper-300 font-medium text-sm">会话列表</div>
          <div className="flex-1 overflow-y-auto">
            {sessions.map(s => (
              <button key={s.id} onClick={() => { setSessionId(s.id); setMessages([]); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-paper-100 ${sessionId === s.id ? "bg-pine-50 text-pine-700" : ""}`}>
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} />
                  <span className="truncate">{s.title || `会话 ${s.id}`}</span>
                </div>
              </button>
            ))}
            {sessions.length === 0 && <p className="p-3 text-xs text-ink-900-500">暂无会话</p>}
          </div>
          <button onClick={() => { setSessionId(null); setMessages([]); }} className="p-3 text-sm text-pine-600 hover:bg-pine-50 border-t border-paper-300">+ 新会话</button>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-white rounded-xl border border-paper-300 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-ink-900-500">
                <Sparkles size={40} className="mb-3 text-ochre" />
                <p className="font-medium">开始一个新的对话</p>
                <p className="text-sm mt-1">你可以问我任何关于系统分析师备考的问题</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 bg-pine-100 rounded-full flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-pine-700" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${m.role === "user" ? "bg-pine-600 text-white" : "bg-paper-100 text-ink-900"}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 bg-seal-100 rounded-full flex items-center justify-center shrink-0">
                    <User size={16} className="text-seal-700" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-pine-100 rounded-full flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-pine-700" />
                </div>
                <div className="bg-paper-100 px-4 py-2.5 rounded-xl text-sm text-ink-900-500">思考中...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-paper-300">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="输入问题..."
                className="form-input"
              />
              <button onClick={send} disabled={loading} className="btn-primary px-3">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
