/**
 * Lleva la vista a una sección usando el scroll nativo (`scrollIntoView`),
 * que sí respeta `scroll-margin-top`. Angular con `anchorScrolling` usa
 * `window.scrollTo` y lo ignora.
 *
 * Si mientras tanto carga contenido más arriba (datos de torneos, imágenes)
 * y la página cambia de alto, se vuelve a alinear la sección durante un
 * momento para que no quede cortada. Si el usuario hace scroll, se detiene.
 */
let stopPrevious: (() => void) | null = null;

export function scrollToSection(id: string, smooth = true): void {
  if (typeof document === 'undefined') return;

  stopPrevious?.();

  const align = (behavior: ScrollBehavior) => {
    document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
  };

  align(smooth ? 'smooth' : 'auto');

  if (typeof ResizeObserver === 'undefined') return;

  let lastHeight = document.body.scrollHeight;
  const observer = new ResizeObserver(() => {
    const height = document.body.scrollHeight;
    if (height !== lastHeight) {
      lastHeight = height;
      align('auto');
    }
  });
  observer.observe(document.body);

  const userEvents = ['wheel', 'touchstart', 'keydown'] as const;
  const stop = () => {
    observer.disconnect();
    clearTimeout(timer);
    userEvents.forEach((event) => window.removeEventListener(event, stop));
    if (stopPrevious === stop) stopPrevious = null;
  };
  const timer = setTimeout(stop, 2500);
  userEvents.forEach((event) => window.addEventListener(event, stop, { passive: true }));
  stopPrevious = stop;
}
