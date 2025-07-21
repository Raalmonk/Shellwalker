import React from 'react';

export const BlessIcon = ({ layers }: { layers: number }) => (
  <div className="relative inline-block">
    <span>祝福</span>
    {layers > 0 && (
      <span className="badge absolute -top-1 -right-2 text-xs">×{layers}</span>
    )}
  </div>
);

// END_PATCH
