'use client';

import { useState } from 'react';
import { Alert, Button, FileInput, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FileXls } from '@phosphor-icons/react/dist/ssr/FileXls';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { effectifService } from '@/lib/services';
import type { EffectifReconciliation } from '@/lib/types/effectif.types';
import { EffectifEcartsReport } from './EffectifEcartsReport';

/**
 * Contrôle d'effectif à la demande : le fichier RH est lu et comparé, jamais importé.
 * Le même rapport sort automatiquement à la fin de l'import RH des collaborateurs.
 */
export function EffectifReconciliationPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyse, setAnalyse] = useState<EffectifReconciliation | null>(null);

  const handleAnalyse = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const resultat = await effectifService.analyser(file);
      setAnalyse(resultat);

      notifications.show({
        title: 'Contrôle terminé',
        message: `${resultat.stats.nbFantomes} collaborateur(s) actif(s) dans l'application ne figurent pas dans le fichier RH`,
        color: resultat.stats.nbFantomes > 0 ? 'orange' : 'green',
        icon:
          resultat.stats.nbFantomes > 0 ? (
            <Warning size={20} />
          ) : (
            <CheckCircle size={20} />
          ),
      });
    } catch (error: any) {
      notifications.show({
        title: 'Échec du contrôle',
        message:
          error.response?.data?.message || error.message || 'Analyse impossible',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Stack gap="lg">
      <Alert icon={<Info size={16} />} color="blue" variant="light">
        <Text fw={600} mb="xs">
          Contrôle d&apos;effectif
        </Text>
        <Text size="sm">
          Déposez n&apos;importe quel export d&apos;effectif : il est lu, comparé aux
          collaborateurs enregistrés, puis supprimé. <Text span fw={600}>Rien n&apos;est
          importé ni modifié</Text> — le rapport fait ressortir les personnes encore
          actives ici alors qu&apos;elles ne font plus partie de l&apos;effectif. Les
          désactivations ne partent qu&apos;à votre demande, et les fiches sont
          conservées avec leur historique de formation.
        </Text>
        <Text size="sm" mt="xs">
          <Text span fw={600}>Colonnes suffisantes :</Text> un identifiant (
          <Text span ff="monospace">Matricule du salarié</Text>,{' '}
          <Text span ff="monospace">ID COLLABORATEUR</Text> ou{' '}
          <Text span ff="monospace">Email</Text>) et le nom. Un export Workday brut fait
          l&apos;affaire, sans retouche. Si le fichier contient aussi le département et
          le manager, les écarts de fiche sont calculés en plus ; s&apos;il porte une
          colonne <Text span ff="monospace">Statut actif</Text>, les lignes marquées
          &laquo; Non &raquo; sont traitées comme des sorties.
        </Text>
      </Alert>

      <Group align="flex-end" gap="md">
        <FileInput
          label="Fichier Excel d'effectif (export Workday, extract RH...)"
          placeholder="Cliquez pour sélectionner un fichier"
          accept=".xlsx,.xls"
          leftSection={<FileXls size={20} />}
          value={file}
          onChange={setFile}
          disabled={isAnalyzing}
          style={{ flex: 1 }}
        />
        <Button
          leftSection={<MagnifyingGlass size={16} />}
          onClick={handleAnalyse}
          loading={isAnalyzing}
          disabled={!file}
        >
          Analyser l&apos;effectif
        </Button>
      </Group>

      {analyse && (
        <EffectifEcartsReport analyse={analyse} onChange={setAnalyse} />
      )}
    </Stack>
  );
}
