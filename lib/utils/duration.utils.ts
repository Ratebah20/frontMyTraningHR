/**
 * Utilitaires pour formater les durées
 */

/**
 * Formate une durée décimale en heures en format lisible
 * @param hours - Durée en heures (format décimal)
 * @param unit - Unité de la durée (optionnel, par défaut "Heures")
 * @returns Chaîne formatée (ex: "2h", "30min", "1h30", "0.03h")
 */
export function formatDuration(hours: number | null | undefined, unit: string = 'Heures'): string {
  // Si pas de durée, retourner "-"
  if (hours === null || hours === undefined || hours === 0) {
    return '-';
  }

  // Convertir en nombre si c'est une chaîne
  const durationInHours = typeof hours === 'string' ? parseFloat(hours) : hours;

  // Si l'unité n'est pas en heures, afficher tel quel avec l'unité
  if (unit.toLowerCase() !== 'heures' && unit.toLowerCase() !== 'heure') {
    return `${durationInHours}${unit}`;
  }

  // Si c'est moins de 1 heure
  if (durationInHours < 1) {
    const minutes = Math.round(durationInHours * 60);

    // Si c'est très petit (moins de 5 minutes), afficher en décimales
    if (minutes < 5) {
      return `${durationInHours.toFixed(2)}h`;
    }

    return `${minutes}min`;
  }

  // Si c'est un nombre entier d'heures
  if (durationInHours % 1 === 0) {
    return `${Math.floor(durationInHours)}h`;
  }

  // Si c'est entre 1 et 100 heures avec des minutes
  if (durationInHours < 100) {
    const h = Math.floor(durationInHours);
    const minutes = Math.round((durationInHours - h) * 60);

    if (minutes === 0) {
      return `${h}h`;
    }

    return `${h}h${minutes.toString().padStart(2, '0')}`;
  }

  // Pour les très grandes durées, afficher en décimales
  return `${durationInHours.toFixed(1)}h`;
}

/**
 * Formate une durée avec le label "Durée" pour les tooltips
 * @param hours - Durée en heures (format décimal)
 * @param unit - Unité de la durée
 * @returns Chaîne avec label (ex: "Durée: 2h")
 */
export function formatDurationWithLabel(hours: number | null | undefined, unit: string = 'Heures'): string {
  const formatted = formatDuration(hours, unit);
  return formatted === '-' ? 'Durée non définie' : `Durée: ${formatted}`;
}

/**
 * Convertit des heures décimales en objet heures/minutes
 * @param hours - Durée en heures (format décimal)
 * @returns Objet avec heures et minutes séparées
 */
export function hoursToHoursMinutes(hours: number): { hours: number; minutes: number } {
  const h = Math.floor(hours);
  const minutes = Math.round((hours - h) * 60);
  return { hours: h, minutes };
}

/**
 * Convertit heures et minutes en heures décimales
 * @param hours - Nombre d'heures
 * @param minutes - Nombre de minutes
 * @returns Durée en heures décimales
 */
export function hoursMinutesToHours(hours: number, minutes: number): number {
  return hours + (minutes / 60);
}
