// Universos y sus palabras clave (el orden importa)

export const UNKNOWN_UNIVERSE = 'Otros / sin clasificar';

export const UNIVERSES = [
  { name: 'Build (Gunpla)', keywords: ['Build Fighters', 'Build Divers', 'Build Metaverse', 'Gunpla', 'Gundam Breaker', 'Plamo-Kyoshiro', 'Build Real'] },
  { name: 'Cosmic Era (SEED)', keywords: ['SEED', 'ZAFT', 'Astray', 'Cosmic Era'] },
  { name: 'Anno Domini (00)', keywords: ['Gundam 00', 'Celestial Being', 'GN Drive', '00V', '00F', '00P', '00I'] },
  { name: 'After Colony (Wing)', keywords: ['Gundam Wing', 'Endless Waltz', 'After Colony'] },
  { name: 'Future Century (G Gundam)', keywords: ['G Gundam', 'Gundam Fight', 'Future Century'] },
  { name: 'Advanced Generation (AGE)', keywords: ['Gundam AGE', 'Advanced Generation'] },
  { name: 'Post Disaster (IBO)', keywords: ['IRON-BLOODED ORPHANS', 'Iron-Blooded Orphans', 'Post Disaster', 'Gjallarhorn'] },
  { name: 'Ad Stella (Mercury)', keywords: ['Witch from Mercury', 'Ad Stella'] },
  { name: 'Regild Century (G-Reco)', keywords: ['Reconguista', 'Regild Century'] },
  { name: 'After War (Gundam X)', keywords: ['Gundam X', 'After War'] },
  { name: 'Correct Century (∀)', keywords: ['Turn A', '∀ Gundam', 'Correct Century'] },
  {
    name: 'Universal Century',
    keywords: [
      'Universal Century', 'Mobile Suit Gundam:', 'Zeta Gundam', 'Gundam ZZ', 'Gundam Unicorn', 'Gundam UC',
      'Gundam F90', 'Gundam F91', 'Victory Gundam', 'Crossbone', "Char's Counterattack", 'Hathaway',
      '0079', '0080', '0083', '08th MS Team', 'Thunderbolt', 'Advance of Zeta', 'Gundam Sentinel',
      'Zeon', 'Earth Federation', 'RX-7', 'GP0', 'Ez8', 'MS-X', "Gihren's Greed", 'Titans', 'AEUG', 'Mobile Suit Variation', 'MSV', 'Silhouette Formula',
      'Mobile Suit Gundam',
    ],
  },
];

// Devuelve el universo según la descripción
export const detectUniverse = (text = '') =>
  UNIVERSES.find(({ keywords }) => keywords.some((keyword) => text.includes(keyword)))?.name ??
  UNKNOWN_UNIVERSE;
