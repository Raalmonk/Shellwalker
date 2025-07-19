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

    );
  }, []);

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

  }, [items]);

  return <div ref={containerRef} />;
};
