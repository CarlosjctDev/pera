import { Injectable } from '@angular/core';

import { environment } from '@env/environment';
import type { Environment } from '@env/enviroment.model';
import { appName } from '@app/app-name';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  private readonly env: Environment = environment;

  get isProduction(): boolean {
    return this.env.production;
  }

  get appName(): typeof appName {
    return this.env.appName;
  }

  get appVersion(): string {  
    return this.env.appVersion;
  } 

}
