import { InjectionToken } from '@angular/core';

import type { CurrencyCode } from '@app/features/profile/models/currency.model';

export interface Profile {
  readonly id: number;
  readonly name: string;
  readonly currency: CurrencyCode;
  readonly createdAt: Date;
}

export type NewProfile = Omit<Profile, 'id' | 'createdAt'>;

export interface ProfileRepository {
  get(): Promise<Profile | undefined>;
  save(profile: NewProfile): Promise<Profile>;
}

export const PROFILE_REPOSITORY = new InjectionToken<ProfileRepository>('PROFILE_REPOSITORY');
