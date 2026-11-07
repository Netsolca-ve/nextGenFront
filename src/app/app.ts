import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './@core/services/seo';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('nextGen');

  constructor() {
    inject(SeoService).init();
  }
}
