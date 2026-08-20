/**
 * Champs surveillés par le filtre « informations manquantes ».
 *
 * Le backend accepte ces valeurs en CSV sur `/sessions/grouped` comme sur
 * `/collective-sessions` (paramètre `missingFields`, critères combinés en OU —
 * voir `src/common/utils/infos-manquantes.utils.ts` côté API).
 *
 * La liste est partagée par la vue liste (/sessions) et la vue calendrier
 * (/sessions/calendar) : dupliquer les libellés dans chaque page finissait par
 * les faire diverger, alors que les deux écrans interrogent le même filtre.
 */

export interface OptionInfoManquante {
  value: string;
  label: string;
}

export const OPTIONS_INFOS_MANQUANTES: OptionInfoManquante[] = [
  { value: 'duree', label: 'Durée' },
  { value: 'organisme', label: 'Organisme' },
  { value: 'type', label: 'Type' },
  { value: 'dateFin', label: 'Date de fin' },
  { value: 'categorie', label: 'Catégorie' },
];
