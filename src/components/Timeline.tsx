import React, { useEffect, useRef } from 'react';
import { DataSet, Timeline as VisTimeline } from 'vis-timeline/standalone';
import type { DataItem, DataGroup } from 'vis-timeline';

// Item displayed on the timeline. `end` is optional so we can draw range
// bars (used for cooldown visualization).
export interface TLItem {
  id: number;
  group: number;     // group id 1-4
  start: number;     // start time in seconds
  end?: number;      // optional end time in seconds
  label: string;
  ability?: string;  // ability key, used for editing
  className?: string;
}

const groups = [
  '踏风技能(1)',
  '踏风技能(2)',
  '踏风技能(3)',
  '踏风技能(4)',
];

// Position of a cooldown finishing mark shown as a vertical line
export interface CDLine { id: string; time: number; }
interface Props {
  items: TLItem[];
  start: number;
  end: number;
  cursor: number;
  cds: CDLine[];
  showCD: boolean;
  // notify parent when the cursor (blue line) moves
  onCursorChange?: (t: number) => void;
  // window range changed (zoom/pan)
  onRangeChange?: (start: number, end: number) => void;
  // item moved by dragging
  onItemMove?: (id: number, start: number, end?: number) => void;
  // right click on item
  onItemContext?: (id: number) => void;
  // left click on item
  onItemClick?: (id: number) => void;
}

export const Timeline = ({ items, start, end, cursor, cds, showCD, onCursorChange, onRangeChange, onItemMove, onItemContext, onItemClick }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  const groupDS = useRef(new DataSet<DataGroup>(
    groups.map((g, i) => ({ id: i + 1, content: g }))
  ));
  // dataset for the timeline items
  const itemDS = useRef(new DataSet<DataItem>());
  // flag to ensure custom time is added only once
  const cursorAdded = useRef(false);
  // ids of custom time markers used for cd lines
  const cdIds = useRef<string[]>([]);

  useEffect(() => {
    if (!containerRef.current || timelineRef.current) return;
    const tl = new VisTimeline(
      containerRef.current,
      itemDS.current,
      groupDS.current,
      {
        stack: false,
        height: '240px',
        start: new Date(start * 1000),
        end: new Date(end * 1000),
        editable: { updateTime: true },
        onMove: (item: any, callback: (item: any) => void) => {
          onItemMove?.(
            Number(item.id),
            item.start.valueOf() / 1000,
            item.end ? item.end.valueOf() / 1000 : undefined
          );
          callback(null);
        },
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
    timelineRef.current = tl;
    tl.on('contextmenu', props => {
      if (props.item) {
        props.event.preventDefault();
        onItemContext?.(Number(props.item));
      }
    });
    // allow dragging the custom time and clicking to change it
    tl.on('timechanged', props => {
      if (props.id === 'cursor' && onCursorChange) {
        onCursorChange(props.time.valueOf() / 1000);
      }
    });
    tl.on('click', props => {
      if (props.item) {
        onItemClick?.(Number(props.item));
        return;
      }
      if (props.time) {
        tl.setCustomTime(props.time, 'cursor');
        onCursorChange?.(props.time.valueOf() / 1000);
      }
    });
    tl.on('rangechanged', props => {
      onRangeChange?.(
        props.start.valueOf() / 1000,
        props.end.valueOf() / 1000
      );
    });
  }, [onCursorChange, onRangeChange, onItemMove, onItemContext, onItemClick]);

  useEffect(() => {
    timelineRef.current?.setWindow(new Date(start * 1000), new Date(end * 1000));
  }, [start, end]);

  useEffect(() => {
    // rebuild dataset whenever items change
    itemDS.current.clear();
    itemDS.current.add(
      items.map(it => ({
        id: it.id,
        group: it.group,
        content: it.label,
        start: new Date(it.start * 1000),
        end: it.end ? new Date(it.end * 1000) : undefined,
        type: it.end ? 'range' : 'box',
        className: it.className,
      }))
    );
  }, [items]);

  useEffect(() => {
    // keep custom time (blue line) in sync with cursor value
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
    // redraw cooldown end lines whenever they change
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
