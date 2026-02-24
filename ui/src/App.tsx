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
  const [autoPilot, setAutoPilot] = useState(false); 
  
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

  useEffect(() => {
    if (!isInitialized) return;
    if (sequence.length === 0) { setSimResult(null); return; }

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

  const addSpell = (spellId: string) => setSequence(prev => [...prev, { id: Math.random().toString(36).substring(2), spellId, calledBuff: false }]);
  const removeSpell = (seqId: string) => setSequence(prev => prev.filter(s => s.id !== seqId));
  const toggleBuff = (seqId: string) => setSequence(prev => prev.map(s => s.id === seqId ? { ...s, calledBuff: !s.calledBuff } : s));
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isInitialized) return;
    const spellId = e.dataTransfer.getData('spellId');
    if (spellId) addSpell(spellId);
  };

  const absoluteTimeline = simResult?.timeline || [];
  const totalTime = absoluteTimeline.length > 0 ? absoluteTimeline[absoluteTimeline.length - 1].startT + absoluteTimeline[absoluteTimeline.length - 1].duration : 5;
  
  // 🌟 核心：横向拉伸像素！让发呆块和技能看得清清楚楚！
  const TIME_SCALE = 240; 

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0c] text-white p-8 font-sans">
        <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl">
          <h1 className="text-3xl font-black text-emerald-500 mb-6 tracking-widest uppercase">配置初始化 (SimC 探针)</h1>
          <textarea value={profileText} onChange={e => setProfileText(e.target.value)} className="w-full h-80 bg-black text-gray-300 text-base p-6 rounded-lg border border-gray-700 font-mono focus:border-emerald-500 focus:outline-none mb-6 resize-none shadow-inner" />
          {errorMsg && <div className="text-red-500 text-base mb-6 bg-red-900/20 p-4 rounded-lg font-bold border border-red-900/50">🚨 探针发射失败: {errorMsg}</div>}
          <button onClick={handleInitProfile} disabled={isSimulating} className="w-full py-5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xl font-bold disabled:opacity-50 transition-all flex justify-center items-center">
            {isSimulating ? <span className="animate-spin text-2xl">⚙️</span> : '✅ 确定并读取初始状态'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white font-sans select-none overflow-hidden text-base">
      
      {/* 🚀 左侧字典 (大幅变宽，字体变大) */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col z-10 shrink-0 shadow-2xl">
        <div className="p-6 border-b border-gray-800 bg-black/40">
           <button onClick={() => setIsInitialized(false)} className="text-gray-400 hover:text-white text-sm underline mb-4">← 返回修改配置</button>
           <h2 className="text-emerald-500 font-black tracking-widest text-2xl">纯净图鉴</h2>
           <div className="text-sm text-gray-500 mt-2">前端只发意图，绝不越权计算</div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {visibleSkills.map(skill => (
              <div key={skill.id} draggable onDragStart={(e) => e.dataTransfer.setData('spellId', skill.id)} onClick={() => addSpell(skill.id)} className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-gray-800 border-gray-700 hover:border-emerald-500 cursor-grab hover:scale-105 transition-transform shadow-lg">
                <div className="relative w-14 h-14">
                  <img src={`https://wow.zamimg.com/images/wow/icons/large/${skill.icon}.jpg`} className="absolute inset-0 w-full h-full rounded-md shadow-md border border-gray-900 object-cover z-10" onError={(e) => e.currentTarget.style.display='none'} />
                  {/* 🛡️ 容错防爆盾：如果 Wowhead 图标碎了，自动显示文字块 */}
                  <div className="absolute inset-0 bg-gray-700 rounded-md flex items-center justify-center text-xs font-black text-gray-300 border border-gray-600 z-0">{skill.name.substring(0,2)}</div>
                </div>
                <span className="text-sm font-bold pointer-events-none text-gray-300">{skill.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto relative">
        <div className="h-28 border-b border-gray-800 flex items-center px-10 bg-gray-900/40 justify-between sticky top-0 z-20 shrink-0 shadow-lg">
          <div className="flex items-center gap-8">
             <div onClick={() => setAutoPilot(!autoPilot)} className={`flex items-center gap-4 cursor-pointer p-3 rounded-lg border transition-all ${autoPilot ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-800 border-gray-700'}`}>
                <span className="text-3xl">{autoPilot ? '🤖' : '🛑'}</span>
                <div className="flex flex-col">
                  <span className={`text-sm font-black uppercase tracking-wider ${autoPilot ? 'text-blue-400' : 'text-gray-400'}`}>Auto-Pilot</span>
                  <span className="text-xs text-gray-400 mt-1">{autoPilot ? 'AI 残局自动推演' : '打完强行停手'}</span>
                </div>
             </div>
             {isSimulating && <span className="text-yellow-400 font-bold text-base animate-pulse bg-yellow-900/30 px-3 py-1.5 rounded">⚙️ 0.5s防抖: 底层运算中...</span>}
             {errorMsg && <span className="text-red-500 font-bold text-base bg-red-900/20 px-4 py-2 rounded border border-red-900/50">🚨 {errorMsg}</span>}
          </div>

          <div className="flex items-center gap-8">
             <button onClick={() => {setSequence([]); setSimResult(null);}} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-bold border border-gray-700 shadow-md">🗑️ 清空轨道</button>
             <div className="flex flex-col text-right border-l border-gray-700 pl-8">
               <span className="text-emerald-600 text-sm uppercase font-black tracking-widest mb-1 drop-shadow">🔥 SimC 权威秒伤 (DPS)</span>
               <span className="text-5xl font-black text-emerald-400 font-mono tracking-tighter drop-shadow-lg">{simResult ? Math.round(simResult.dps).toLocaleString() : '---'}</span>
             </div>
          </div>
        </div>

        {/* 1. 意图草稿 (全面放大) */}
        <div className="p-10 border-b border-gray-800 bg-[#0d0d12] shrink-0 min-h-[240px]" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6"><span>💭</span> 玩家意图区 (悬停红叉删 / 点底部 Call Buff / 停手0.5s自动算)</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-12 min-h-[120px] border-2 border-dashed border-gray-700 p-8 rounded-xl bg-black/40 relative">
             {sequence.length === 0 && <span className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none text-xl font-bold tracking-widest">排入技能后停手...</span>}
             {sequence.map((ev, i) => {
               const uiSkill = WW_SKILLS.find(s => s.id === ev.spellId);
               return (
                 <div key={ev.id} className={`relative group border-2 rounded-xl p-2.5 transition-all shadow-xl ${ev.calledBuff ? 'bg-yellow-900/40 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-gray-800 border-gray-700 hover:border-emerald-500'}`}>
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-gray-500 font-mono font-bold">#{i+1}</div>
                   <div onClick={() => removeSpell(ev.id)} className="absolute -top-3 -right-3 bg-red-600 w-8 h-8 rounded-full text-sm font-bold text-white opacity-0 group-hover:opacity-100 flex items-center justify-center z-10 shadow-lg cursor-pointer hover:scale-110 hover:bg-red-500">✕</div>
                   
                   <div className="relative w-16 h-16 flex items-center justify-center bg-gray-700 rounded-lg shadow-md overflow-hidden">
                     <span className="text-xs font-bold text-white text-center leading-tight z-0 px-1">{uiSkill?.name}</span>
                     <img src={`https://wow.zamimg.com/images/wow/icons/large/${uiSkill?.icon}.jpg`} className="absolute inset-0 w-full h-full object-cover z-10 opacity-90 group-hover:opacity-100 pointer-events-none" onError={(e) => e.currentTarget.style.display = 'none'} />
                   </div>
                   
                   {uiSkill?.canCallBuff && (
                     <div onClick={() => toggleBuff(ev.id)} className={`absolute -bottom-7 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer border whitespace-nowrap z-20 shadow-md ${ev.calledBuff ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-gray-900 text-gray-300 border-gray-600 hover:text-white hover:bg-gray-800'}`}>
                       {ev.calledBuff ? '✨ 已挂载' : 'Call Buff'}
                     </div>
                   )}
                 </div>
               )
             })}
          </div>
        </div>

        {/* 🌟 2. 最终的灵魂画板 (横向拉伸 + 挂载资源黑板！) */}
        <div className="flex-1 p-10 bg-black relative overflow-x-auto min-h-[450px]">
          <h3 className="text-emerald-500 text-base font-bold uppercase tracking-widest mb-10"><span>⚖️</span> SimC 绝对裁决时间轴 (挂载物理级 真气 / 能量)</h3>
          
          <div className="relative w-full h-48" style={{ minWidth: Math.max(1000, totalTime * TIME_SCALE + 300) }}>
            {simResult && (
              <>
                {Array.from({ length: Math.ceil(totalTime) + 2 }).map((_, i) => (
                  <div key={`grid-${i}`} className="absolute top-0 bottom-0 border-l border-gray-800/60 pointer-events-none" style={{ left: i * TIME_SCALE }}><span className="text-sm text-gray-500 ml-2 font-mono absolute -top-8">{i}s</span></div>
                ))}
                
                {absoluteTimeline.map((ev: any, i: number) => {
                  const leftPx = ev.startT * TIME_SCALE, widthPx = Math.max(ev.duration * TIME_SCALE, 4); 
                  
                  if (ev.type === 'WAIT') return <div key={`wait-${i}`} className="absolute top-8 h-28 rounded-xl opacity-40 flex items-center justify-center pointer-events-none border-2 border-gray-600 shadow-inner z-0" style={{ left: leftPx, width: widthPx, backgroundImage: 'repeating-linear-gradient(45deg, #374151 0, #374151 10px, #1f2937 10px, #1f2937 20px)' }}>{widthPx > 60 && <span className="text-sm text-gray-200 font-bold bg-black/60 px-3 py-1 rounded-md shadow">等待 {ev.duration.toFixed(2)}s</span>}</div>;
                  
                  const uiSkill = WW_SKILLS.find(s => s.id === ev.spellId);
                  
                  return (
                    <div key={`cast-${i}`} className={`absolute rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.6)] flex flex-col justify-center items-center pointer-events-none border-2 top-8 h-28 z-10
                      ${ev.isAI ? 'bg-blue-900/60 border-blue-500 opacity-80' : 'bg-emerald-800/90 border-emerald-400'}
                    `} style={{ left: leftPx, width: Math.max(widthPx, 66) }}>
                      {ev.isAI && <span className="absolute -top-5 text-lg">🤖</span>}
                      
                      {/* 🛡️ 容错防爆盾 */}
                      <div className="relative w-14 h-14 mb-1.5">
                        <img src={`https://wow.zamimg.com/images/wow/icons/large/${uiSkill?.icon}.jpg`} className="absolute inset-0 w-full h-full rounded shadow-md border border-gray-900 object-cover z-10" onError={(e) => e.currentTarget.style.display='none'} />
                        <div className="absolute inset-0 bg-gray-700 rounded flex items-center justify-center text-[10px] font-black text-white border border-gray-600 z-0 leading-tight text-center px-1 break-words">{uiSkill ? uiSkill.name : ev.spellId.replace(/_/g, ' ')}</div>
                      </div>
                      
                      <span className="text-xs text-white font-mono bg-black/60 px-2 py-0.5 rounded">{ev.startT.toFixed(2)}s</span>
                      
                      {/* 🌟 PRD 灵魂机制：挂载底层计算的 能量(⚡) 与 真气(☯️) ！！ */}
                      {ev.energy !== undefined && ev.chi !== undefined && (
                         <div className="absolute -bottom-5 flex gap-2 bg-gray-900/90 px-2 py-1 rounded-md shadow-xl border border-gray-700 whitespace-nowrap z-20">
                            <span className="text-yellow-400 text-[11px] font-black leading-none drop-shadow" title="能量">⚡{Math.round(ev.energy)}</span>
                            <span className="text-teal-400 text-[11px] font-black leading-none drop-shadow" title="真气">☯️{Math.round(ev.chi)}</span>
                         </div>
                      )}
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