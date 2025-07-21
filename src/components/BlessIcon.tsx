import React from 'react';

export default function BlessIcon({ layers }: { layers: number }) {
  return (
    <span className="relative inline-block mx-1">
      <span>祝福</span>
      {layers > 0 && (
        <span className="badge absolute -right-2 -top-2">×{layers}</span>
      )}
    </span>
  );
}

// END_PATCH
