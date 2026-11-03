import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideVolleyball, LucideTrendingUp, LucideShieldHalf, LucideGraduationCap } from '@lucide/angular';
import { Tournaments } from '../../../@core/services/tournaments';

interface TimeLeft {
  dias: string;
  horas: string;
  minutos: string;
  segundos: string;
}

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
export class Home implements OnInit{
  private tournamentService = inject(Tournaments);
  nextTournament = signal<string>('');
  timeLeft = signal<TimeLeft>({dias: '00', horas: '00', minutos: '00', segundos: '00'});

  private targetDate!: Date
  private timerSubscription!: any;

  ngOnInit(): void {
    this.tournamentService.getNearestTournament().subscribe({
      next: (res: any) => {
        this.nextTournament.set(res?.nombre?.toUpperCase() || 'No upcoming tournament');

        if(res?.fechaInicio){
          this.targetDate = new Date(res.fechaInicio);
          this.startCountdown();
        }
      },
      error: () => {
        this.nextTournament.set('No upcoming tournament');
      }
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
      segundos: s < 10 ? `0${s}` : `${s}`
    });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      clearInterval(this.timerSubscription);
    }
  }
}
