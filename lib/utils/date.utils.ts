/**
 * Utilitaires pour la manipulation des dates sans problème de timezone
 *
 * Ces fonctions permettent de gérer les dates en respectant le fuseau horaire local.
 */

/**
 * Formatte une Date en chaîne YYYY-MM-DD en utilisant l'heure locale.
 *
 * Contrairement à `date.toISOString().split('T')[0]` qui utilise UTC
 * et peut afficher la mauvaise date selon le fuseau horaire,
 * cette fonction utilise toujours l'heure locale.
 *
 * Accepte aussi une chaîne : depuis Mantine 8, les composants `@mantine/dates`
 * emettent directement une chaîne `YYYY-MM-DD` et non plus un objet `Date`.
 * Dans ce cas la valeur est simplement tronquée (aucune conversion de fuseau).
 *
 * @param date - Date à formater (objet Date ou chaîne ISO / YYYY-MM-DD)
 * @returns Chaîne au format YYYY-MM-DD
 *
 * @example
 * const date = new Date('2025-10-23T23:00:00Z'); // 23:00 UTC = 01:00 le 24 en UTC+2
 * date.toISOString().split('T')[0] // '2025-10-23' ❌ Incorrect (UTC)
 * formatDateOnly(date) // '2025-10-24' ✅ Correct (heure locale)
 * formatDateOnly('2025-10-24') // '2025-10-24' ✅ Mantine 8
 */
export function formatDateOnly(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;

  // Mantine 8 : les DateInput / DatePickerInput renvoient déjà 'YYYY-MM-DD'
  if (typeof date === 'string') {
    return date.slice(0, 10) || undefined;
  }

  if (!isValidDate(date)) return undefined;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Vérifie si une date est valide
 *
 * @param date - Date à vérifier
 * @returns true si la date est valide, false sinon
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}
