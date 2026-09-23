"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Save, Download, Upload, Moon, Sun, Monitor, Volume2, Bell, Timer, RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    api.settings().then(r => { setSettings(r); setLoading(false); });
  }, []);

  const update = async (patch: any) => {
    await api.updateSettings(patch);
    setSettings({ ...settings, ...patch });
  };

  const exportData = async () => {
    const data = await api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaobei-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async () => {
    try {
      const data = JSON.parse(importText);
      await api.importData(data);
      alert("导入成功");
      setImportText("");
    } catch {
      alert("导入失败：JSON 格式错误");
    }
  };

  if (loading) return <div className="text-ink-900-500">加载中...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-serif font-bold text-ink-900">设置</h1>
        <p className="text-sm text-ink-900-500 mt-1">个性化配置与数据管理</p>
      </header>

      {/* Appearance */}
      <Section title="外观" icon={Monitor}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">主题</label>
            <div className="flex gap-3">
              <ThemeButton active={settings.theme === "light"} onClick={() => update({ theme: "light" })} icon={Sun} label="浅色" />
              <ThemeButton active={settings.theme === "dark"} onClick={() => update({ theme: "dark" })} icon={Moon} label="深色" />
              <ThemeButton active={settings.theme === "system"} onClick={() => update({ theme: "system" })} icon={Monitor} label="跟随系统" />
            </div>
          </div>
          <Toggle label="动画效果" checked={settings.animationEnabled} onChange={v => update({ animationEnabled: v ? 1 : 0 })} />
        </div>
      </Section>

      {/* Sound */}
      <Section title="声音与提醒" icon={Volume2}>
        <div className="space-y-3">
          <Toggle label="音效" checked={settings.soundEnabled} onChange={v => update({ soundEnabled: v ? 1 : 0 })} />
          <Toggle label="每日格言" checked={settings.dailyQuoteEnabled} onChange={v => update({ dailyQuoteEnabled: v ? 1 : 0 })} />
        </div>
      </Section>

      {/* Focus */}
      <Section title="专注设置" icon={Timer}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">默认专注时长（分钟）</label>
            <input type="number" value={settings.focusDefaultDuration || 25} onChange={e => update({ focusDefaultDuration: parseInt(e.target.value) || 25 })} className="form-input" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">最大轮数</label>
            <input type="number" value={settings.focusMaxRounds || 8} onChange={e => update({ focusMaxRounds: parseInt(e.target.value) || 8 })} className="form-input" />
          </div>
        </div>
      </Section>

      {/* Data */}
      <Section title="数据管理" icon={RotateCcw}>
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={exportData} className="btn-primary flex items-center gap-2">
              <Download size={16} /> 导出数据
            </button>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">导入数据</label>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="粘贴 JSON 备份内容..." rows={4} className="form-input" />
            <button onClick={importData} disabled={!importText.trim()} className="btn-secondary mt-2 flex items-center gap-2">
              <Upload size={16} /> 导入
            </button>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">重新导入种子数据</label>
            <button onClick={async () => { await api.seed(); alert("种子数据已重新导入"); }} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={16} /> 重置数据
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-paper-300 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-seal" />
        <h2 className="font-serif font-bold text-lg">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ThemeButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${active ? "border-pine-400 bg-pine-50 text-pine-700" : "border-paper-300 hover:bg-paper-50"}`}>
      <Icon size={16} /> {label}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-pine-600" : "bg-paper-300"}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "left-6" : "left-1"}`} />
      </button>
    </label>
  );
}
