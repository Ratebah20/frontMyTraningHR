'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Table,
  Badge,
  Group,
  TextInput,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Center,
  Loader,
  ActionIcon,
  Tooltip,
  Alert,
  Button,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Certificate } from '@phosphor-icons/react/dist/ssr/Certificate';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { formationsService, statsService, exportsService } from '@/lib/services';
import { Formation } from '@/lib/types';

interface MandatoryKPIs {
  periode: { annee: number; mois?: number; libelle: string };
  stats: {
    totalFormations: number;
    totalCollaborateursAFormer: number;
    totalFormes: number;
    totalNonFormes: number;
    tauxConformiteGlobal: number;
  };
}

export default function FormationsObligatoiresPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Résumé de conformité (le suivi détaillé vit sur /kpi/conformite)
  const [conformityData, setConformityData] = useState<MandatoryKPIs | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await formationsService.getFormations({
          estObligatoire: true,
          limit: 100,
        });
        setFormations(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des formations obligatoires:', err);
        setError('Impossible de charger les formations obligatoires');
      } finally {
        setLoading(false);
      }

      try {
        const data = await statsService.getMandatoryTrainingsKPIs('annee', new Date().getFullYear().toString());
        setConformityData(data);
      } catch (err) {
        console.error('Erreur lors du chargement des données de conformité:', err);
      }
    };

    loadData();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const annee = new Date().getFullYear();
      const blob = await exportsService.exportFormationsObligatoires(annee);
      exportsService.downloadBlob(blob, `formations-obligatoires_${annee}.xlsx`);
      notifications.show({
        title: 'Export généré',
        message: 'Le fichier Excel de suivi des formations obligatoires a été téléchargé',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
    } catch (err) {
      console.error("Erreur lors de l'export:", err);
      notifications.show({
        title: 'Erreur',
        message: "Impossible de générer l'export Excel",
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setExporting(false);
    }
  };

  const filteredFormations = formations.filter(
    f => f.nomFormation.toLowerCase().includes(search.toLowerCase()) ||
         f.codeFormation.toLowerCase().includes(search.toLowerCase())
  );

  const formatDuree = (duree?: number, unite?: string) => {
    if (!duree) return '-';
    const uniteAffichee = unite || 'Heures';
    return `${duree} ${uniteAffichee.toLowerCase()}`;
  };

  const getConformiteColor = (taux: number) => {
    if (taux >= 80) return 'green';
    if (taux >= 50) return 'orange';
    return 'red';
  };

  if (loading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Alert color="red" title="Erreur" icon={<Warning size={20} />}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <div>
            <Title order={2}>Formations obligatoires</Title>
            <Text c="dimmed" size="sm">
              Catalogue des formations réglementaires et obligatoires
            </Text>
          </div>
          <Button
            leftSection={<DownloadSimple size={18} />}
            variant="light"
            onClick={handleExport}
            loading={exporting}
          >
            Exporter le suivi (Excel)
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total obligatoires
                </Text>
                <Text size="xl" fw={700}>
                  {formations.length}
                </Text>
              </div>
              <ThemeIcon color="blue" size="lg" radius="md">
                <Certificate size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Taux conformité
                </Text>
                <Text size="xl" fw={700} c={conformityData ? getConformiteColor(conformityData.stats.tauxConformiteGlobal) : 'dimmed'}>
                  {conformityData ? `${conformityData.stats.tauxConformiteGlobal}%` : '-'}
                </Text>
                {conformityData && (
                  <Text size="xs" c="dimmed">
                    {conformityData.stats.totalFormes}/{conformityData.stats.totalCollaborateursAFormer} conformes
                  </Text>
                )}
              </div>
              <ThemeIcon color={conformityData ? getConformiteColor(conformityData.stats.tauxConformiteGlobal) : 'gray'} size="lg" radius="md">
                <CheckCircle size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Non conformes
                </Text>
                <Text size="xl" fw={700} c={conformityData && conformityData.stats.totalNonFormes > 0 ? 'red' : 'dimmed'}>
                  {conformityData ? conformityData.stats.totalNonFormes : '-'}
                </Text>
                {conformityData && (
                  <Text size="xs" c="dimmed">collaborateurs à former</Text>
                )}
              </div>
              <ThemeIcon color={conformityData && conformityData.stats.totalNonFormes > 0 ? 'red' : 'gray'} size="lg" radius="md">
                <Warning size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Collaborateurs formés
                </Text>
                <Text size="xl" fw={700} c={conformityData ? 'green' : 'dimmed'}>
                  {conformityData ? conformityData.stats.totalFormes : '-'}
                </Text>
                {conformityData && (
                  <Text size="xs" c="dimmed">sur {conformityData.stats.totalCollaborateursAFormer}</Text>
                )}
              </div>
              <ThemeIcon color={conformityData ? 'green' : 'gray'} size="lg" radius="md">
                <Users size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        <Alert icon={<ShieldCheck size={20} />} color="blue" variant="light">
          <Text size="sm">
            Le suivi détaillé de la conformité (matrice département × formation, listes par collaborateur,
            envoi de rappels aux managers) se trouve sur la page{' '}
            <Text
              component="a"
              href="/kpi/conformite"
              c="blue"
              td="underline"
              style={{ cursor: 'pointer' }}
            >
              KPI Obligatoires
            </Text>.
          </Text>
        </Alert>

        <Stack gap="md">
          <TextInput
            placeholder="Rechercher une formation..."
            leftSection={<MagnifyingGlass size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />

          <Card shadow="sm" p={0} radius="md" withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Formation</Table.Th>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Catégorie</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Obligation</Table.Th>
                  <Table.Th>Durée</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredFormations.map((formation) => (
                  <Table.Tr key={formation.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{formation.nomFormation}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{formation.codeFormation}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">
                        {typeof formation.categorie === 'string'
                          ? formation.categorie
                          : formation.categorie?.nomCategorie || 'Non catégorisé'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formation.typeFormation || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      {formation.obligatoireType === 'onboarding' ? (
                        <Badge color="grape" variant="light">Onboarding</Badge>
                      ) : (
                        <Badge color="blue" variant="light">
                          {formation.obligatoireAnnee ? `Annuelle ${formation.obligatoireAnnee}` : 'Annuelle'}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDuree(formation.dureePrevue, formation.uniteDuree)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={formation.actif ? 'green' : 'gray'}
                        variant="light"
                      >
                        {formation.actif ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Voir les détails">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => router.push(`/formations/${formation.id}`)}
                        >
                          <Eye size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {filteredFormations.length === 0 && (
              <Text ta="center" p="xl" c="dimmed">
                {formations.length === 0
                  ? 'Aucune formation n\'est marquée comme obligatoire. Éditez une formation pour la marquer comme obligatoire.'
                  : 'Aucune formation obligatoire ne correspond à votre recherche'}
              </Text>
            )}
          </Card>
        </Stack>
      </Stack>
    </Container>
  );
}
