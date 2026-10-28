import { Component } from '@angular/core';
import { LucideGoal, LucideEye } from '@lucide/angular';

@Component({
  imports: [
    LucideGoal,
    LucideEye
  ],
  selector: 'app-about-us',
  styleUrl: './about-us.scss',
  templateUrl: './about-us.html',
})
export class AboutUs {}
