import React, { useState, useEffect, useMemo } from 'react';
import { WW_SKILLS } from './shell_walker/SkillDB';

const DEFAULT_PROFILE = `monk="WW_MVP"\nlevel=80\nrole=attack\nspec=windwalker\nhero_tree=shado_pan\nmain_hand=,id=193753\noff_hand=,id=193753`;

export default function App() {
  const [profileText, setProfileText] = useState(DEFAULT_PROFILE);
  const [activeTalents, setActiveTalents] = useState<string[]>([]); 
  const [isInitialized, setIsInitialized] = useState(false);

  const [sequence, setSequence] = useState<{id: string, spellId: string, calledBuff: boolean}[]>([]);
  const [autoPilot, setAutoPilot] = useState(false); 
  
  // 🌟 核心新功能：无极 Zoom 缩放器 与 点击事件显微镜
  const [zoom, setZoom] = useState(240); 
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

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
    if (sequence.length === 0) { setSimResult(null); setSelectedEvent(null); return; }

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
        setSelectedEvent(null); 
      } catch (err: any) {
        setErrorMsg(err.message); setSimResult(null);
      } finally { setIsSimulating(false); }
    }, 500);

    return () => clearTimeout(timer);
  }, [sequence, isInitialized, autoPilot]);

  const addSpell = (spellId: string) => setSequence(prev => [...prev, { id: Math.random().toString(36).substring(2), spellId, calledBuff: false }]);
  const removeSpell = (seqId: string) => setSequence(prev => prev.filter(s => s.id !== seqId));
  const toggleBuff = (seqId: string) => setSequence(prev => prev.map(s => s.id === seqId ? { ...s, calledBuff: !s.calledBuff } : s));
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (isInitialized) addSpell(e.dataTransfer.getData('spellId')); };

  const absoluteTimeline = simResult?.timeline || [];
  const totalTime = absoluteTimeline.length > 0 ? absoluteTimeline[absoluteTimeline.length - 1].startT + 3.0 : 5;
  
  // 🌟 缺气死锁报警器 (底层吞了你排的技能！)
  const isStalled = simResult && !isSimulating && simResult.droppedCount > 0;

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0c] text-white p-8 font-sans">
        <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl">
          <h1 className="text-3xl font-black text-emerald-500 mb-6 tracking-widest uppercase">配置初始化 (SimC 探针)</h1>
          <textarea value={profileText} onChange={e => setProfileText(e.target.value)} className="w-full h-80 bg-black text-gray-300 text-lg p-6 rounded-lg border border-gray-700 font-mono focus:border-emerald-500 focus:outline-none mb-6 resize-none shadow-inner" />
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
      
      {/* --- 左侧纯净图鉴 --- */}
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
                <div className="relative w-16 h-16">
                  {/* 防爆盾：断网时垫底显示汉字 */}
                  <div className="absolute inset-0 bg-gray-700 rounded-md flex items-center justify-center text-[13px] font-black text-white border border-gray-600 z-0 leading-tight text-center px-1 break-words">{skill.name}</div>
                  <img src={`https://wow.zamimg.com/images/wow/icons/large/${skill.icon}.jpg`} className="absolute inset-0 w-full h-full rounded-md object-cover z-10 transition-opacity" onError={(e) => e.currentTarget.style.opacity='0'} />
                </div>
                <span className="text-sm font-bold pointer-events-none text-gray-300">{skill.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0d0d12]">
        
        {/* --- 顶部控制栏 --- */}
        <div className="h-28 border-b border-gray-800 flex items-center px-10 bg-gray-900/40 justify-between sticky top-0 z-20 shrink-0 shadow-lg">
          <div className="flex items-center gap-8">
             <div onClick={() => setAutoPilot(!autoPilot)} className={`flex items-center gap-4 cursor-pointer p-3 rounded-lg border transition-all ${autoPilot ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-800 border-gray-700'}`}>
                <span className="text-3xl">{autoPilot ? '🤖' : '🛑'}</span>
                <div className="flex flex-col">
                  <span className={`text-sm font-black uppercase tracking-wider ${autoPilot ? 'text-blue-400' : 'text-gray-400'}`}>Auto-Pilot</span>
                  <span className="text-xs text-gray-400 mt-1">{autoPilot ? 'AI 残局接管' : '抹杀杂技插队'}</span>
                </div>
             </div>
             
             {/* 🌟 无极 Zoom 缩放拖杆 */}
             <div className="flex flex-col ml-4 border-l border-gray-700 pl-8">
               <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">🔍 轨道缩放 (Zoom)</span>
               <input type="range" min="80" max="600" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-48 accent-emerald-500 cursor-ew-resize" />
             </div>

             {isSimulating && <span className="text-yellow-400 font-bold text-base animate-pulse bg-yellow-900/30 border border-yellow-700/50 px-4 py-2 rounded ml-6">⚙️ 底层飞速运算中...</span>}
          </div>

          <div className="flex items-center gap-6">
             {/* 🌟 HTML 官方报告下载直通车！ */}
             {simResult?.htmlReportUrl && (
               <a href={simResult.htmlReportUrl} target="_blank" rel="noreferrer" className="px-6 py-4 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 rounded-lg text-base font-bold border border-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center gap-2 transition-all">
                 📄 查阅原生 HTML 战报
               </a>
             )}
             
             <button onClick={() => {setSequence([]); setSimResult(null); setSelectedEvent(null);}} className="px-6 py-4 bg-gray-800 hover:bg-red-900 hover:text-red-200 text-gray-300 rounded-lg text-base font-bold border border-gray-700 transition-colors shadow-md">🗑️ 清空重排</button>
             <div className="flex flex-col text-right border-l border-gray-700 pl-8 ml-2">
               <span className="text-emerald-600 text-sm uppercase font-black tracking-widest mb-1 drop-shadow">🔥 SimC 权威秒伤 (DPS)</span>
               <span className="text-5xl font-black text-emerald-400 font-mono tracking-tighter drop-shadow-lg">{simResult ? Math.round(simResult.dps).toLocaleString() : '---'}</span>
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto relative">
           
           {/* 🚨 防吞噬死锁红色风暴警告！ */}
           {isStalled && (
              <div className="bg-red-900/80 border-b-4 border-red-500 p-4 shadow-[0_0_30px_rgba(239,68,68,0.5)] flex justify-center items-center z-10">
                 <span className="text-white text-lg font-bold flex items-center gap-3"><span className="text-3xl animate-bounce">🚨</span> 严重断轴警告！由于真气不足或冷却受限，你排入的后 {simResult.droppedCount} 个技能被物理引擎无情吞噬了！</span>
              </div>
           )}

           {/* 1. 意图草稿 (全面放大) */}
           <div className="p-10 border-b border-gray-800 bg-[#0a0a0c] shrink-0 min-h-[240px]" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
             <h3 className="text-gray-400 text-base font-bold uppercase tracking-widest mb-8"><span>💭</span> 玩家意图区 (悬停红叉删 / 点底部 Call Buff)</h3>
             <div className="flex flex-wrap gap-x-8 gap-y-14 min-h-[140px] border-2 border-dashed border-gray-700 p-8 rounded-xl bg-black/40 relative">
                {sequence.length === 0 && <span className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none text-2xl font-bold tracking-widest">排入技能，手停0.5s自动算...</span>}
                {sequence.map((ev, i) => {
                  const uiSkill = WW_SKILLS.find(s => s.id === ev.spellId);
                  // 🚨 没打出来的废动作染成灰红色打红叉
                  const isDropped = isStalled && i >= simResult.executedCount;

                  return (
                    <div key={ev.id} className={`relative group border-2 rounded-xl p-3 transition-all shadow-xl 
                       ${isDropped ? 'bg-red-950/40 border-red-600 grayscale' : ev.calledBuff ? 'bg-yellow-900/40 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-gray-800 border-gray-700 hover:border-emerald-500'}
                    `}>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm text-gray-500 font-mono font-bold">#{i+1}</div>
                      
                      {isDropped && <div className="absolute -top-5 -left-5 bg-red-600 text-white text-sm font-black px-2 py-1 rounded shadow-lg z-20 whitespace-nowrap rotate-[-10deg]">⚠️ 缺气/卡死</div>}

                      <div onClick={() => removeSpell(ev.id)} className="absolute -top-4 -right-4 bg-red-600 w-8 h-8 rounded-full text-base font-bold text-white opacity-0 group-hover:opacity-100 flex items-center justify-center z-10 shadow-lg cursor-pointer hover:scale-110 hover:bg-red-500">✕</div>
                      
                      <div className="relative w-20 h-20 flex items-center justify-center bg-gray-700 rounded-lg shadow-md overflow-hidden">
                        <img src={`https://wow.zamimg.com/images/wow/icons/large/${uiSkill?.icon}.jpg`} className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity ${isDropped ? 'opacity-40' : 'opacity-90 group-hover:opacity-100'}`} onError={(e) => {e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling!.classList.remove('hidden')}}/>
                        <div className="hidden absolute inset-0 bg-gray-700 rounded-lg flex items-center justify-center text-[12px] font-black text-gray-300 border border-gray-600 z-0">{uiSkill?.name.substring(0,2)}</div>
                      </div>
                      
                      {uiSkill?.canCallBuff && !isDropped && (
                        <div onClick={() => toggleBuff(ev.id)} className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md text-sm font-bold cursor-pointer border whitespace-nowrap z-20 shadow-md ${ev.calledBuff ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-gray-900 text-gray-300 border-gray-600 hover:text-white hover:bg-gray-800'}`}>
                          {ev.calledBuff ? '✨ 强制注入' : 'Call Buff'}
                        </div>
                      )}
                    </div>
                  )
                })}
             </div>
           </div>

           {/* 🌟 2. 真正的物理深海轨道 (完美显露自然斑马线，彻底解决文字遮挡！) */}
           <div className="flex-1 p-10 relative overflow-x-auto min-h-[550px]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #0d0d12 0, #0d0d12 20px, #14141a 20px, #14141a 40px)' }}>
             <h3 className="text-emerald-500 text-base font-bold uppercase tracking-widest mb-14 sticky left-0 z-30 drop-shadow-md">
                <span>⚖️</span> SimC 绝对物理轨道 
                <span className="text-gray-500 text-sm font-normal normal-case ml-4 bg-gray-900 border border-gray-800 px-4 py-1.5 rounded-full">👉 点击任意积木查看深层快照</span>
             </h3>
             
             <div className="relative w-full h-48" style={{ minWidth: Math.max(1000, totalTime * zoom + 300) }}>
               {simResult && (
                 <>
                   {Array.from({ length: Math.ceil(totalTime) + 2 }).map((_, i) => (
                     <div key={`grid-${i}`} className="absolute top-0 bottom-0 border-l border-gray-700/60 pointer-events-none" style={{ left: i * zoom }}><span className="text-base text-gray-500 ml-2 font-mono absolute -top-8 font-bold">{i}s</span></div>
                   ))}
                   
                   {absoluteTimeline.map((ev: any, i: number) => {
                     const leftPx = ev.startT * zoom;
                     
                     // Wait 块仅作淡色暗纹，不带任何阻碍视觉的文字！天然漏出间隙。
                     if (ev.type === 'WAIT') {
                       return <div key={`wait-${i}`} className="absolute top-8 h-36 rounded-xl opacity-30 flex items-center justify-center pointer-events-none border border-gray-700/50 shadow-inner z-0" style={{ left: leftPx, width: ev.duration * zoom, backgroundImage: 'repeating-linear-gradient(45deg, #374151 0, #374151 10px, transparent 10px, transparent 20px)' }}>
                         {(ev.duration * zoom) > 70 && <span className="text-[11px] text-gray-400 font-bold bg-black/60 px-2 py-0.5 rounded-md shadow">等待 {ev.duration.toFixed(2)}s</span>}
                       </div>;
                     }

                     // 积木的宽度严格等于它的 duration (即 GCD 1.0s 或引导时间)
                     const widthPx = Math.max(ev.duration * zoom, 40); 
                     
                     const uiSkill = WW_SKILLS.find(s => s.id === ev.spellId);
                     const isSelected = selectedEvent === ev;
                     
                     return (
                       <div key={`cast-${i}`} onClick={() => setSelectedEvent(ev)} className={`absolute rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.8)] flex flex-col justify-center items-center border-2 top-8 h-36 z-10 cursor-pointer transition-all hover:-translate-y-2 hover:z-40 hover:shadow-[0_15px_30px_rgba(16,185,129,0.5)]
                         ${ev.isAI ? 'bg-blue-900/60 border-blue-500 opacity-80' : 'bg-emerald-800/90 border-emerald-400 hover:border-white'}
                         ${ev.calledBuff ? 'ring-2 ring-yellow-400' : ''}
                         ${isSelected ? 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] scale-105 z-50' : ''}
                       `} style={{ left: leftPx, width: widthPx }}>
                         {ev.isAI && <span className="absolute -top-7 text-3xl drop-shadow-md">🤖</span>}
                         {ev.calledBuff && <span className="absolute -top-4 -right-4 text-2xl drop-shadow-md z-20">✨</span>}
                         
                         <div className="relative w-16 h-16 mb-2 pointer-events-none">
                           <div className="absolute inset-0 bg-gray-700 rounded-lg flex items-center justify-center text-[11px] font-black text-white border border-gray-600 z-0 leading-tight text-center px-1 break-words">{uiSkill ? uiSkill.name : ev.rawName.replace(/_/g, ' ')}</div>
                           <img src={`https://wow.zamimg.com/images/wow/icons/large/${uiSkill?.icon}.jpg`} className="absolute inset-0 w-full h-full rounded-lg shadow-md border border-gray-900 object-cover z-10 transition-opacity" onError={(e) => e.currentTarget.style.opacity='0'} />
                         </div>
                         
                         <span className="text-sm text-white font-mono bg-black/80 px-2 py-0.5 rounded pointer-events-none shadow">{ev.startT.toFixed(2)}s</span>
                         
                         {/* 🌟 直接悬挂底层的残余气/能量！！ */}
                         {ev.energy !== undefined && ev.chi !== undefined && (
                            <div className="absolute -bottom-6 flex gap-3 bg-gray-900/95 px-3 py-1.5 rounded-lg shadow-xl border border-gray-700 z-20 pointer-events-none">
                               <span className="text-yellow-400 text-sm font-black leading-none drop-shadow">⚡{Math.round(ev.energy)}</span>
                               <span className="text-teal-400 text-sm font-black leading-none drop-shadow">☯️{Math.round(ev.chi)}</span>
                            </div>
                         )}
                       </div>
                     );
                   })}
                 </>
               )}
             </div>
           </div>

           {/* 🌟 3. 黑客风探针显微镜 */}
           {selectedEvent && (
             <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900/95 border-2 border-emerald-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 w-[450px] backdrop-blur-md">
               <div className="flex justify-between items-start mb-6 border-b border-gray-800 pb-4">
                  <h4 className="text-2xl font-black text-emerald-400 tracking-widest flex items-center gap-3"><span className="text-3xl">🔍</span> 底层事件快照</h4>
                  <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:text-white text-3xl font-black leading-none">✕</button>
               </div>
               <div className="space-y-5 font-mono text-lg text-gray-300">
                  <div className="flex justify-between border-b border-gray-800 pb-3"><span className="text-gray-500">系统代号:</span> <span className="text-white font-bold">{selectedEvent.rawName}</span></div>
                  <div className="flex justify-between border-b border-gray-800 pb-3"><span className="text-gray-500">物理出击:</span> <span className="text-blue-400 font-bold">{selectedEvent.startT.toFixed(3)} s</span></div>
                  <div className="flex justify-between border-b border-gray-800 pb-3"><span className="text-gray-500">瞬间能量:</span> <span className="text-yellow-400 font-black text-2xl">⚡ {Math.round(selectedEvent.energy)}</span></div>
                  <div className="flex justify-between border-b border-gray-800 pb-3"><span className="text-gray-500">瞬间真气:</span> <span className="text-teal-400 font-black text-2xl">☯️ {Math.round(selectedEvent.chi)}</span></div>
                  
                  {selectedEvent.calledBuff && (
                     <div className="flex justify-between border-b border-gray-800 pb-3"><span className="text-gray-500">黑魔法:</span> <span className="text-yellow-400 font-bold flex items-center gap-2">✨ God Mode 注入</span></div>
                  )}

                  <div className="flex justify-between pt-3"><span className="text-gray-500">执行主体:</span> <span className={`font-bold ${selectedEvent.isAI ? 'text-blue-400 bg-blue-900/30' : 'text-emerald-400 bg-emerald-900/30'} px-3 py-1 rounded`}>{selectedEvent.isAI ? '🤖 自动接管系统' : '👤 玩家排入指令'}</span></div>
               </div>
               <div className="mt-8 text-sm text-gray-500 leading-relaxed bg-black/40 p-4 rounded-lg border border-gray-800">
                  <span className="text-emerald-500 font-bold">架构提示：</span> 该数据为底层核心运算后的绝对快照。触发概率已由 <code className="text-blue-300">deterministic=1</code> 强行抹杀。
               </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
}