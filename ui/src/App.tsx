import React, { useState, useEffect, useMemo } from 'react';
import { WW_SKILLS } from './shell_walker/SkillDB';

const DEFAULT_PROFILE = `monk="WW_MVP"
level=80
role=attack
spec=windwalker
hero_tree=shado_pan
main_hand=,id=193753
off_hand=,id=193753`;

export default function App() {
  const [profileText, setProfileText] = useState(DEFAULT_PROFILE);
  const [activeTalents, setActiveTalents] = useState<string[]>([]); 
  const [isInitialized, setIsInitialized] = useState(false);

  const [sequence, setSequence] = useState<{id: string, spellId: string, calledBuff: boolean}[]>([]);
  const [autoPilot, setAutoPilot] = useState(false); // 🌟 PRD 4.3 自动推演残局
  
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInitProfile = async () => {
    setIsSimulating(true); setErrorMsg(null);
    try {
      const response = await fetch("http://localhost:8000/simulate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText, sequence: [], autoPilot: false })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
      
      setActiveTalents(data.activeTalents || []);
      setIsInitialized(true); setSequence([]); setSimResult(null); 
    } catch (err: any) { setErrorMsg(err.message); } 
    finally { setIsSimulating(false); }
  };

  const visibleSkills = useMemo(() => WW_SKILLS.filter(s => !s.requiredTalent || activeTalents.includes(s.requiredTalent)), [activeTalents]);

  // ⚡ 0.5s 全自动推演 (连同 Auto-Pilot 开关一起发送！)
  useEffect(() => {
    if (!isInitialized || sequence.length === 0) {
      if (sequence.length === 0) setSimResult(null);
      return;
    }

    setIsSimulating(true); setErrorMsg(null);
    const timer = setTimeout(async () => {
      try {
        const payload = sequence.map(s => ({ spellId: s.spellId, calledBuff: s.calledBuff }));
        const response = await fetch("http://localhost:8000/simulate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileText, sequence: payload, autoPilot })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail);
        setSimResult(data);
      } catch (err: any) {
        setErrorMsg(err.message); setSimResult(null);
      } finally { setIsSimulating(false); }
    }, 500);

    return () => clearTimeout(timer);
  }, [sequence, isInitialized, autoPilot]);

  // --- 交互系统 ---
  const addSpell = (spellId: string) => setSequence(prev => [...prev, { id: Math.random().toString(36).substring(2), spellId, calledBuff: false }]);
  const removeSpell = (seqId: string) => setSequence(prev => prev.filter(s => s.id !== seqId));
  const toggleBuff = (seqId: string) => setSequence(prev => prev.map(s => s.id === seqId ? { ...s, calledBuff: !s.calledBuff } : s));
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isInitialized) return alert("请先初始化！");
    const spellId = e.dataTransfer.getData('spellId');
    if (spellId) addSpell(spellId);
  };

  const absoluteTimeline = simResult?.timeline || [];
  const totalTime = absoluteTimeline.length > 0 ? absoluteTimeline[absoluteTimeline.length - 1].startT + absoluteTimeline[absoluteTimeline.length - 1].duration : 5;

  let simcCastCount = 0; 

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0c] text-white p-8 font-sans">
        <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-emerald-500 mb-2 tracking-widest uppercase">配置初始化 (SimC 探针)</h1>
          <p className="text-gray-400 text-sm mb-6">探针容错已修复。你的原生 APL 得到了最高级别的保护，随时准备响应你的 Auto-Pilot 推演！</p>
          <textarea value={profileText} onChange={e => setProfileText(e.target.value)} className="w-full h-80 bg-black text-gray-300 text-sm p-4 rounded border border-gray-700 font-mono focus:border-emerald-500 focus:outline-none mb-6 resize-none shadow-inner" />
          {errorMsg && <div className="text-red-500 text-sm mb-4 bg-red-900/20 p-2 rounded">🚨 探针发射失败: {errorMsg}</div>}
          <button onClick={handleInitProfile} disabled={isSimulating} className="w-full py-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-lg font-bold disabled:opacity-50 transition-all">
            {isSimulating ? '探针发射中...' : '✅ 确定并读取初始状态'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white font-sans select-none overflow-hidden">
      
      {/* 字典区 */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col z-10 shrink-0">
        <div className="p-4 border-b border-gray-800 bg-black/40">
           <button onClick={() => setIsInitialized(false)} className="text-gray-500 hover:text-white text-xs underline mb-4">← 返回配置</button>
           <h2 className="text-emerald-500 font-black tracking-widest text-lg">纯净图鉴</h2>
           <div className="text-[10px] text-gray-500 mt-1">前端只发意图，绝不越权计算</div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {visibleSkills.map(skill => (
              <div key={skill.id} draggable onDragStart={(e) => e.dataTransfer.setData('spellId', skill.id)} onClick={() => addSpell(skill.id)} className="flex flex-col items-center gap-1 p-2 rounded border bg-gray-800 border-gray-700 hover:border-emerald-500 cursor-grab">
                <img src={`https://wow.zamimg.com/images/wow/icons/large/${skill.icon}.jpg`} className="w-10 h-10 rounded shadow-md pointer-events-none border border-gray-900" />
                <span className="text-[10px] font-bold pointer-events-none text-gray-300">{skill.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto relative">
        <div className="h-20 border-b border-gray-800 flex items-center px-8 bg-gray-900/40 justify-between sticky top-0 z-20 shrink-0">
          
          <div className="flex items-center gap-6">
             {/* 🌟 PRD 4.3 核心：Auto-Pilot 开关 */}
             <div onClick={() => setAutoPilot(!autoPilot)} className={`flex items-center gap-2 cursor-pointer p-2 rounded border transition-all ${autoPilot ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-gray-800 border-gray-700'}`}>
                <span className="text-xl">{autoPilot ? '🤖' : '🛑'}</span>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${autoPilot ? 'text-blue-400' : 'text-gray-500'}`}>Auto-Pilot (自动推演残局)</span>
                  <span className="text-[9px] text-gray-400">{autoPilot ? '打完当前排轴后，AI 接管战斗' : '只算排版序列，打完强行停手'}</span>
                </div>
             </div>
             {isSimulating && <span className="text-yellow-400 font-bold text-sm animate-pulse">⚙️ 0.5s防抖: 底层运算中...</span>}
             {errorMsg && <span className="text-red-500 font-bold text-sm bg-red-900/20 px-2 py-1 rounded border border-red-900">🚨 {errorMsg}</span>}
          </div>

          <div className="flex items-center gap-6">
             <button onClick={() => {setSequence([]); setSimResult(null);}} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-xs font-bold border border-gray-700">🗑️ 清空重排</button>
             <div className="flex flex-col text-right border-l border-gray-700 pl-6">
               <span className="text-emerald-600 text-[10px] uppercase font-bold tracking-widest mb-1 drop-shadow">SimC 物理总伤</span>
               <span className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">{simResult ? Math.round(simResult.totalDamage).toLocaleString() : '---'}</span>
             </div>
          </div>
        </div>

        {/* 1. 意图草稿 */}
        <div className="p-8 border-b border-gray-800 bg-[#0d0d12] shrink-0 min-h-[160px]" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4"><span>💭</span> 前端意图区 (悬停红叉删 / 点底部 Call Buff / 停手0.5s自动算)</h3>
          <div className="flex flex-wrap gap-x-2 gap-y-7 min-h-[60px] border border-dashed border-gray-700 p-4 rounded bg-black/40 relative">
             {sequence.length === 0 && <span className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none text-sm font-bold tracking-widest">排入技能后停手...</span>}
             {sequence.map((ev, i) => {
               const uiSkill = WW_SKILLS.find(s => s.id === ev.spellId);
               return (
                 <div key={ev.id} className={`relative group border-2 rounded-lg p-1 transition-all shadow-lg ${ev.calledBuff ? 'bg-yellow-900/40 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-800 border-gray-700 hover:border-emerald-500'}`}>
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-mono">#{i+1}</div>
                   <div onClick={() => removeSpell(ev.id)} className="absolute -top-2 -right-2 bg-red-600 w-5 h-5 rounded-full text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 flex items-center justify-center z-10 shadow-lg cursor-pointer">✕</div>
                   {uiSkill && <img src={`https://wow.zamimg.com/images/wow/icons/medium/${uiSkill.icon}.jpg`} className="w-10 h-10 rounded opacity-80 pointer-events-none" />}
                   
                   {uiSkill?.canCallBuff && (
                     <div onClick={() => toggleBuff(ev.id)} className={`absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer border whitespace-nowrap z-20 ${ev.calledBuff ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-gray-900 text-gray-400 border-gray-700 hover:text-white'}`}>
                       {ev.calledBuff ? '✨ 已挂载' : 'Call Buff'}
                     </div>
                   )}
                 </div>
               )
             })}
          </div>
        </div>

        {/* 2. 底层反馈画板 (完美支持 Auto-Pilot 彩蛋) */}
        <div className="flex-1 p-8 bg-black relative overflow-x-auto min-h-[300px]">
          <h3 className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-6"><span>⚖️</span> SimC 绝对裁决时间轴</h3>
          <div className="relative w-full h-32" style={{ minWidth: Math.max(800, totalTime * 140 + 200) }}>
            {simResult && (
              <>
                {Array.from({ length: Math.ceil(totalTime) + 2 }).map((_, i) => (
                  <div key={`grid-${i}`} className="absolute top-0 bottom-0 border-l border-gray-800/60 pointer-events-none" style={{ left: i * 140 }}><span className="text-[10px] text-gray-500 ml-1 font-mono absolute -top-5">{i}s</span></div>
                ))}
                
                {absoluteTimeline.map((ev: any, i: number) => {
                  const leftPx = ev.startT * 140, widthPx = Math.max(ev.duration * 140, 2); 
                  if (ev.type === 'WAIT') return <div key={`wait-${i}`} className="absolute top-4 h-16 rounded opacity-40 flex items-center justify-center pointer-events-none border border-gray-600" style={{ left: leftPx, width: widthPx, backgroundImage: 'repeating-linear-gradient(45deg, #374151 0, #374151 10px, #1f2937 10px, #1f2937 20px)' }}>{widthPx > 40 && <span className="text-[10px] text-gray-300 font-mono font-bold bg-black/50 px-1 rounded">Wait {ev.duration.toFixed(2)}s</span>}</div>;
                  
                  // 🌟 神级视觉反馈：区分玩家打的积木，和 AI 自动推演的积木！
                  const isAI = simcCastCount >= sequence.length;
                  simcCastCount++;
                  
                  const uiSkill = WW_SKILLS.find(s => s.id === ev.spellId);
                  return (
                    <div key={`cast-${i}`} className={`absolute rounded shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex flex-col justify-center items-center pointer-events-none border top-4 h-16 
                      ${isAI ? 'bg-blue-900/60 border-blue-500 opacity-70 grayscale-[40%]' : 'bg-emerald-800/80 border-emerald-500'}
                    `} style={{ left: leftPx, width: Math.max(widthPx, 30) }}>
                      {isAI && <span className="absolute -top-3 text-[10px]">🤖</span>}
                      {uiSkill ? (
                        <img src={`https://wow.zamimg.com/images/wow/icons/medium/${uiSkill.icon}.jpg`} className="w-8 h-8 rounded shadow-md" />
                      ) : (
                        <span className="text-[8px] text-white/80 font-bold truncate w-full text-center px-1 leading-tight">{ev.spellId.replace(/_/g, ' ')}</span>
                      )}
                      <span className="text-[10px] text-white/70 font-mono mt-1 bg-black/50 px-1 rounded">{ev.startT.toFixed(2)}s</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}