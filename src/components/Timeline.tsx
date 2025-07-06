import React from 'react';
import { WWKey } from '../jobs/windwalker';

export const Timeline = ({ queue }: { queue: WWKey[] }) => (
  <ul className="list-disc pl-5">
    {queue.map((a,i)=><li key={i}>{a}</li>)}
  </ul>
);
