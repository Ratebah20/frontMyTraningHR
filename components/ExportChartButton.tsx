'use client';

import { useState } from 'react';
import { ActionIcon, Tooltip, useComputedColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Camera } from '@phosphor-icons/react/dist/ssr/Camera';
import { exportSvgElementToPng } from '@/lib/utils/export-image';

interface ExportChartButtonProps {
  /** Référence vers le conteneur du graphique (le premier <svg> trouvé est exporté). */
  containerRef: React.RefObject<HTMLElement>;
  /** Nom du fichier PNG téléchargé (extension ajoutée automatiquement). */
  filename: string;
  /** Fond forcé du PNG. Par défaut : selon le thème (sombre/clair). */
  background?: string;
}

/**
 * Bouton discret d'export d'un graphique Recharts en PNG (pour PowerPoint).
 * À placer près du titre ou en haut à droite de la carte du graphique.
 */
export function ExportChartButton({ containerRef, filename, background }: ExportChartButtonProps) {
  const [exporting, setExporting] = useState(false);
  const computedColorScheme = useComputedColorScheme('light');

  const handleExport = async () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) {
      notifications.show({
        title: 'Erreur',
        message: 'Aucun graphique à exporter',
        color: 'red',
      });
      return;
    }

    // Fond lisible sur slide : sombre en thème sombre, blanc sinon
    const resolvedBackground =
      background ?? (computedColorScheme === 'dark' ? '#1a1b1e' : '#ffffff');

    setExporting(true);
    try {
      await exportSvgElementToPng(svgEl, filename, { background: resolvedBackground });
      notifications.show({
        title: 'Export réussi',
        message: 'Le graphique a été téléchargé en PNG',
        color: 'green',
      });
    } catch (error) {
      console.error("Erreur lors de l'export du graphique:", error);
      notifications.show({
        title: 'Erreur',
        message: "Impossible d'exporter le graphique en image",
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
        size="sm"
        onClick={handleExport}
        loading={exporting}
        aria-label="Exporter en image (PNG)"
      >
        <Camera size={14} weight="duotone" />
      </ActionIcon>
    </Tooltip>
  );
}
