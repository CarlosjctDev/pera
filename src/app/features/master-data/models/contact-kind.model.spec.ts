import { canIncludeSelfContact } from './contact-kind.model';

describe('canIncludeSelfContact', () => {
  it('allows the self contact only for people', () => {
    expect(canIncludeSelfContact('person')).toBe(true);
    expect(canIncludeSelfContact('company')).toBe(false);
  });

  it('does not allow the self contact for pets or before a kind is selected', () => {
    expect(canIncludeSelfContact('pet')).toBe(false);
    expect(canIncludeSelfContact(null)).toBe(false);
  });
});