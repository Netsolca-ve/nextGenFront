export type TournamentStatus = 'upcoming' | 'open' | 'finished';

export interface TournamentCategory {
    name: string;
    years: string;
}

export interface Tournament {
    id: string;
    mark: string;
    image: string;
    brand: string;
    name: string;
    subtitle: string;
    status: string;
    statusClass: TournamentStatus;
    dateShort: string;
    dateLong: string;
    place: string;
    organizer: string;
    categoryLabel: string;
    categories: TournamentCategory[];
    expectations: string[];
    time: string;
}

export const TOURNAMENTS: Tournament[] = [
    {
        id: 'futsal-cup',
        mark: 'FC',
        image: '/images/futsal-cup-banner.png',
        brand: 'Evento Next Gen',
        name: 'Futsal Cup',
        subtitle:
            'El torneo de futsal que reúne a las categorías SUB 9 y SUB 12 en Club Bella Vista de Maracaibo.',
        status: 'Inscripciones Abiertas',
        statusClass: 'open',
        dateShort: '07, 08, 14 Y 15 NOV 2026',
        dateLong: '07, 08, 14 y 15 de Noviembre de 2026',
        place: 'Club Bella Vista de Maracaibo',
        organizer: 'Next Gen',
        categoryLabel: 'SUB 9 · SUB 12',
        categories: [
            { name: 'SUB 9', years: '2018 - 2017' },
            { name: 'SUB 12', years: '2016 - 2015 - 2014' },
        ],
        expectations: [
            'Categorías SUB 9 y SUB 12',
            'Formato de juegos relámpagos',
            'Sede Club Bella Vista de Maracaibo',
            'Organizado por Juegos Relámpagos CBV',
        ],
        time: '10 PM',
    },
    {
        id: 'fifa-26',
        mark: 'FIFA 26',
        image: '',
        brand: 'EA Sports FC',
        name: 'FIFA 26',
        subtitle: 'Domina la cancha virtual y demuestra quién es el mejor con el balón.',
        status: 'Inscripciones Abiertas',
        statusClass: 'open',
        dateShort: '15 - 16 NOV 2026',
        dateLong: '15 - 16 de Noviembre de 2026',
        place: 'Sede Next Gen - Club Bella Vista',
        organizer: 'Next Gen',
        categoryLabel: '1v1',
        categories: [{ name: '1v1', years: 'Individual' }],
        expectations: [
            'Formato competitivo 1v1',
            'Transmisión en vivo',
            'Ambiente profesional',
            'Comunidad gamer',
        ],
        time: '2:00 PM',
    },
    {
        id: 'call-of-duty',
        mark: 'COD',
        image: '',
        brand: 'Call of Duty',
        name: 'Call of Duty',
        subtitle: 'Pon a prueba tu puntería y estrategia en el campo de batalla.',
        status: 'Finalizado',
        statusClass: 'finished',
        dateShort: '22 - 23 NOV 2026',
        dateLong: '22 - 23 de Noviembre de 2026',
        place: 'Sede Next Gen - Club Bella Vista',
        organizer: 'Next Gen',
        categoryLabel: 'Equipos',
        categories: [{ name: '5v5', years: 'Equipos' }],
        expectations: [
            'Formato competitivo por equipos',
            'Transmisión en vivo',
            'Ambiente profesional',
            'Comunidad gamer',
        ],
        time: '6:00 PM',
    },
    {
        id: 'valorant',
        mark: 'V',
        image: '',
        brand: 'Valorant',
        name: 'Valorant',
        subtitle: 'Coordina tu equipo y demuestra tu precisión en cada ronda.',
        status: 'Inscripciones Abiertas',
        statusClass: 'open',
        dateShort: '29 - 30 NOV 2026',
        dateLong: '29 - 30 de Noviembre de 2026',
        place: 'Sede Next Gen - Club Bella Vista',
        organizer: 'Next Gen',
        categoryLabel: '5v5',
        categories: [{ name: '5v5', years: 'Equipos' }],
        expectations: [
            'Formato competitivo 5v5',
            'Transmisión en vivo',
            'Ambiente profesional',
            'Comunidad gamer',
        ],
        time: '3:00 PM',
    },
];
