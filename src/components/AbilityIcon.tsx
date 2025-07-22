import React, { useEffect, useRef, useState } from 'react';
import { ABILITY_ICON_MAP } from '../constants/icons';

type Props = { abilityKey: string; className?: string };

export const AbilityIcon = ({ abilityKey, className }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [small, setSmall] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setSmall(el.clientWidth < 32);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { src, abbr } = ABILITY_ICON_MAP[abilityKey] ?? { src: '', abbr: abilityKey };

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <img src={src} alt={abilityKey} className="w-full h-full" />
      {small && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
          {abbr}
        </span>
      )}
    </div>
  );
};
