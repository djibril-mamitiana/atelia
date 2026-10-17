/** Takes one item from each list in turn: [[a1, a2, a3], [b1], [c1, c2]] → [a1, b1, c1, a2, c2, a3]. */
export function interleave<T>(lists: T[][]): T[] {
  const out: T[] = [];
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length) out.push(l[i]);
  return out;
}
