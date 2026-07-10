'use client';

import { useState } from 'react';
import { ActionIcon, Tooltip, useComputedColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Camera } from '@phosphor-icons/react/dist/ssr/Camera';
import { exportElementToPng } from '@/lib/utils/export-image';

interface ExportTilesButtonProps {
  /** Référence vers le conteneur HTML à capturer (ex: la grille de tuiles). */
  containerRef: React.RefObject<HTMLElement>;
  /** Nom du fichier PNG téléchargé (extension ajoutée automatiquement). */
  filename: string;
  /** Fond forcé du PNG. Par défaut : selon le thème (sombre/clair). */
  background?: string;
}

/**
 * Bouton discret d'export d'un bloc de tuiles (HTML) en PNG via html2canvas.
 * Pendant du composant ExportChartButton (réservé aux graphiques SVG Recharts).
 */
export function ExportTilesButton({ containerRef, filename, background }: ExportTilesButtonProps) {
  const [exporting, setExporting] = useState(false);
  const computedColorScheme = useComputedColorScheme('light');

  const handleExport = async () => {
    const el = containerRef.current;
    if (!el) {
      notifications.show({
        title: 'Erreur',
        message: 'Aucun contenu à exporter',
        color: 'red',
      });
      return;
    }

    // Fond lisible sur slide : sombre en thème sombre, blanc sinon
    const resolvedBackground =
      background ?? (computedColorScheme === 'dark' ? '#1a1b1e' : '#ffffff');

    setExporting(true);
    try {
      await exportElementToPng(el, filename, { background: resolvedBackground });
      notifications.show({
        title: 'Export réussi',
        message: 'Les tuiles ont été téléchargées en PNG',
        color: 'green',
      });
    } catch (error) {
      console.error("Erreur lors de l'export des tuiles:", error);
      notifications.show({
        title: 'Erreur',
        message: "Impossible d'exporter les tuiles en image",
        color: 'red',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Tooltip label="Exporter en image (PNG)">
      <ActionIcon
        variant="light"
        color="gray"
        size="lg"
        onClick={handleExport}
        loading={exporting}
        aria-label="Exporter en image (PNG)"
      >
        <Camera size={18} weight="duotone" />
      </ActionIcon>
    </Tooltip>
  );
}
