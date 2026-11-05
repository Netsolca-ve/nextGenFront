export function matchSlug(idPartido: number, local: string | null | undefined, visitante: string | null | undefined): string {
  return `${slugPart(local || 'local')}-vs-${slugPart(visitante || 'visitante')}-${idPartido}`;
}

export function matchIdFromSlug(slug: string | null): number | null {
  const match = String(slug ?? '').match(/-(\d+)$/);
  const id = match ? Number(match[1]) : Number(slug);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function slugPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}