import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCalendarDays,
  LucideGoal,
  LucideTrophy,
} from '@lucide/angular';
import { TOURNAMENTS } from './tournaments.data';

@Component({
  imports: [
    RouterLink,
    LucideArrowRight,
    LucideCalendarDays,
    LucideGoal,
    LucideTrophy,
  ],
  selector: 'app-events',
  styleUrl: './events.scss',
  templateUrl: './events.html',
})
export class Events {
  readonly tournaments = TOURNAMENTS;
}
