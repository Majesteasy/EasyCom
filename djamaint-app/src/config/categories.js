// Catégories comptables DJA.MAINT — EI Suisse
const CATEGORIES = {
  // RECETTES
  revenue: [
    { code: 'FM_PRESTATION', label: 'Prestation FM', type: 'revenue', vatRate: 8.1 },
    { code: 'FM_URGENCE',    label: 'Intervention urgence', type: 'revenue', vatRate: 8.1 },
    { code: 'FM_CONTRAT',   label: 'Contrat de maintenance', type: 'revenue', vatRate: 8.1 },
    { code: 'FM_CONSEIL',   label: 'Conseil / Expertise', type: 'revenue', vatRate: 8.1 },
    { code: 'MATERIEL_REV', label: 'Vente matériel', type: 'revenue', vatRate: 8.1 },
    { code: 'AUTRE_REV',    label: 'Autre recette', type: 'revenue', vatRate: 0 },
  ],
  // DÉPENSES
  expense: [
    { code: 'MATERIEL',      label: 'Achat matériel/fournitures', type: 'expense', vatRate: 8.1 },
    { code: 'SOUS_TRAIT',    label: 'Sous-traitance', type: 'expense', vatRate: 8.1 },
    { code: 'VEHICULE',      label: 'Véhicule (carburant, entretien)', type: 'expense', vatRate: 7.7 },
    { code: 'ASSURANCE',     label: 'Assurances professionnelles', type: 'expense', vatRate: 0 },
    { code: 'TELECOM',       label: 'Télécommunications', type: 'expense', vatRate: 8.1 },
    { code: 'LOGICIEL',      label: 'Logiciels / Abonnements', type: 'expense', vatRate: 8.1 },
    { code: 'FORMATION',     label: 'Formation professionnelle', type: 'expense', vatRate: 0 },
    { code: 'HONORAIRES',    label: 'Honoraires (fiduciaire, avocat)', type: 'expense', vatRate: 8.1 },
    { code: 'BUREAU',        label: 'Loyer / Bureau', type: 'expense', vatRate: 0 },
    { code: 'FRAIS_BANCAIRES', label: 'Frais bancaires', type: 'expense', vatRate: 0 },
    { code: 'COTISATIONS',   label: 'Cotisations AVS/AI/AC', type: 'expense', vatRate: 0 },
    { code: 'PUBLICITE',     label: 'Publicité / Marketing', type: 'expense', vatRate: 8.1 },
    { code: 'DEPLACEMENT',   label: 'Déplacements / Repas', type: 'expense', vatRate: 8.1 },
    { code: 'AUTRE_DEP',     label: 'Autre dépense', type: 'expense', vatRate: 0 },
  ],
};

// TVA Suisse 2024
const VAT_RATES = {
  STANDARD:  { rate: 8.1,  label: 'Standard (8.1%)' },
  REDUIT:    { rate: 2.6,  label: 'Réduit (2.6%)' },
  HEBERGEMENT: { rate: 3.8, label: 'Hébergement (3.8%)' },
  EXONERE:   { rate: 0,    label: 'Exonéré (0%)' },
};

// Seuil TVA EI Suisse
const VAT_THRESHOLD_CHF = 100_000;

module.exports = { CATEGORIES, VAT_RATES, VAT_THRESHOLD_CHF };
