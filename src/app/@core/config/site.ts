/**
 * Datos públicos del sitio usados para SEO (títulos, descripciones, canonical,
 * Open Graph y JSON-LD).
 *
 * Cuando conectes un dominio propio, cambia SOLO `url` aquí y en
 * `public/robots.txt` / `public/sitemap.xml` / `src/index.html`.
 */
export const SITE = {
  name: 'NextGen',
  url: 'https://next-gen-chris-projects-29c611e1.vercel.app',
  title: 'NextGen | Formación y gestión deportiva',
  description:
    'Plataforma integral de formación, gestión y competencia deportiva: academias, torneos, partidos y estadísticas para atletas, clubes y organizaciones.',
  image: '/images/hero.jpg',
  locale: 'es_VE',
  instagram: 'https://www.instagram.com/nextgen.ven/',
  whatsapp: '+584166687002',
} as const;
