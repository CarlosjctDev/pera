import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '@app/core/components/icons/icon.component';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { APP_ROUTES } from '@app/core/routing/app.routing';
import { CategoryForm } from '@app/features/master-data/pages/categories/components/category-form/category-form';
import { CategoryList } from '@app/features/master-data/pages/categories/components/category-list/category-list';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';

@Component({
  selector: 'app-master-categories',
  imports: [RouterLink, Icon, T, TippyDirective, CategoryForm, CategoryList],
  templateUrl: './categories.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories {
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);

  protected readonly masterDataUrl = '/' + APP_ROUTES.masterData.path;

  ngOnInit(): void {
    void this.categoryService.load();
    void this.transactionService.load();
  }
}
