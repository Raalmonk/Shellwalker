import React from 'react';
import type { EngineEvent } from './EngineTypes';

export const TimelineTrack = ({ events }: { events: EngineEvent[] }) => {
  return (
    <div className="relative w-full h-32 bg-gray-900 border-b border-gray-700 overflow-x-auto overflow-y-hidden">
      {events.map((ev, index) => {
        const leftPx = ev.startT * 100;
        const widthPx = ev.duration * 100;

        if (ev.type === 'WAIT') {
          return (
            <div key={`wait-${index}`} className="absolute top-4 h-16 rounded opacity-60 flex items-center justify-center cursor-not-allowed"
              style={{ left: leftPx, width: widthPx, backgroundImage: 'repeating-linear-gradient(45deg, #374151 0, #374151 10px, #1f2937 10px, #1f2937 20px)' }}>
              {widthPx > 30 && <span className="text-xs text-gray-400 font-mono">发呆 {ev.duration.toFixed(1)}s</span>}
            </div>
          );
        }
        if (ev.type === 'CAST') {
          return (
            <div key={`cast-${index}`} className={`absolute top-4 h-16 rounded border border-gray-900 shadow-lg flex flex-col justify-center items-center ${ev.spellId === 'FoF' ? 'bg-blue-600' : 'bg-emerald-600'}`}
              style={{ left: leftPx, width: widthPx }}>
              <span className="font-bold text-white text-sm">{ev.spellId}</span>
              <span className="text-xs text-white/50">{ev.duration.toFixed(2)}s</span>
            </div>
          );
        }
      })}
    </div>
  );
};