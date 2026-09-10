'use client';

import type { ReactNode } from 'react';
import { Box, Group } from '@mantine/core';

interface StickyActionsProps {
  children: ReactNode;
}

/**
 * Barre d'actions collante d'une page KPI (export Excel, impression, capture).
 *
 * Elle reste visible en haut de l'ecran quand on fait defiler la page : la RH
 * n'a plus a remonter tout en haut pour exporter apres avoir lu un tableau.
 *
 * Doit etre un enfant DIRECT du conteneur qui occupe toute la hauteur de la
 * page (le `Stack` racine) : `position: sticky` ne colle que dans les limites
 * de son parent. `top` reprend le decalage du bandeau fixe de l'AppShell pour
 * ne pas glisser dessous.
 *
 * ATTENTION : la barre elle-meme ne porte PAS `.no-print`. `PrintButton` rend
 * l'en-tete du document imprime (`.print-only`) a cote de son bouton ; masquer
 * la barre entiere ferait disparaitre cet en-tete a l'impression. Ce sont donc
 * les controles (boutons, icones) qui portent chacun `.no-print`, et la regle
 * `.sticky-actions` de styles/globals.css neutralise le cadre sur papier.
 */
export function StickyActions({ children }: StickyActionsProps) {
  return (
    <Box
      className="sticky-actions"
      style={{
        position: 'sticky',
        top: 'var(--app-shell-header-offset, 0px)',
        zIndex: 20,
        backgroundColor: 'var(--mantine-color-body)',
        paddingBlock: 8,
        borderBottom: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Group gap="sm" justify="flex-end" wrap="wrap">
        {children}
      </Group>
    </Box>
  );
}
