import React, { useEffect, useMemo, useState } from 'react';
import { simulateSequence } from './shell_walker/Engine';
import { computeLeftPanelViews, type CurrentState } from './shell_walker/PanelEngine';
import { WW_SKILLS } from './shell_walker/SkillDB';

const DEFAULT_PROFILE = `monk="WW_MVP"
level=80
role=attack
spec=windwalker
hero_tree=shado_pan
main_hand=,id=193753
off_hand=,id=193753`;

type SequenceItem = { id: string; spellId: string; calledBuff: boolean };

function buildPanelState(sequence: SequenceItem[], activeTalents: string[]): CurrentState {
  const sim = simulateSequence(sequence.map((s) => ({ id: s.id, spellId: s.spellId })), 0);
  let boKEmpoweredUntil = 0;
  let sckEmpoweredUntil = 0;
  let rwkReplaceUntil = 0;

  sim.events.forEach((event) => {
    if (event.type !== 'CAST' || !event.spellId) return;
    if (event.spellId === 'TP') boKEmpoweredUntil = event.startT + 5;
    if (event.spellId === 'BoK') sckEmpoweredUntil = event.startT + 5;
    if (event.spellId === 'RSK') rwkReplaceUntil = event.startT + 8;
  });

  return {
    activeTalents: Object.fromEntries(activeTalents.map((t) => [t, true])),
    currentTime: sim.finalState.t,
    cooldownReadyTimes: sim.finalState.cooldowns,
    boKEmpoweredUntil,
    sckEmpoweredUntil,
    rwkReplaceUntil
  };
}

export default function App() {
  const [profileText, setProfileText] = useState(DEFAULT_PROFILE);
  const [activeTalents, setActiveTalents] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sequence, setSequence] = useState<SequenceItem[]>([]);
  const [autoPilot, setAutoPilot] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockTip, setLockTip] = useState<string | null>(null);

  const panelState = useMemo(() => buildPanelState(sequence, activeTalents), [sequence, activeTalents]);
  const skillViews = useMemo(() => computeLeftPanelViews(panelState), [panelState]);
  const previewSim = useMemo(() => simulateSequence(sequence.map((s) => ({ id: s.id, spellId: s.spellId })), 0), [sequence]);

  const skillViewMap = useMemo(() => Object.fromEntries(skillViews.map((s) => [s.id, s])), [skillViews]);

  const addSpell = (spellId: string) => {
    const view = skillViewMap[spellId];
    if (!view || !view.isReady) {
      setLockTip(view?.lockReason ?? '技能不可用');
      return;
    }
    setLockTip(null);
    setSequence((prev) => [...prev, { id: Math.random().toString(36).slice(2), spellId, calledBuff: false }]);
  };

  useEffect(() => {
    if (!isInitialized) return;
    if (sequence.length === 0) {
      setSimResult(null);
      return;
    }

    setIsSimulating(true);
    setErrorMsg(null);
    const timer = setTimeout(async () => {
      try {
        const payload = sequence.map((s) => ({ spellId: s.spellId, calledBuff: s.calledBuff }));
        const response = await fetch('http://localhost:8000/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileText, sequence: payload, autoPilot })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail);
        setSimResult(data);
      } catch (err: any) {
        setErrorMsg(err.message);
        setSimResult(null);
      } finally {
        setIsSimulating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [sequence, isInitialized, autoPilot, profileText]);

  const handleInitProfile = async () => {
    setIsSimulating(true);
    setErrorMsg(null);
    try {
      const response = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileText, sequence: [], autoPilot: false })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
      setActiveTalents(data.activeTalents || []);
      setIsInitialized(true);
      setSequence([]);
      setSimResult(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const removeSpell = (seqId: string) => setSequence((prev) => prev.filter((s) => s.id !== seqId));
  const toggleBuff = (seqId: string) => setSequence((prev) => prev.map((s) => (s.id === seqId ? { ...s, calledBuff: !s.calledBuff } : s)));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const spellId = e.dataTransfer.getData('spellId');
    if (spellId) addSpell(spellId);
  };

  const timeline = simResult?.timeline || previewSim.events;
  const totalTime = timeline.length > 0 ? timeline[timeline.length - 1].startT + timeline[timeline.length - 1].duration : 5;
  const TIME_SCALE = 160;

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0c] p-8 text-white">
        <div className="w-full max-w-4xl rounded-2xl border border-gray-800 bg-gray-900 p-10">
          <h1 className="mb-4 text-2xl font-bold text-emerald-500">配置初始化</h1>
          <textarea value={profileText} onChange={(e) => setProfileText(e.target.value)} className="h-72 w-full rounded-lg border border-gray-700 bg-black p-4 font-mono" />
          {errorMsg && <div className="mt-4 rounded bg-red-900/30 p-3 text-red-300">{errorMsg}</div>}
          <button onClick={handleInitProfile} disabled={isSimulating} className="mt-4 w-full rounded bg-emerald-700 py-3 font-bold">
            {isSimulating ? '初始化中...' : '开始'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white">
      <div className="w-80 border-r border-gray-800 bg-gray-900 p-4">
        <button onClick={() => setIsInitialized(false)} className="mb-3 text-sm text-gray-400 underline">
          ← 返回
        </button>
        <div className="grid grid-cols-2 gap-3">
          {skillViews.map((skill) => (
            <button
              key={skill.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('spellId', skill.id)}
              onClick={() => addSpell(skill.id)}
              className={`rounded border p-2 text-left text-sm ${
                skill.isReady ? 'border-gray-700 bg-gray-800' : 'border-gray-800 bg-gray-900 opacity-60'
              } ${skill.isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}
              title={skill.lockReason}
            >
              <div className="font-semibold">{skill.name}</div>
              {!skill.isReady && <div className="text-xs text-gray-400">{skill.lockReason}</div>}
            </button>
          ))}
        </div>
        {lockTip && <div className="mt-3 rounded border border-yellow-700 bg-yellow-900/30 p-2 text-xs text-yellow-300">{lockTip}</div>}
      </div>

      <div className="flex flex-1 flex-col" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        <div className="border-b border-gray-800 p-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoPilot} onChange={(e) => setAutoPilot(e.target.checked)} /> Auto-Pilot
          </label>
          {errorMsg && <div className="mt-2 text-sm text-red-400">{errorMsg}</div>}
          {isSimulating && <div className="mt-2 text-sm text-emerald-400">后端计算中...</div>}
        </div>

        <div className="border-b border-gray-800 p-4">
          <div className="flex flex-wrap gap-2">
            {sequence.map((ev, i) => {
              const uiSkill = WW_SKILLS.find((s) => s.id === ev.spellId);
              return (
                <div key={ev.id} className="relative rounded border border-gray-700 bg-gray-800 p-2 text-xs">
                  <div className="mb-1 font-semibold">#{i + 1} {uiSkill?.name}</div>
                  <button onClick={() => removeSpell(ev.id)} className="mr-2 text-red-400">删除</button>
                  {uiSkill?.canCallBuff && <button onClick={() => toggleBuff(ev.id)}>{ev.calledBuff ? '取消 Buff' : 'Call Buff'}</button>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-2 text-sm text-gray-400">时间轴（无后端结果时展示本地预演）</div>
          <div className="relative h-40" style={{ minWidth: Math.max(800, totalTime * TIME_SCALE + 200) }}>
            {timeline.map((ev: any, i: number) => {
              const leftPx = ev.startT * TIME_SCALE;
              const widthPx = Math.max(ev.duration * TIME_SCALE, 8);
              if (ev.type === 'WAIT') {
                return <div key={i} className="absolute top-8 h-16 rounded border border-gray-600 bg-gray-700/50" style={{ left: leftPx, width: widthPx }} />;
              }
              const uiSkill = WW_SKILLS.find((s) => s.id === ev.spellId);
              return (
                <div key={i} className="absolute top-8 h-16 rounded border border-emerald-400 bg-emerald-800/80 px-2 text-xs" style={{ left: leftPx, width: Math.max(60, widthPx) }}>
                  {uiSkill?.name ?? ev.spellId}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
