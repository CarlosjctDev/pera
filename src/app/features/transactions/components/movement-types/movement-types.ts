import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';

import { Icon } from '@app/core/components/icons/icon.component';
import { Bytes } from '@app/core/i18n/pipes/bytes.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { estimateBytes } from '@app/core/utils/size.utils';
import { TransactionService } from '@app/features/transactions/services/transaction.service';

import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import type { TransactionType } from '@app/features/transactions/models/transaction-type.model';
import { TRANSACTION_TYPE_COLORS } from '@app/features/transactions/models/transaction-type.model';

@Component({
  selector: 'app-movement-types',
  imports: [Icon, T, Bytes],
  templateUrl: './movement-types.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementTypes {
  protected readonly transactionService = inject(TransactionService);

  @Output() readonly select = new EventEmitter<TransactionType>();

  protected readonly types: readonly TransactionType[] = ['income', 'expense', 'saving'];

  protected typeLabel(type: TransactionType): TranslationKey {
    return `movements.type.${type}` as TranslationKey;
  }

  protected typeDescription(type: TransactionType): TranslationKey {
    return `movements.description.${type}` as TranslationKey;
  }

  protected typeCount(type: TransactionType): number {
    return this.transactionService.transactions().filter((transaction) => transaction.type === type)
      .length;
  }

  protected typeColor(type: TransactionType): string {
    return TRANSACTION_TYPE_COLORS[type];
  }

  protected typeSize(type: TransactionType): number {
    return estimateBytes(
      this.transactionService.transactions().filter((transaction) => transaction.type === type),
    );
  }
}
