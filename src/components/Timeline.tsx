import React, { useEffect, useRef } from 'react';
import { DataSet, Timeline as VisTimeline } from 'vis-timeline/standalone';
import type { DataItem, DataGroup } from 'vis-timeline';

export interface TLItem {
  id: number;
  group: number;  // 1-4
  start: number;  // seconds
  label: string;
}

const groups = [
  '踏风技能(1)',
  '踏风技能(2)',
  '踏风技能(3)',
  '踏风技能(4)',
];

export interface CDLine { id: string; time: number; }

export const Timeline = ({ items, duration, cursor, cds, showCD }:{ items: TLItem[]; duration: number; cursor:number; cds: CDLine[]; showCD:boolean }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  const groupDS = useRef(new DataSet<DataGroup>(
    groups.map((g, i) => ({ id: i + 1, content: g }))
  ));
  const itemDS = useRef(new DataSet<DataItem>());
  const cursorAdded = useRef(false);
  const cdIds = useRef<string[]>([]);

  useEffect(() => {
    if (!containerRef.current || timelineRef.current) return;
    timelineRef.current = new VisTimeline(
      containerRef.current,
      itemDS.current,
      groupDS.current,
      {
        stack: false,
        height: '240px',
        start: new Date(0),
        end: new Date(duration * 1000),
        format: {
          minorLabels: (date: any) => {
            const sec = Math.floor(date.valueOf() / 1000);
            const m = String(Math.floor(sec / 60)).padStart(2, '0');
            const s = String(sec % 60).padStart(2, '0');
            return `${m}:${s}`;
          },
          majorLabels: () => '',
        },
      }
    );
  }, []);

  useEffect(() => {
    timelineRef.current?.setWindow(new Date(0), new Date(duration * 1000));
  }, [duration]);

  useEffect(() => {
    itemDS.current.clear();
    itemDS.current.add(
      items.map(it => ({
        id: it.id,
        group: it.group,
        content: it.label,
        start: new Date(it.start * 1000),
      }))
    );
    timelineRef.current?.setWindow(new Date(0), new Date(duration * 1000));
  }, [items]);

  useEffect(() => {
    if (!timelineRef.current) return;
    const tl = timelineRef.current;
    if (!cursorAdded.current) {
      tl.addCustomTime(new Date(cursor * 1000), 'cursor');
      cursorAdded.current = true;
    } else {
      tl.setCustomTime(new Date(cursor * 1000), 'cursor');
    }
  }, [cursor]);

  useEffect(() => {
    if (!timelineRef.current) return;
    const tl = timelineRef.current;
    cdIds.current.forEach(id => tl.removeCustomTime(id));
    cdIds.current = [];
    if (showCD) {
      cds.forEach(c => {
        const id = `cd-${c.id}-${Math.random()}`;
        cdIds.current.push(id);
        tl.addCustomTime(new Date(c.time * 1000), id);
      });
    }
  }, [cds, showCD]);
  return <div ref={containerRef} />;
};
