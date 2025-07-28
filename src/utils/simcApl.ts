export function toSimcName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

export interface AplItem {
  ability: string;
  start: number;
}

export function exportSimcApl(
  items: AplItem[],
  nameMap: Record<string, { name?: string }>,
): string {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  let out = '';
  let prev = 0;
  sorted.forEach((it, idx) => {
    const entryName = nameMap[it.ability]?.name || it.ability;
    const simc = toSimcName(entryName);
    if (idx === 0) {
      out += `actions+=/${simc}\n`;
    } else {
      const diff = Number((it.start - prev).toFixed(3));
      if (diff > 0) out += `actions+=/wait,sec=${diff}\n`;
      out += `actions+=/${simc}\n`;
    }
    prev = it.start;
  });
  return out.trim();
}
