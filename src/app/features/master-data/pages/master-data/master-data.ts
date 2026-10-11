import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '@app/core/components/icons/icon.component';
import { Bytes } from '@app/core/i18n/pipes/bytes.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { APP_ROUTES } from '@app/core/routing/app.routing';
import { estimateBytes } from '@app/core/utils/size.utils';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { RelationshipTypeService } from '@app/features/master-data/services/relationship-type.service';
import { CategoryService } from '@app/features/transactions/services/category.service';

@Component({
  selector: 'app-master-data',
  imports: [RouterLink, Icon, T, Bytes],
  templateUrl: './master-data.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterData {
  private readonly categoryService = inject(CategoryService);
  private readonly relationshipTypeService = inject(RelationshipTypeService);
  private readonly contactService = inject(ContactService);

  protected readonly categoriesUrl =
    '/' + APP_ROUTES.masterData.path + '/' + APP_ROUTES.masterDataCategories.path;
  protected readonly relationshipsUrl =
    '/' + APP_ROUTES.masterData.path + '/' + APP_ROUTES.masterDataRelationships.path;
  protected readonly contactsUrl =
    '/' + APP_ROUTES.masterData.path + '/' + APP_ROUTES.masterDataContacts.path;

  protected readonly categories = this.categoryService.categories;
  protected readonly relationshipTypes = this.relationshipTypeService.relationshipTypes;
  protected readonly contacts = this.contactService.contacts;

  protected readonly categoriesSize = computed(() =>
    estimateBytes(this.categoryService.categories()),
  );
  protected readonly relationshipTypesSize = computed(() =>
    estimateBytes(this.relationshipTypeService.relationshipTypes()),
  );
  protected readonly contactsSize = computed(() => estimateBytes(this.contactService.contacts()));

  ngOnInit(): void {
    void this.categoryService.load();
    void this.relationshipTypeService.load();
    void this.contactService.load();
  }
}
