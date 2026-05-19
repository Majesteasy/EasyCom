// Simulateur fiscal EI Genève — DJA.MAINT
// Sources : estv.admin.ch, ge.ch/afc, cgcglobal.ch (2024/2025)

const VAT_THRESHOLD = 100_000; // CHF — seuil assujettissement TVA

// Taux AVS/AI/APG EI (part total employé+employeur) 2024
const AVS_RATE = 0.106;      // 10.6%
const AC_RATE  = 0.022;      // 2.2% (jusqu'à 148'200 CHF)
const AC_THRESHOLD = 148_200;

// Déduction forfaitaire 3e pilier 3a (2024)
const PILIER3A_MAX = 7_056;

// Calendrier fiscal AFC Genève
const FISCAL_CALENDAR = [
  { date: '2025-03-31', label: 'Déclaration TVA T4 2024', type: 'vat', link: 'https://www.estv.admin.ch' },
  { date: '2025-03-31', label: 'Déclaration fiscale GE 2024', type: 'tax', link: 'https://www.ge.ch/afc' },
  { date: '2025-06-30', label: 'Déclaration TVA T1 2025', type: 'vat', link: 'https://www.estv.admin.ch' },
  { date: '2025-06-30', label: 'Acompte provisionnel AVS T2', type: 'avs', link: 'https://www.cgcglobal.ch' },
  { date: '2025-09-30', label: 'Déclaration TVA T2 2025', type: 'vat', link: 'https://www.estv.admin.ch' },
  { date: '2025-09-30', label: 'Acompte provisionnel AVS T3', type: 'avs', link: 'https://www.cgcglobal.ch' },
  { date: '2025-12-31', label: 'Déclaration TVA T3 2025', type: 'vat', link: 'https://www.estv.admin.ch' },
  { date: '2025-12-31', label: 'Versement 3e pilier 3a (dernier délai)', type: 'pilier3a', link: null },
];

// Taux d'imposition GE EI simplifié (barème 2024 personne seule)
// Source : ge.ch/afc — taux marginal estimé par tranche de bénéfice
function estimateGenevoisesTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  // Approximation linéaire barème cantonal + ICC + IFD
  let rate;
  if      (taxableIncome < 30_000)  rate = 0.10;
  else if (taxableIncome < 60_000)  rate = 0.18;
  else if (taxableIncome < 100_000) rate = 0.25;
  else if (taxableIncome < 200_000) rate = 0.30;
  else                              rate = 0.335;
  return Math.round(taxableIncome * rate * 100) / 100;
}

function simulateFiscalEI({ revenue, expenses, pilier3a = 0 }) {
  const gross = revenue - expenses;

  // 1. Déduction demi-cotisations AVS (l'indépendant déduit sa part AVS du revenu imposable)
  const avsTotal    = Math.round(Math.max(0, gross) * AVS_RATE * 100) / 100;
  const avsDeduct   = Math.round(avsTotal / 2 * 100) / 100; // moitié déductible
  const acTotal     = gross <= AC_THRESHOLD ? Math.round(gross * AC_RATE * 100) / 100 : Math.round(AC_THRESHOLD * AC_RATE * 100) / 100;

  // 2. Déductions avant impôt
  const pilier3aDeductible = Math.min(pilier3a, PILIER3A_MAX);
  const taxableIncome = Math.max(0, gross - avsDeduct - pilier3aDeductible);

  // 3. Impôts GE (cantonal + ICC + IFD estimé)
  const taxEstimate = estimateGenevoisesTax(taxableIncome);

  // 4. Seuil TVA
  const vatLiable = revenue >= VAT_THRESHOLD;

  // 5. Revenu net après tout
  const netDisposable = gross - avsTotal - acTotal - taxEstimate - (pilier3a || 0);

  return {
    revenue,
    expenses,
    grossBenefit: gross,
    avsTotal,      // cotisations AVS totales
    acTotal,       // cotisations AC
    avsDeductible: avsDeduct,
    pilier3aDeductible,
    taxableIncome,
    taxEstimate,
    netDisposable: Math.round(netDisposable * 100) / 100,
    vatLiable,
    vatThreshold: VAT_THRESHOLD,
    warning: revenue > VAT_THRESHOLD * 0.8
      ? `Attention : CA proche du seuil TVA (${VAT_THRESHOLD.toLocaleString('fr-CH')} CHF)`
      : null,
    // Jalon transition EI → Sàrl
    sarlRecommended: revenue >= 100_000,
  };
}

// Déductions autorisées par catégorie pour EI FM Suisse
const DEDUCTIONS_GUIDE = [
  { category: 'Véhicule',      rules: 'Indemnité kilométrique CHF 0.70/km OU frais effectifs. Tenir un carnet de route.' },
  { category: 'Bureau domicile', rules: 'Déductible si pièce dédiée exclusivement professionnelle. Prorata m² × loyer annuel.' },
  { category: 'Matériel',      rules: 'Déductible à 100% si usage professionnel exclusif. Amortissement si valeur > CHF 1\'500.' },
  { category: 'Formation',     rules: 'Déductible si en lien direct avec l\'activité FM. Cours, certifications, abonnements pro.' },
  { category: 'Téléphone/Internet', rules: 'Part professionnelle prorata (en général 80% si usage mixte).' },
  { category: 'Repas',         rules: 'CHF 15.-/repas si déplacement professionnel > 10km. Avec justificatifs.' },
  { category: '3e pilier 3a',  rules: `Max CHF ${PILIER3A_MAX.toLocaleString('fr-CH')}/an (2024). Déductible du revenu imposable. Versement avant 31 déc.` },
  { category: 'Assurances pro', rules: 'RC professionnelle, LAA volontaire : 100% déductibles.' },
];

function getDeductionsGuide() {
  return DEDUCTIONS_GUIDE;
}

function getFiscalCalendar() {
  const today = new Date().toISOString().slice(0, 10);
  return FISCAL_CALENDAR.map(e => ({
    ...e,
    daysRemaining: Math.ceil((new Date(e.date) - new Date(today)) / 86400000),
    overdue: e.date < today,
  })).sort((a, b) => a.date.localeCompare(b.date));
}

module.exports = { simulateFiscalEI, getDeductionsGuide, getFiscalCalendar, VAT_THRESHOLD, PILIER3A_MAX };
