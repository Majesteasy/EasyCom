// ============================================================
// EASYCOM — BASE PRODUITS ALIGNÉE SUR index.html
// Amazon Partner ID : easycom0-21
// ============================================================

const AMAZON_ID = 'easycom0-21';

function amazonUrl(asin) {
  return asin ? `https://www.amazon.fr/dp/${asin}?tag=${AMAZON_ID}` : '';
}

const PRODUCTS = [
  {
    id: 'p1',
    cat: 'earbuds',
    icon: '🎧',
    badge: 'Premium',
    name_fr: 'WT2 Plus',
    name_en: 'WT2 Plus',
    desc_fr: 'Oreillettes traductrices bidirectionnelles avec mode hors ligne inclus. Autonomie 12h avec boîtier.',
    desc_en: 'Two-way translator earbuds with offline mode included. 12h battery with case.',
    supplier: 'Amazon',
    amazon_asin: 'B084NZL8G3',
    amazon_url: amazonUrl('B084NZL8G3'),
    images: ['https://m.media-amazon.com/images/I/41IY0aKP5ZL._AC_UF1000,1000_QL80_.jpg']
  },
  {
    id: 'p2',
    cat: 'earbuds',
    icon: '🎧',
    badge: 'Popular',
    name_fr: 'Timekettle M3',
    name_en: 'Timekettle M3',
    desc_fr: 'Traduction simultanée bidirectionnelle, 40 langues et 93 accents. Mode hors ligne 13 langues. Autonomie 7,5h, 25h avec boîtier.',
    desc_en: 'Two-way simultaneous translation, 40 languages & 93 accents. 13 offline languages. 7.5h battery, 25h with case.',
    supplier: 'Amazon',
    amazon_asin: 'B0B8NJR625',
    amazon_url: amazonUrl('B0B8NJR625'),
    images: ['https://m.media-amazon.com/images/I/514NoCaTWcL._AC_SL1000_.jpg']
  },
  {
    id: 'p3',
    cat: 'earbuds',
    icon: '🎧',
    badge: 'Best price',
    name_fr: 'ANFIER A8',
    name_en: 'ANFIER A8',
    desc_fr: 'Traduction instantanée 144 langues et accents, Bluetooth 6.0. 7 modes de traduction, autonomie 40h avec boîtier. Compatible iOS & Android.',
    desc_en: 'Instant translation in 144 languages, Bluetooth 6.0. 7 translation modes, 40h battery with case. iOS & Android compatible.',
    supplier: 'Amazon',
    amazon_asin: 'B0DP2G589V',
    amazon_url: amazonUrl('B0DP2G589V'),
    images: ['https://m.media-amazon.com/images/I/71nznNP16WL._AC_SX679_.jpg']
  },
  {
    id: 'p4',
    cat: 'glasses',
    icon: '🥽',
    badge: 'New',
    name_fr: 'Lunettes Luckits 115L',
    name_en: 'Luckits 115L Glasses',
    desc_fr: 'Lunettes intelligentes AI bluetooth, traduction bidirectionnelle 116 langues. Haut-parleurs open-ear stéréo, filtre lumière bleue, protection UV. Charge magnétique, 5h d’autonomie.',
    desc_en: 'AI smart bluetooth glasses, 116 languages bidirectional translation. Open-ear stereo speakers, blue light filter, UV protection. Magnetic charging, 5h battery.',
    supplier: 'Amazon',
    amazon_asin: 'B0F62TC6CN',
    amazon_url: amazonUrl('B0F62TC6CN'),
    images: ['https://m.media-amazon.com/images/I/61Q58bAapTL._AC_SX679_.jpg']
  },
  {
    id: 'p5',
    cat: 'glasses',
    icon: '🥽',
    badge: '',
    name_fr: 'BLESSOURCE 116L',
    name_en: 'BLESSOURCE 116L',
    desc_fr: 'Lunettes AI bluetooth, traducteur 116 langues et accents en temps réel. Audio stéréo double canal open-ear, verres polarisés UV, contrôle vocal, charge magnétique.',
    desc_en: 'AI bluetooth glasses, real-time 116 languages translator. Open-ear dual stereo, polarized UV lenses, voice control, magnetic charging.',
    supplier: 'Amazon',
    amazon_asin: 'B0DQGD44LC',
    amazon_url: amazonUrl('B0DQGD44LC'),
    images: ['https://m.media-amazon.com/images/I/61X4lSxnFgL._AC_SX679_.jpg']
  },
  {
    id: 'p6',
    cat: 'scanner',
    icon: '🖊️',
    badge: '',
    name_fr: 'Stylo scanner',
    name_en: 'Scanner Pen',
    desc_fr: 'Stylo scanner traducteur vocal AI. Lit et traduit instantanément tout texte imprimé. Idéal étudiants, voyageurs, professionnels. Compatible smartphones iOS & Android.',
    desc_en: 'AI voice scanner translator pen. Instantly reads and translates any printed text. Perfect for students, travellers and professionals. iOS & Android compatible.',
    supplier: 'Amazon',
    amazon_asin: 'B0DS62X13F',
    amazon_url: amazonUrl('B0DS62X13F'),
    images: ['https://m.media-amazon.com/images/I/61O1kSy99PL._AC_SX679_.jpg']
  },
  {
    id: 'p7',
    cat: 'scanner',
    icon: '🖱️',
    badge: 'Pro',
    name_fr: 'IRISPen Reader 8',
    name_en: 'IRISPen Reader 8',
    desc_fr: 'Stylo scanner OCR professionnel, 130 langues reconnues. Reconnaissance de caractères haute précision, compatible PC et Mac. Idéal pour documents, livres, journaux.',
    desc_en: 'Professional OCR scanner pen, 130 languages. High-precision character recognition, PC & Mac compatible. Perfect for documents, books and newspapers.',
    supplier: 'Amazon',
    amazon_asin: 'B0D2JC29Q7',
    amazon_url: amazonUrl('B0D2JC29Q7'),
    images: ['https://m.media-amazon.com/images/I/510mBhOrbNL._AC_SY300_SX300_QL70_ML2_.jpg']
  },
  {
    id: 'p8',
    cat: 'gps-kids',
    icon: '⌚',
    badge: 'Best seller',
    name_fr: 'Xplora X6Play',
    name_en: 'Xplora X6Play',
    desc_fr: 'Montre connectée GPS 4G enfant. Appels, SMS, suivi parental temps réel, zone de sécurité personnalisable. Podomètre, mode école, SOS intégré. Autonomie 24h.',
    desc_en: '4G GPS connected kids watch. Calls, SMS, real-time parental tracking, customizable safety zone. Pedometer, school mode, built-in SOS. 24h battery.',
    supplier: 'Amazon',
    amazon_asin: 'B0GQHHKCRH',
    amazon_url: amazonUrl('B0GQHHKCRH'),
    images: ['https://m.media-amazon.com/images/I/71LnGdSS9YL._AC_SY300_SX300_QL70_ML2_.jpg']
  },
  {
    id: 'p9',
    cat: 'gps-kids',
    icon: '⌚',
    badge: '',
    name_fr: 'EUNICECG 4G',
    name_en: 'EUNICECG 4G',
    desc_fr: 'Montre GPS 4G enfant avec appels vidéo HD. Zone de sécurité personnalisable, bouton SOS, suivi parental en temps réel. Étanche IP67, écran tactile couleur.',
    desc_en: '4G GPS kids watch with HD video calls. Customizable safety zone, SOS button, real-time parental tracking. IP67 waterproof, color touchscreen.',
    supplier: 'Amazon',
    amazon_asin: 'B0DZP1JB4K',
    amazon_url: amazonUrl('B0DZP1JB4K'),
    images: ['https://m.media-amazon.com/images/I/71xk+jt+AnL._AC_SY300_SX300_QL70_ML2_.jpg']
  },
  {
    id: 'p10',
    cat: 'tracker',
    icon: '📡',
    badge: '',
    name_fr: 'Invoxia GPS',
    name_en: 'Invoxia GPS',
    desc_fr: 'Traceur GPS ultra-compact, 2 mois d’autonomie sans recharge. Alertes mouvement en temps réel, historique de trajet 1 an. Abonnement connectivité inclus 1 an.',
    desc_en: 'Ultra-compact GPS tracker, 2-month battery. Real-time movement alerts, 1-year journey history. 1-year connectivity subscription included.',
    supplier: 'Amazon',
    amazon_asin: 'B0FQYG8J4P',
    amazon_url: amazonUrl('B0FQYG8J4P'),
    images: ['https://m.media-amazon.com/images/I/61N3q3tHYfL._AC_SX679_.jpg']
  },
  {
    id: 'p11',
    cat: 'tracker',
    icon: '📍',
    badge: '',
    name_fr: 'Samsung SmartTag2',
    name_en: 'Samsung SmartTag2',
    desc_fr: 'Traceur Bluetooth & UWB Samsung. Réseau SmartThings Find mondial, mode Lost, IP67 étanche. Autonomie 6 mois. Compatible Galaxy uniquement.',
    desc_en: 'Samsung Bluetooth & UWB tracker. Worldwide SmartThings Find network, Lost mode, IP67 waterproof. 6-month battery. Galaxy devices only.',
    supplier: 'Amazon',
    amazon_asin: 'B0CG7JHFKY',
    amazon_url: amazonUrl('B0CG7JHFKY'),
    images: ['https://m.media-amazon.com/images/I/51AZQFwHowL._AC_SX679_.jpg']
  },
  {
    id: 'p12',
    cat: 'tracker',
    icon: '📍',
    badge: '',
    name_fr: 'Apple AirTag',
    name_en: 'Apple AirTag',
    desc_fr: 'Traceur Apple avec précision Ultra Wideband. Réseau Find My de 2 milliards d’appareils Apple. Résistant à l’eau IP67. Pile CR2032 remplaçable, 1 an d’autonomie.',
    desc_en: 'Apple tracker with Ultra Wideband precision. Find My network of 2 billion Apple devices. IP67 water resistant. Replaceable CR2032 battery, 1-year life.',
    supplier: 'Amazon',
    amazon_asin: 'B0GJTCB2QM',
    amazon_url: amazonUrl('B0GJTCB2QM'),
    images: ['https://m.media-amazon.com/images/I/61lBuevDnnL._AC_SX679_.jpg']
  }
];

const CATEGORIES = [
  { id: 'all', icon: '🌐', label_fr: 'Tous les produits', label_en: 'All products' },
  { id: 'earbuds', icon: '🎧', label_fr: 'Oreillettes traductrices', label_en: 'Translator earbuds' },
  { id: 'glasses', icon: '🥽', label_fr: 'Lunettes intelligentes', label_en: 'Smart glasses' },
  { id: 'scanner', icon: '🖊️', label_fr: 'Stylos scanners', label_en: 'Scanner pens' },
  { id: 'gps-kids', icon: '⌚', label_fr: 'Montres GPS enfants', label_en: 'Kids GPS watches' },
  { id: 'tracker', icon: '📡', label_fr: 'Traceurs GPS', label_en: 'GPS trackers' }
];

const CONFIG = {
  site_name: 'EasyCom Suisse',
  email: 'contact@easycom.ch',
  amazon_id: AMAZON_ID,
  whatsapp: '+41XXXXXXXXX',
  instagram: '@easycom.ch'
};
