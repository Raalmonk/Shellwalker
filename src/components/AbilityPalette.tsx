import React from 'react';
import { AbilityIcon } from './AbilityIcon';
import { TIMELINE_ROW_ORDER, TimelineRow } from '../constants/timelineRows';
import { wwData, WWKey } from '../jobs/windwalker';

interface Props {
  abilities: ReturnType<typeof wwData>;
  onUse: (key: WWKey) => void;
}

const ROW_MAP: Record<WWKey, TimelineRow> = {
  Xuen: 'majorCd',
  SEF: 'majorCd',
  CC: 'majorCd',
  AA: 'minorCd',
  SW: 'minorCd',
  FoF: 'majorFiller',
  RSK: 'majorFiller',
  RSK_HL: 'majorFiller',
  WU: 'majorFiller',
  TP: 'minorFiller',
  BOK: 'minorFiller',
  SCK: 'minorFiller',
  SCK_HL: 'minorFiller',
  BOK_HL: 'minorFiller',
  BL: 'majorCd', // put BL with major cds
};

export const AbilityPalette = ({ abilities, onUse }: Props) => (
  <div className="ability-grid">
    {TIMELINE_ROW_ORDER.map(row => (
      <div key={row} className="ability-row" role="list" data-row={row}>
        {Object.keys(abilities)
          .filter(k => ROW_MAP[k as WWKey] === row)
          .map(k => (
            <button
              key={k}
              onClick={() => onUse(k as WWKey)}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('text/plain', k);
              }}
              className="w-8 h-8 bg-blue-500 text-white rounded relative overflow-hidden"
            >
              <AbilityIcon abilityKey={k} />
            </button>
          ))}
      </div>
    ))}
  </div>
);
