/**
 * Génère un code de formation standardisé à partir du nom
 *
 * Algorithme identique au backend (formations.service.ts - generateStandardizedCode)
 * SANS le préfixe GLB/OLU car utilisé pour création manuelle
 *
 * Étapes:
 * 1. Normalisation Unicode (NFD) pour séparer les caractères accentués
 * 2. Suppression des diacritiques (accents)
 * 3. Conversion en majuscules
 * 4. Remplacement des caractères spéciaux par underscore
 * 5. Limitation à 50 caractères
 *
 * @param nomFormation - Nom de la formation
 * @returns Code de formation standardisé (max 50 caractères)
 *
 * @example
 * generateFormationCode('Excel Avancé') // → 'EXCEL_AVANCE'
 * generateFormationCode('Introduction à la Data Science') // → 'INTRODUCTION_A_LA_DATA_SCIENCE'
 * generateFormationCode('C++ & Java!') // → 'C____JAVA_'
 */
export function generateFormationCode(nomFormation: string): string {
  if (!nomFormation || nomFormation.trim() === '') {
    return '';
  }

  const nomNormalise = nomFormation
    // Normalisation Unicode (NFD) : décompose les caractères accentués
    // Ex: "é" devient "e" + accent combiné
    .normalize('NFD')
    // Suppression de tous les diacritiques (accents, cédilles, etc.)
    // Plage Unicode U+0300 à U+036F : marques de combinaison
    .replace(/[\u0300-\u036f]/g, '')
    // Conversion en majuscules pour uniformité
    .toUpperCase()
    // Remplacement de tout ce qui n'est pas A-Z ou 0-9 par underscore
    .replace(/[^A-Z0-9]/g, '_');

  // Limitation à 50 caractères (contrainte base de données)
  return nomNormalise.substring(0, 50);
}

/**
 * Valide si un code de formation respecte le format attendu
 *
 * @param code - Code à valider
 * @returns true si le code est valide
 */
export function isValidFormationCode(code: string): boolean {
  if (!code) return false;
  if (code.length < 3 || code.length > 50) return false;
  // Le code doit contenir uniquement lettres, chiffres et underscores
  return /^[A-Z0-9_]+$/.test(code);
}
