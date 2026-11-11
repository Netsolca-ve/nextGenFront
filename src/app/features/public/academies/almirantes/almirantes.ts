import { Component, OnDestroy, ElementRef, afterNextRender, inject } from '@angular/core';
import {
  LucideGoal,
  LucideMapPin,
  LucideGraduationCap,
  LucideStar,
  LucideIdCard,
  LucideFilePenLine,
  LucideBadgeCheck,
  LucideUserGroup,
  LucideTarget,
  LucideUser,
  LucideDumbbell,
  LucideSportShoe,
  LucideWhistle
} from "@lucide/angular";

@Component({
  imports: [
    LucideGoal,
    LucideMapPin,
    LucideGraduationCap,
    LucideStar,
    LucideIdCard,
    LucideFilePenLine,
    LucideBadgeCheck,
    LucideUserGroup,
    LucideTarget,
    LucideUser,
    // LucideDumbbell,
    LucideSportShoe,
    LucideWhistle
  ],
  selector: 'app-almirantes',
  styleUrl: './almirantes.scss',
  templateUrl: './almirantes.html',
})
export class Almirantes implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private carouselTimer?: ReturnType<typeof setInterval>;

  constructor() {
    // Solo en el navegador: en el prerender no hay carrusel que animar
    afterNextRender(() => this.setupCarousels());
  }

  private setupCarousels(): void {
    this.host.querySelectorAll('.siteImg').forEach((site) => {
        const carousel = site.querySelector('.carousel') as HTMLElement;
        const images = site.querySelectorAll('img');

        let index = 0;

        const changeImage = (newIndex: number) => {
            index = (newIndex + images.length) % images.length;
            carousel.style.transform = `translateX(-${index * 100}%)`;
        };

        site.querySelector('.next')?.addEventListener('click', () => {
            changeImage(index + 1);
        });

        site.querySelector('.prev')?.addEventListener('click', () => {
            changeImage(index - 1);
        });

        this.carouselTimer = setInterval(() => {
            changeImage(index + 1);
        }, 5000);
    });
  }

  ngOnDestroy(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
  }
}
