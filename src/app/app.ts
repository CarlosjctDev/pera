import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

import { ToastrComponent } from '@app/core/components/toastr/toastr';
import { EnvironmentService } from '@env/enviroment.service';
 

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastrComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly environment = inject(EnvironmentService);
  protected readonly title = signal(this.environment.appName);

  private readonly swUpdate = inject(SwUpdate, { optional: true });

  constructor() {
    const swUpdate = this.swUpdate;

    if (swUpdate === null) {
      return;
    }

    swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        void swUpdate.activateUpdate().then(() => document.location.reload());
      }
    });
  }
}
