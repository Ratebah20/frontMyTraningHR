'use client';

import { useState } from 'react';
import { Button, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { exportsService } from '@/lib/services';

interface ExcelExportButtonProps {
  /** Appel backend qui renvoie le classeur (Blob) */
  onExport: () => Promise<Blob>;
  /** Nom du fichier telecharge, extension comprise */
  filename: string;
  label?: string;
  disabled?: boolean;
}

/**
 * Bouton « Exporter (Excel) » des pages KPI : meme comportement partout
 * (telechargement, etat de chargement, notification d'erreur), sur le modele
 * de l'export des formations obligatoires.
 */
export function ExcelExportButton({
  onExport,
  filename,
  label = 'Exporter (Excel)',
  disabled = false,
}: ExcelExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleClick = async () => {
    setExporting(true);
    try {
      const blob = await onExport();
      exportsService.downloadBlob(blob, filename);
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      notifications.show({
        title: 'Export impossible',
        message: <Text size="sm">Le fichier Excel n&apos;a pas pu etre genere. Reessayez dans un instant.</Text>,
        color: 'red',
        icon: <WarningCircle size={20} weight="fill" />,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      className="no-print"
      leftSection={<DownloadSimple size={18} />}
      variant="light"
      onClick={handleClick}
      loading={exporting}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
