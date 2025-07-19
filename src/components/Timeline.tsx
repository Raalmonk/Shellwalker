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
  'Boss技能(1)',
  'Boss技能(2)',
  '踏风技能(1)',
  '踏风技能(2)',
];

export const Timeline = ({ items, duration }: { items: TLItem[]; duration: number }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  const groupDS = useRef(new DataSet<DataGroup>(
    groups.map((g, i) => ({ id: i + 1, content: g }))
  ));
  const itemDS = useRef(new DataSet<DataItem>());

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
          minorLabels: (date: Date) => {
            const sec = Math.floor(date.getTime() / 1000);
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

  return <div ref={containerRef} />;
};
