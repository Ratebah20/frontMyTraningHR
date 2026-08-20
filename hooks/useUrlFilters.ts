'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from './useApi';

/**
 * Filtres de liste persistés dans l'URL.
 *
 * Sans cela, les filtres vivent en `useState` local : le bouton « retour » du
 * navigateur ramène bien sur la page précédente, mais vidée de ses filtres et
 * de sa pagination — on repart au début de la liste. Un lien vers une liste
 * filtrée n'est pas partageable non plus.
 *
 * Ce hook généralise le mécanisme déjà en place sur /sessions, en conservant
 * les trois garde-fous qui y avaient été ajoutés après régression :
 *
 *  1. On repart de `window.location.search` et NON de `searchParams` : ce
 *     dernier n'est rafraîchi qu'à la fin de la navigation App Router. Deux
 *     mises à jour rapprochées (typiquement la recherche debouncée qui tombe
 *     pendant qu'on choisit un statut) partiraient toutes deux d'un état
 *     périmé, et la seconde effacerait le filtre posé par la première.
 *
 *  2. La page revient à 1 dès qu'un AUTRE filtre change, sinon on se retrouve
 *     page 7 d'un résultat qui n'en compte que 2.
 *
 *  3. `router.push` (et non `replace`) : c'est ce qui empile chaque état dans
 *     l'historique et rend le bouton retour utile — l'objet même du besoin.
 *
 * Les valeurs vides ne sont jamais écrites dans l'URL, qui reste lisible.
 */

type Filtres = Record<string, string>;

interface UseUrlFiltersResult<T extends Filtres> {
  /** Valeurs courantes, lues depuis l'URL. */
  values: T;
  /** Met à jour un filtre (remet la page à 1). */
  setValue: (key: keyof T & string, value: string) => void;
  /** Met à jour plusieurs filtres d'un coup. */
  setValues: (patch: Partial<Record<keyof T & string, string | null>>) => void;
  /** Page courante (1 par défaut). */
  page: number;
  setPage: (page: number) => void;
  /** Remet tous les filtres à leur valeur par défaut. */
  reset: () => void;
  /** true si au moins un filtre diffère de sa valeur par défaut. */
  isFiltered: boolean;
}

export function useUrlFilters<T extends Filtres>(
  basePath: string,
  defaults: T,
): UseUrlFiltersResult<T> {
  const router = useRouter();
  const searchParams = useSearchParams();

  const values = {} as T;
  (Object.keys(defaults) as Array<keyof T & string>).forEach((key) => {
    values[key] = (searchParams.get(key) ?? defaults[key]) as T[keyof T & string];
  });

  const page = parseInt(searchParams.get('page') || '1', 10) || 1;

  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      // Voir garde-fou n°1 : window.location.search, pas searchParams.
      const params = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : '',
      );

      Object.entries(updates).forEach(([key, value]) => {
        const estDefaut = defaults[key] !== undefined && value === defaults[key];
        if (value === null || value === '' || estDefaut || (key === 'page' && value === '1')) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Garde-fou n°2 : retour page 1 dès qu'un autre filtre bouge.
      if (!('page' in updates) && params.get('page')) {
        params.delete('page');
      }

      const query = params.toString();
      // Garde-fou n°3 : push, pour empiler l'état dans l'historique.
      router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    },
    // `defaults` est un littéral recréé à chaque rendu chez la plupart des
    // appelants : le sérialiser évite de recréer le callback en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [basePath, router, JSON.stringify(defaults)],
  );

  const setValue = useCallback(
    (key: keyof T & string, value: string) => updateUrlParams({ [key]: value }),
    [updateUrlParams],
  );

  const setValues = useCallback(
    (patch: Partial<Record<keyof T & string, string | null>>) =>
      updateUrlParams(patch as Record<string, string | null>),
    [updateUrlParams],
  );

  const setPage = useCallback(
    (nouvellePage: number) => updateUrlParams({ page: String(nouvellePage) }),
    [updateUrlParams],
  );

  const reset = useCallback(() => {
    const remise: Record<string, string | null> = { page: null };
    Object.keys(defaults).forEach((key) => {
      remise[key] = null;
    });
    updateUrlParams(remise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateUrlParams, JSON.stringify(defaults)]);

  const isFiltered = (Object.keys(defaults) as Array<keyof T & string>).some(
    (key) => values[key] !== defaults[key],
  );

  return { values, setValue, setValues, page, setPage, reset, isFiltered };
}

/**
 * Champ de recherche debouncé synchronisé avec l'URL.
 *
 * Encapsule le garde-fou n°3 de /sessions, qui mérite son commentaire d'origine :
 * sans la référence à la dernière valeur poussée, la frappe et l'URL se
 * renvoyaient la balle. La navigation App Router étant asynchrone, l'URL
 * arrivait en retard et réécrivait le champ avec une valeur déjà périmée
 * (« Dup » alors que la RH avait fini de taper « Dupont »). Pire, l'input
 * revenait alors exactement à la valeur de l'URL : la comparaison du debounce
 * suivant ne voyait plus de différence et PLUS AUCUNE requête n'était relancée
 * — la liste restait figée.
 *
 * On ne resynchronise donc le champ que si le changement d'URL vient réellement
 * de l'extérieur (arrivée sur la page, retour navigateur, lien entrant avec
 * ?search=), pas quand l'URL ne fait que refléter notre propre push.
 */
export function useUrlSearch(
  urlValue: string,
  pushValue: (value: string) => void,
  delay = 500,
): [string, (value: string) => void] {
  const [input, setInput] = useState(urlValue);
  const debounced = useDebounce(input, delay);
  const lastPushedRef = useRef(urlValue);

  useEffect(() => {
    if (debounced !== lastPushedRef.current) {
      // Mémorisé AVANT la navigation : elle est asynchrone, l'effet de
      // resynchronisation ci-dessous se déclenchera bien après.
      lastPushedRef.current = debounced;
      pushValue(debounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    // L'URL ne fait que refléter notre propre push : ne pas toucher au champ,
    // l'utilisateur a peut-être continué à taper entre-temps.
    if (urlValue === lastPushedRef.current) return;

    // Changement externe : on aligne le champ ET la référence, sinon le
    // prochain debounce repousserait inutilement la même valeur.
    lastPushedRef.current = urlValue;
    setInput(urlValue);
  }, [urlValue]);

  return [input, setInput];
}
