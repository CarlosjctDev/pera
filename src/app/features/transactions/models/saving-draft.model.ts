export interface SavingDraft {
  readonly amount: number | null;
  readonly categoryId: number | null;
  readonly concept: string;
}

export function emptySavingDraft(): SavingDraft {
  return { amount: null, categoryId: null, concept: '' };
}
