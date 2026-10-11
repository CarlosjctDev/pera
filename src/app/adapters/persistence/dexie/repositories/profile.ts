import { Injectable, inject } from '@angular/core';

import {
  type NewProfile,
  type Profile,
  type ProfileRepository,
} from '@app/features/profile/data-access/profile.repository';
import {
  type CurrencyCode,
  DEFAULT_CURRENCY,
  isCurrency,
} from '@app/features/profile/models/currency.model';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';

@Injectable()
export class DexieProfileRepository implements ProfileRepository {
  private readonly db = inject(AppDatabase);
  private readonly PROFILE_ID = 1;

  async get(): Promise<Profile | undefined> {
    const profile = await this.db.profiles.get(this.PROFILE_ID);

    if (!profile) {
      return undefined;
    }

    const currency: CurrencyCode = isCurrency(profile.currency)
      ? profile.currency
      : DEFAULT_CURRENCY;

    return { ...profile, currency };
  }

  async save(profile: NewProfile): Promise<Profile> {
    const current = await this.get();

    const record: Profile = {
      ...profile,
      id: 1,
      createdAt: current?.createdAt ?? new Date(),
    };

    await this.db.profiles.put(record);

    return record;
  }
}
