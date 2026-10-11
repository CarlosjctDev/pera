import { normalizeText } from './text.utils';

describe('normalizeText', () => {
  it('trims whitespace and removes accents for comparison', () => {
    expect(normalizeText('  ÁRBOL y pingüino  ')).toBe('ARBOL y pinguino');
  });

  it('preserves ñ and Ñ while normalizing other diacritics', () => {
    expect(normalizeText(' NIÑO, ÑANDÚ ')).toBe('NIÑO, ÑANDU');
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(normalizeText(' \t\n ')).toBe('');
  });
});
