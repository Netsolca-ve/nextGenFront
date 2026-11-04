import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCalendarDays,
  LucideGraduationCap,
  LucideShieldHalf,
  LucideTrendingUp,
  LucideTrophy,
  LucideVolleyball,
} from '@lucide/angular';
import { Tournaments } from '../../../@core/services/tournaments';

interface TimeLeft {
  dias: string;
  horas: string;
  minutos: string;
  segundos: string;
}

interface StandingRow {
  position: number;
  name: string;
  points: number;
  logo: string;
}

interface MatchTeam {
  name: string;
  logo: string;
}

interface LiveMatch {
  home: MatchTeam;
  away: MatchTeam;
  homeScore: number;
  awayScore: number;
  minute: string;
}

interface NextMatch {
  home: MatchTeam;
  away: MatchTeam;
  date: string;
  time: string;
}

// Logo provisional mientras se cargan los escudos reales de cada equipo.
const TEAM_LOGO_PLACEHOLDER = '/images/almirantes.png';

@Component({
  imports: [
    RouterLink,
    LucideArrowRight,
    LucideCalendarDays,
    LucideVolleyball,
    LucideTrendingUp,
    LucideShieldHalf,
    LucideGraduationCap,
    LucideTrophy,
  ],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private tournamentService = inject(Tournaments);
  nextTournament = signal<string>('');
  timeLeft = signal<TimeLeft>({ dias: '00', horas: '00', minutos: '00', segundos: '00' });

  // Datos de la sección "Torneos NextGen".
  standings = signal<StandingRow[]>([
    { position: 1, name: 'CITY FC', points: 24, logo: TEAM_LOGO_PLACEHOLDER },
    { position: 2, name: 'UNITED', points: 21, logo: TEAM_LOGO_PLACEHOLDER },
    { position: 3, name: 'RAYOS', points: 19, logo: TEAM_LOGO_PLACEHOLDER },
    { position: 4, name: 'TITANES', points: 17, logo: TEAM_LOGO_PLACEHOLDER },
    { position: 5, name: 'HALCONES', points: 15, logo: TEAM_LOGO_PLACEHOLDER },
  ]);

  liveMatch = signal<LiveMatch>({
    home: { name: 'CITY FC', logo: TEAM_LOGO_PLACEHOLDER },
    away: { name: 'RAYOS', logo: TEAM_LOGO_PLACEHOLDER },
    homeScore: 2,
    awayScore: 1,
    minute: '68:24',
  });

  nextMatch = signal<NextMatch>({
    home: { name: 'TITANES', logo: TEAM_LOGO_PLACEHOLDER },
    away: { name: 'HALCONES', logo: TEAM_LOGO_PLACEHOLDER },
    date: 'Sábado',
    time: '7:00 PM',
  });

  private targetDate!: Date;
  private timerSubscription!: any;

  ngOnInit(): void {
    this.tournamentService.getNearestTournament().subscribe({
      next: (res: any) => {
        this.nextTournament.set(res?.nombre?.toUpperCase() || 'Sin eventos próximos');

        if (res?.fechaInicio) {
          this.targetDate = new Date(res.fechaInicio);
          this.startCountdown();
        }
      },
      error: () => {
        this.nextTournament.set('Sin eventos próximos');
      },
    });
  }

  private startCountdown(): void {
    if (!this.targetDate) return;

    this.updateTime(); // Ejecutar de inmediato la primera vez

    this.timerSubscription = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  private updateTime(): void {
    if (!this.targetDate) return;

    const now = new Date().getTime();
    const distance = this.targetDate.getTime() - now;

    if (distance <= 0) {
      this.timeLeft.set({ dias: '00', horas: '00', minutos: '00', segundos: '00' });
      if (this.timerSubscription) clearInterval(this.timerSubscription);
      return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    this.timeLeft.set({
      dias: d < 10 ? `0${d}` : `${d}`,
      horas: h < 10 ? `0${h}` : `${h}`,
      minutos: m < 10 ? `0${m}` : `${m}`,
      segundos: s < 10 ? `0${s}` : `${s}`,
    });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      clearInterval(this.timerSubscription);
    }
  }
}
