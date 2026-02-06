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
  Tabs,
  SimpleGrid,
  ThemeIcon,
  Center,
  Loader,
  ActionIcon,
  Tooltip,
  RingProgress,
  Progress,
  Alert,
} from '@mantine/core';
import { MagnifyingGlass, Warning, CheckCircle, Clock, Certificate, Eye, Buildings, Users, ShieldCheck } from '@phosphor-icons/react';
import { formationsService, statsService } from '@/lib/services';
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
  formations: Array<{
    id: number;
    codeFormation: string;
    nomFormation: string;
    categorie: string;
    collaborateursFormes: number;
    collaborateursNonFormes: number;
    tauxConformite: number;
  }>;
  parDepartement: Array<{
    departementId: number;
    departement: string;
    totalCollaborateurs: number;
    formes: number;
    nonFormes: number;
    tauxConformite: number;
  }>;
}

export default function FormationsObligatoiresPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('formations');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Conformity data
  const [conformityData, setConformityData] = useState<MandatoryKPIs | null>(null);
  const [conformityLoading, setConformityLoading] = useState(false);

  // Charger les formations obligatoires
  useEffect(() => {
    const loadFormations = async () => {
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
    };

    loadFormations();
  }, []);

  // Charger les KPIs de conformité quand l'onglet est sélectionné
  useEffect(() => {
    if (activeTab === 'conformite') {
      loadConformityData();
    }
  }, [activeTab]);

  const loadConformityData = async () => {
    setConformityLoading(true);
    try {
      const data = await statsService.getMandatoryTrainingsKPIs('annee', new Date().getFullYear().toString());
      setConformityData(data);
    } catch (err) {
      console.error('Erreur lors du chargement des données de conformité:', err);
    } finally {
      setConformityLoading(false);
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
        <div>
          <Title order={2}>Formations obligatoires</Title>
          <Text c="dimmed" size="sm">
            Gestion et suivi des formations réglementaires et obligatoires
          </Text>
        </div>

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

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="formations">Formations obligatoires ({formations.length})</Tabs.Tab>
            <Tabs.Tab value="conformite">Suivi conformité</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="formations" pt="xl">
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
          </Tabs.Panel>

          <Tabs.Panel value="conformite" pt="xl">
            {conformityLoading ? (
              <Center h={300}>
                <Loader size="lg" />
              </Center>
            ) : !conformityData || conformityData.stats.totalFormations === 0 ? (
              <Stack gap="lg">
                <Alert
                  icon={<ShieldCheck size={20} />}
                  title="Aucune donnée de conformité"
                  color="blue"
                  variant="light"
                >
                  <Text size="sm">
                    Aucune formation obligatoire n'est définie ou aucune donnée de conformité n'est disponible pour la période en cours.
                    Marquez des formations comme obligatoires pour activer le suivi de conformité.
                  </Text>
                </Alert>
              </Stack>
            ) : (
              <Stack gap="lg">
                {/* Taux de conformité global */}
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Title order={4} mb="xs">Conformité globale</Title>
                      <Text c="dimmed" size="sm" mb="md">
                        {conformityData.periode.libelle} - {conformityData.stats.totalFormations} formation(s) obligatoire(s)
                      </Text>
                      <SimpleGrid cols={3} spacing="lg">
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Collaborateurs à former</Text>
                          <Text size="lg" fw={700}>{conformityData.stats.totalCollaborateursAFormer}</Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Formés</Text>
                          <Text size="lg" fw={700} c="green">{conformityData.stats.totalFormes}</Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Non formés</Text>
                          <Text size="lg" fw={700} c="red">{conformityData.stats.totalNonFormes}</Text>
                        </div>
                      </SimpleGrid>
                    </div>
                    <RingProgress
                      size={140}
                      thickness={12}
                      roundCaps
                      sections={[
                        { value: conformityData.stats.tauxConformiteGlobal, color: getConformiteColor(conformityData.stats.tauxConformiteGlobal) }
                      ]}
                      label={
                        <Center>
                          <div style={{ textAlign: 'center' }}>
                            <Text size="xl" fw={800}>{conformityData.stats.tauxConformiteGlobal}</Text>
                            <Text size="xs" c="dimmed">%</Text>
                          </div>
                        </Center>
                      }
                    />
                  </Group>
                </Card>

                {/* Détail par formation */}
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Title order={4} mb="md">Par formation obligatoire</Title>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Formation</Table.Th>
                        <Table.Th>Catégorie</Table.Th>
                        <Table.Th>Formés</Table.Th>
                        <Table.Th>Non formés</Table.Th>
                        <Table.Th>Taux</Table.Th>
                        <Table.Th style={{ width: 200 }}>Progression</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {conformityData.formations.map((f) => (
                        <Table.Tr key={f.id}>
                          <Table.Td>
                            <div>
                              <Text size="sm" fw={500}>{f.nomFormation}</Text>
                              <Text size="xs" c="dimmed">{f.codeFormation}</Text>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" size="sm">{f.categorie}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600} c="green">{f.collaborateursFormes}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600} c="red">{f.collaborateursNonFormes}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={getConformiteColor(f.tauxConformite)} variant="filled" size="sm">
                              {f.tauxConformite}%
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Progress
                              value={f.tauxConformite}
                              color={getConformiteColor(f.tauxConformite)}
                              size="lg"
                              radius="xl"
                            />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>

                {/* Détail par département */}
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Group mb="md">
                    <Buildings size={20} weight="bold" />
                    <Title order={4}>Conformité par département</Title>
                  </Group>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Département</Table.Th>
                        <Table.Th>Total collaborateurs</Table.Th>
                        <Table.Th>Formés</Table.Th>
                        <Table.Th>Non formés</Table.Th>
                        <Table.Th>Taux conformité</Table.Th>
                        <Table.Th style={{ width: 200 }}>Progression</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {conformityData.parDepartement.map((dept) => (
                        <Table.Tr key={dept.departementId}>
                          <Table.Td>
                            <Text size="sm" fw={500}>{dept.departement}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{dept.totalCollaborateurs}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600} c="green">{dept.formes}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600} c="red">{dept.nonFormes}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={getConformiteColor(dept.tauxConformite)} variant="filled" size="sm">
                              {dept.tauxConformite}%
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Progress
                              value={dept.tauxConformite}
                              color={getConformiteColor(dept.tauxConformite)}
                              size="lg"
                              radius="xl"
                            />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  {conformityData.parDepartement.length === 0 && (
                    <Text ta="center" p="xl" c="dimmed">
                      Aucune donnée par département disponible.
                    </Text>
                  )}
                </Card>

                {/* Lien vers page KPI détaillée */}
                <Alert
                  icon={<ShieldCheck size={20} />}
                  color="blue"
                  variant="light"
                >
                  <Text size="sm">
                    Pour une vue détaillée avec la possibilité d'envoyer des rappels aux managers,
                    consultez la page{' '}
                    <Text
                      component="a"
                      href="/kpi/formations?tab=obligatoires"
                      c="blue"
                      td="underline"
                      style={{ cursor: 'pointer' }}
                    >
                      KPI Formations obligatoires
                    </Text>.
                  </Text>
                </Alert>
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
