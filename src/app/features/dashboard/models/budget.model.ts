export interface Budget {
  readonly id?: number;
  readonly categoryId: number;
  readonly period: string;
  readonly limit: number;
}

export type NewBudget = Omit<Budget, 'id'>;
