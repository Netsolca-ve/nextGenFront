import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideCheck,
  LucideClock,
  LucideGoal,
  LucideMapPin,
  LucideShieldCheck,
  LucideUsers,
} from '@lucide/angular';
import { map } from 'rxjs';
import { TOURNAMENTS, Tournament } from '../../tournaments.data';

@Component({
  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideArrowRight,
    LucideCalendarDays,
    LucideCheck,
    LucideClock,
    LucideGoal,
    LucideMapPin,
    LucideShieldCheck,
    LucideUsers,
  ],
  selector: 'app-event',
  styleUrl: './event.scss',
  templateUrl: './event.html',
})
export class Event {
  private readonly route = inject(ActivatedRoute);

  private readonly eventId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null },
  );

  readonly tournament = computed<Tournament>(() => {
    const id = this.eventId();
    return TOURNAMENTS.find((tournament) => tournament.id === id) ?? TOURNAMENTS[0];
  });

  get shareUrl(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nextgen.ven';
    return encodeURIComponent(`${origin}/events/${this.tournament().id}`);
  }
}
