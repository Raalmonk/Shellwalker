import React from 'react';

export interface BlessingSegment {
  startMs: number;
  endMs: number;
  startPx: number;
  widthPx: number;
  stacks: number;
}

export function selectBlessingStacks(segments: { startMs: number; endMs: number }[], timeMs: number): number {
  return segments.filter(s => s.startMs <= timeMs && timeMs < s.endMs).length;
}

interface Props {
  segments: BlessingSegment[];
  rowMidY: number;
}

export const BlessingRow = ({ segments, rowMidY }: Props) => (
  <g>
    {segments.map((seg, i) => (
      <g key={i}>
        <rect
          x={seg.startPx}
          y={rowMidY - 6}
          width={seg.widthPx}
          height={12}
          fill="#008800"
        />
        {seg.widthPx >= 24 && (
          <text
            x={seg.startPx + 2}
            y={rowMidY + 4}
            fontSize={11}
            fontWeight="bold"
            fill="#ffffff"
            pointerEvents="none"
          >
            {`${seg.stacks}×`}
          </text>
        )}
      </g>
    ))}
  </g>
);

