'use client';

import { useEffect, useState } from 'react';
import { Button, Tooltip } from '@mantine/core';
import { Printer } from '@phosphor-icons/react/dist/ssr/Printer';

interface PrintButtonProps {
  /** Titre du document imprime (ex: « Conformite - Formations obligatoires »). */
  title: string;
  /** Sous-titre : perimetre et periode reellement affiches a l'ecran. */
  subtitle?: string;
  /** Libelle du bouton (defaut : « Imprimer / PDF »). */
  label?: string;
}

/**
 * Bouton d'impression d'une vue (papier ou PDF via la boite de dialogue du
 * navigateur), pour transmettre un visuel KPI a un manager ou un directeur.
 *
 * Il ne genere pas de fichier lui-meme : il s'appuie sur le socle @media print
 * de styles/globals.css, qui masque le chrome applicatif (.no-print), neutralise
 * les animations d'entree et passe la feuille en A4 paysage.
 *
 * En plus du bouton (lui-meme .no-print), il rend un en-tete .print-only :
 * invisible a l'ecran, il identifie le document imprime une fois celui-ci
 * detache de l'application (perimetre, periode, date d'edition).
 *
 * Pendant « papier » des composants ExportChartButton / ExportTilesButton, qui
 * eux produisent un PNG d'un bloc precis.
 */
export function PrintButton({ title, subtitle, label = 'Imprimer / PDF' }: PrintButtonProps) {
  // Date calculee apres le montage : `new Date()` au rendu differe entre le
  // rendu serveur et le rendu client, ce qui provoquerait un ecart d'hydratation.
  const [dateEdition, setDateEdition] = useState('');

  useEffect(() => {
    setDateEdition(
      new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    );
  }, []);

  return (
    <>
      {/* En-tete du document imprime : masque a l'ecran par la classe .print-only */}
      <div className="print-header print-only">
        <p className="print-header__title">{title}</p>
        {subtitle && <p className="print-header__subtitle">{subtitle}</p>}
        {dateEdition && <p className="print-header__date">Edite le {dateEdition}</p>}
      </div>

      <Tooltip label="Imprimer cette vue (ou l'enregistrer en PDF)">
        <Button
          className="no-print"
          leftSection={<Printer size={18} weight="duotone" />}
          variant="light"
          color="gray"
          onClick={() => window.print()}
        >
          {label}
        </Button>
      </Tooltip>
    </>
  );
}
