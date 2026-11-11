/**
 * Datos públicos del sitio usados para SEO (títulos, descripciones, canonical,
 * Open Graph y JSON-LD).
 *
 * Cuando conectes un dominio propio, cambia SOLO `url` aquí y en
 * `public/robots.txt` / `public/sitemap.xml` / `src/index.html`.
 */
export const SITE = {
  name: 'Next Gen Sport Ecosystem',
  url: 'https://www.nextgen.com.ve',
  title: 'Next Gen Venezuela | Torneos de futsal y academias',
  description:
    'Next Gen Venezuela: torneos de futsal, academias deportivas, partidos en vivo, resultados y estadísticas para atletas, clubes y organizaciones.',
  image: '/images/hero.jpg',
  locale: 'es_VE',
  instagram: 'https://www.instagram.com/nextgen.ven/',
  whatsapp: '+584166687002',
} as const;
