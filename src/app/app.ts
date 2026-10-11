import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
}
