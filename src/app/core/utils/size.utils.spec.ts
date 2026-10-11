import { estimateBytes } from './size.utils';

describe('estimateBytes', () => {
  it('returns the UTF-8 byte size of the JSON representation', () => {
    expect(estimateBytes('pera')).toBe(6);
    expect(estimateBytes('ñ')).toBe(4);
  });

  it('estimates objects from their serialized representation', () => {
    expect(estimateBytes({ amount: 12 })).toBe(new Blob(['{"amount":12}']).size);
  });

  it('returns zero when a value cannot be serialized', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(estimateBytes(circular)).toBe(0);
    expect(estimateBytes(1n)).toBe(0);
  });
});
