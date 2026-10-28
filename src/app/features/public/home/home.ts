import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideVolleyball, LucideTrendingUp, LucideShieldHalf, LucideGraduationCap } from '@lucide/angular';

@Component({
  imports: [
    RouterLink,
    LucideVolleyball,
    LucideTrendingUp,
    LucideShieldHalf,
    LucideGraduationCap
  ],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {}
