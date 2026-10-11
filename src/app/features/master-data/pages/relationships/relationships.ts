import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '@app/core/components/icons/icon.component';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { APP_ROUTES } from '@app/core/routing/app.routing';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { RelationshipTypeService } from '@app/features/master-data/services/relationship-type.service';
import { RelationshipForm } from '@app/features/master-data/pages/relationships/components/relationship-form/relationship-form';
import { RelationshipList } from '@app/features/master-data/pages/relationships/components/relationship-list/relationship-list';

@Component({
  selector: 'app-master-relationships',
  imports: [RouterLink, Icon, T, TippyDirective, RelationshipForm, RelationshipList],
  templateUrl: './relationships.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Relationships {
  private readonly contactService = inject(ContactService);
  private readonly relationshipTypeService = inject(RelationshipTypeService);

  protected readonly masterDataUrl = '/' + APP_ROUTES.masterData.path;

  ngOnInit(): void {
    void this.relationshipTypeService.load();
    void this.contactService.load();
  }
}
