import type { AttachmentOwnerType } from '@app/features/attachments/models/attachment.model';
import type { TransactionType } from '@app/features/transactions/models/transaction-type.model';

export type CalendarEventKind = 'movement' | 'receivable' | 'payable';

export interface CalendarEvent {
  readonly key: string;
  readonly kind: CalendarEventKind;
  readonly day: string;
  readonly label: string;
  readonly sublabel?: string;
  readonly amount: number;
  readonly transactionType?: TransactionType;
  readonly ownerType?: AttachmentOwnerType;
  readonly ownerId?: number;
}
