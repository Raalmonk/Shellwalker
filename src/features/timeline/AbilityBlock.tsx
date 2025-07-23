import React from 'react';

const ICON_SIZE = 20;

interface Props {
  startPx: number;
  icon: string;
}

export const AbilityBlock = ({ startPx, icon }: Props) => {
  // icon position aligns with the cast time without centering offset
  const iconX = startPx;
  return (
    <image href={icon} x={iconX} y={0} width={ICON_SIZE} height={ICON_SIZE} />
  );
};
