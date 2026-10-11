export function normalizeText(value: string): string {
  return value
    .replace(/ñ/g, '\uE000')
    .replace(/Ñ/g, '\uE001')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .replace(/\uE000/g, 'ñ')
    .replace(/\uE001/g, 'Ñ')
    .trim();
}