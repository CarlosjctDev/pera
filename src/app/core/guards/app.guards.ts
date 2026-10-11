import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { ProfileService } from '@app/features/profile/services/profile.service';

import type { MaybeAsync, UrlTree } from '@angular/router';

export function welcomeGuard(): MaybeAsync<boolean | UrlTree> {
  return inject(ProfileService).completed() ? inject(Router).createUrlTree(['/dashboard']) : true;
}

export function profileGuard(): MaybeAsync<boolean | UrlTree> {
  return inject(ProfileService).completed() ? true : inject(Router).createUrlTree(['/welcome']);
}
