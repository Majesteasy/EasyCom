// ============================================================
// EASYCOM SUISSE — BASE PRODUITS
// Pour modifier : éditez ce fichier et rechargez le site
// Affiliate Amazon ID : easycom0ae-21
// ============================================================

const AMAZON_ID = 'easycom0ae-21';

const PRODUCTS = [
  {
    id: 1,
    cat: 'earbuds',
    icon: '🎧',
    badge: 'BESTSELLER',
    name_fr: 'TransEar Pro X1',
    name_en: 'TransEar Pro X1',
    type_fr: 'Oreillette IA',
    type_en: 'AI Earbuds',
    desc_fr: 'Traduction simultanée en temps réel dans 40+ langues. Bluetooth 5.3, autonomie 8h, étanche IPX5. Compatible iOS & Android.',
    desc_en: 'Real-time simultaneous translation in 40+ languages. Bluetooth 5.3, 8h battery, IPX5 waterproof. iOS & Android compatible.',
    price_eur: 89,
    price_chf: 89,
    amazon_asin: 'B0XXXXXX01',
    amazon_url: 'https://www.amazon.fr/dp/B0XXXXXX01?tag=easycom0ae-21',
    rating: 4.7,
    reviews: 234
  },
  {
    id: 2,
    cat: 'earbuds',
    icon: '🎧',
    badge: 'NOUVEAU',
    name_fr: 'LinguaPods Elite',
    name_en: 'LinguaPods Elite',
    type_fr: 'Écouteurs Traducteurs',
    type_en: 'Translation Earphones',
    desc_fr: 'Son Hi-Fi audiophile + traduction IA. Réduction de bruit active, recharge sans fil 15W, 6h + 24h boîtier.',
    desc_en: 'Hi-Fi audiophile sound + AI translation. Active noise cancellation, 15W wireless charging, 6h + 24h case.',
    price_eur: 129,
    price_chf: 129,
    amazon_asin: 'B0XXXXXX02',
    amazon_url: 'https://www.amazon.fr/dp/B0XXXXXX02?tag=easycom0ae-21',
    rating: 4.5,
    reviews: 187
  },
  {
    id: 4,
    cat: 'glasses',
    icon: '🕶️',
    badge: 'EXCLUSIF',
    name_fr: 'VisionTranslate AR',
    name_en: 'VisionTranslate AR',
    type_fr: 'Lunettes Traductrices AR',
    type_en: 'AR Translation Glasses',
    desc_fr: 'Affichage HUD en réalité augmentée. Traduction superposée dans votre champ de vision. 15 langues, monture premium, 6h autonomie.',
    desc_en: 'HUD display in augmented reality. Translation overlaid in your field of vision. 15 languages, premium frame, 6h battery.',
    price_eur: 299,
    price_chf: 299,
    amazon_asin: null,
    amazon_url: null,
    rating: 4.3,
    reviews: 89
  },
  {
    id: 5,
    cat: 'gps-kids',
    icon: '⌚',
    badge: 'FAMILLE',
    name_fr: 'KidsTrack Pro',
    name_en: 'KidsTrack Pro',
    type_fr: 'Montre GPS Enfant',
    type_en: 'Kids GPS Watch',
    desc_fr: 'Géolocalisation temps réel, appel SOS bidirectionnel, zone de sécurité configurable, étanche 50m. Pour enfants 3-12 ans.',
    desc_en: 'Real-time geolocation, 2-way SOS call, configurable safety zone, waterproof 50m. For children aged 3-12.',
    price_eur: 79,
    price_chf: 79,
    amazon_asin: 'B0XXXXXX05',
    amazon_url: 'https://www.amazon.fr/dp/B0XXXXXX05?tag=easycom0ae-21',
    rating: 4.8,
    reviews: 567
  },
  {
    id: 6,
    cat: 'gps-kids',
    icon: '⌚',
    badge: '4G',
    name_fr: 'SmartKid 4G Vidéo',
    name_en: 'SmartKid 4G Video',
    type_fr: 'Montre Enfant 4G',
    type_en: '4G Kids Watch',
    desc_fr: 'Vidéo appel HD, 4G/LTE, podomètre, réveil, appareil photo 2MP, résistant aux chocs.',
    desc_en: 'HD video call, 4G/LTE, pedometer, alarm, 2MP camera, shockproof.',
    price_eur: 109,
    price_chf: 109,
    amazon_asin: 'B0XXXXXX06',
    amazon_url: 'https://www.amazon.fr/dp/B0XXXXXX06?tag=easycom0ae-21',
    rating: 4.4,
    reviews: 203
  },
  {
    id: 7,
    cat: 'tracker',
    icon: '🔖',
    badge: 'SLIM',
    name_fr: 'MagTracker Slim',
    name_en: 'MagTracker Slim',
    type_fr: 'Traceur GPS Bagage',
    type_en: 'Luggage GPS Tracker',
    desc_fr: 'Traceur ultra-fin magnétique pour bagages et valises. 12 mois SIM data inclus. Alertes temps réel par SMS et app.',
    desc_en: 'Ultra-slim magnetic tracker for luggage and suitcases. 12-month data SIM included. Real-time SMS and app alerts.',
    price_eur: 59,
    price_chf: 59,
    amazon_asin: 'B0XXXXXX07',
    amazon_url: 'https://www.amazon.fr/dp/B0XXXXXX07?tag=easycom0ae-21',
    rating: 4.5,
    reviews: 445
  }
];

const CATEGORIES = [
  { id: 'all',      icon: '✦',  label_fr: 'Tous les produits',       label_en: 'All products' },
  { id: 'earbuds',  icon: '🎧', label_fr: 'Oreillettes & Écouteurs', label_en: 'Earbuds & Earphones' },
  { id: 'glasses',  icon: '🕶️', label_fr: 'Lunettes Traductrices',   label_en: 'Translation Glasses' },
  { id: 'gps-kids', icon: '⌚', label_fr: 'Montres GPS Enfants',      label_en: 'Kids GPS Watches' },
  { id: 'tracker',  icon: '🔖', label_fr: 'Traceurs Bagages',         label_en: 'Luggage Trackers' }
];

// SITE CONFIG
const CONFIG = {
  site_name: 'EasyCom',
  email: 'contact@easycom-world.ch',
  amazon_id: 'easycom0ae-21',
  currency_primary: 'EUR',
  stripe_pub_key: 'pk_live_VOTRE_CLE_STRIPE_ICI',
  paypal_client_id: 'VOTRE_CLIENT_ID_PAYPAL_ICI',
};
