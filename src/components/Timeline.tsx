import React, { useEffect, useRef } from "react";
import { DataSet, Timeline as VisTimeline } from "vis-timeline/standalone";
import type { DataItem, DataGroup } from "vis-timeline";
import { GRID_STEP_MS } from "../constants/time";

// Item displayed on the timeline. `end` is optional so we can draw range
// bars (used for cooldown visualization).
export interface TLItem {
  id: number;
  group: number; // group id 1-13
  start: number; // start time in seconds
  end?: number; // optional end time in seconds
  label: string;
  stacks?: number;
  ability?: string; // ability key, used for editing
  className?: string;
  pendingDelete?: boolean;
  type?: string;
  title?: string;
}

import { t } from '../i18n/en';
import { GUIDE_COLOR } from '../constants/colors';

const groups = [
  t('阶段'),
  'Haste',
  'Xuen',
  'SEF',
  'Acclamation',
  'Bloodlust',
  t('Boss时间轴'),
  'Blessing',
  t('青龙之心'),
  'Major Cooldown',
  'Minor Cooldown',
  'Major Filler',
  'Minor Filler',
];

// Position of a cooldown finishing mark shown as a vertical line
export interface CDLine {
  id: string;
  time: number;
}
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

export const Timeline = ({
  items,
  start,
  end,
  cursor,
  cds,
  showCD,
  onCursorChange,
  onRangeChange,
  onItemMove,
  onItemContext,
  onItemClick,
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<VisTimeline | null>(null);

  // store latest callbacks so external events always use up-to-date handlers
  const moveRef = useRef(onItemMove);
  const contextRef = useRef(onItemContext);
  const clickRef = useRef(onItemClick);
  const cursorRef = useRef(onCursorChange);
  const rangeRef = useRef(onRangeChange);

  useEffect(() => {
    moveRef.current = onItemMove;
  }, [onItemMove]);
  useEffect(() => {
    contextRef.current = onItemContext;
  }, [onItemContext]);
  useEffect(() => {
    clickRef.current = onItemClick;
  }, [onItemClick]);
  useEffect(() => {
    cursorRef.current = onCursorChange;
  }, [onCursorChange]);
  useEffect(() => {
    rangeRef.current = onRangeChange;
  }, [onRangeChange]);
  const groupDS = useRef(
    new DataSet<DataGroup>(groups.map((g, i) => ({ id: i + 1, content: g }))),
  );
  // dataset for the timeline items
  const itemDS = useRef(new DataSet<DataItem>());
  // flag to ensure custom time is added only once
  const cursorAdded = useRef(false);
  // ids of custom time markers used for cd lines
  const cdIds = useRef<string[]>([]);

  useEffect(() => {
    if (!containerRef.current || timelineRef.current) return;
    const totalHeight = groups.length * 58 + 200;
    const tl = new VisTimeline(
      containerRef.current,
      itemDS.current,
      groupDS.current,
      {
        stack: false,
        height: totalHeight + "px",
        align: 'left',
        start: new Date(start * 1000),
        end: new Date(end * 1000),
        editable: { updateTime: true },
        onMove: (item: any, callback: (item: any) => void) => {
          const snap = (ms: number) =>
            Math.round(ms / GRID_STEP_MS) * GRID_STEP_MS;
          const startMs = snap(item.start.valueOf());
          const endSec = item.end ? snap(item.end.valueOf()) / 1000 : undefined;
          item.start = new Date(startMs);
          if (endSec !== undefined) item.end = new Date(endSec * 1000);
          moveRef.current?.(
            Number(item.id),
            startMs / 1000,
            endSec,
          );
          callback(item);
        },
        format: {
          minorLabels: (date: any) => {
            const sec = Math.floor(date.valueOf() / 1000);
            const m = String(Math.floor(sec / 60)).padStart(2, "0");
            const s = String(sec % 60).padStart(2, "0");
            return `${m}:${s}`;
          },
          majorLabels: () => "",
        },
      },
    );
    timelineRef.current = tl;
    tl.on("contextmenu", (props) => {
      if (props.item) {
        props.event.preventDefault();
        contextRef.current?.(Number(props.item));
      }
    });
    // allow dragging the custom time and clicking to change it
    tl.on("timechanged", (props) => {
      if (props.id === "cursor") {
        cursorRef.current?.(props.time.valueOf() / 1000);
      }
    });
    tl.on("click", (props) => {
      if (props.item) {
        clickRef.current?.(Number(props.item));
        return;
      }
      if (props.time) {
        tl.setCustomTime(props.time, "cursor");
        cursorRef.current?.(props.time.valueOf() / 1000);
      }
    });
    tl.on("rangechanged", (props) => {
      rangeRef.current?.(
        props.start.valueOf() / 1000,
        props.end.valueOf() / 1000,
      );
    });
  }, []);

  useEffect(() => {
    timelineRef.current?.setWindow(
      new Date(start * 1000),
      new Date(end * 1000),
    );
  }, [start, end]);

  useEffect(() => {
    // rebuild dataset whenever items change
    itemDS.current.clear();
    itemDS.current.add(
      items.map((it) => ({
        id: it.id,
        group: it.group,
        content: it.label,
        start: new Date(it.start * 1000),
        end: it.end ? new Date(it.end * 1000) : undefined,
        type: it.end ? "range" : "box",
        className: [
          it.className,
          it.type === 'guide' ? 'event-guide' : '',
          it.type === 'gcd' ? 'gcd' : '',
        ]
          .filter(Boolean)
          .join(' '),
        ...(it.stacks ? { stacks: it.stacks } : {}),
        ...(it.title ? { title: it.title } : {}),
        style:
          it.type === 'guide'
            ? `background-color:${GUIDE_COLOR};border-color:${GUIDE_COLOR};color:#000`
            : undefined,
      })),
    );
  }, [items]);

  useEffect(() => {
    // keep custom time (blue line) in sync with cursor value
    if (!timelineRef.current) return;
    const tl = timelineRef.current;
    if (!cursorAdded.current) {
      tl.addCustomTime(new Date(cursor * 1000), "cursor");
      cursorAdded.current = true;
    } else {
      tl.setCustomTime(new Date(cursor * 1000), "cursor");
    }
  }, [cursor]);

  useEffect(() => {
    // redraw cooldown end lines whenever they change
    if (!timelineRef.current) return;
    const tl = timelineRef.current;
    cdIds.current.forEach((id) => tl.removeCustomTime(id));
    cdIds.current = [];
    if (showCD) {
      cds.forEach((c) => {
        const id = `cd-${c.id}-${Math.random()}`;
        cdIds.current.push(id);
        tl.addCustomTime(new Date(c.time * 1000), id);
      });
    }
  }, [cds, showCD]);
  return <div ref={containerRef} />;
};
