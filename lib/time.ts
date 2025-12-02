export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
) {
  // solape si se tocan en más de 0 minutos
  return startA < endB && startB < endA;
}
