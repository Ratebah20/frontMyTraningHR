'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Stack,
  Group,
  Badge,
  RingProgress,
  Center,
  Loader,
  Table,
  ThemeIcon,
  Alert,
} from '@mantine/core';
import {
  Target,
  ChartBar,
  Users,
  Clock,
  TrendUp,
  TrendDown,
  Lightning,
  Books,
  ShieldCheck,
  Certificate,
  Translate,
  Desktop,
  Brain,
  Briefcase,
} from '@phosphor-icons/react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { PeriodSelector } from '@/components/PeriodSelector';
import { statsService } from '@/lib/services';

interface CategoryKpi {
  categorieId: number;
  categorieNom: string;
  formations: number;
  totalSessions: number;
  sessionsCompleted: number;
  tauxCompletion: number;
  collaborateursFormes: number;
  heuresTotales: number;
  objectifCible: number;
  tauxAtteinte: number;
  evolution: number;
}

interface LdObjectivesData {
  global: {
    totalFormations: number;
    totalSessions: number;
    sessionsCompleted: number;
    tauxCompletionGlobal: number;
    collaborateursFormes: number;
    totalCollaborateurs: number;
    heuresTotales: number;
  };
  categories: CategoryKpi[];
}

// Category icon mapping
function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('cyber') || lower.includes('sécurité')) return <ShieldCheck size={24} weight="bold" />;
  if (lower.includes('ia') || lower.includes('data') || lower.includes('intelligence')) return <Brain size={24} weight="bold" />;
  if (lower.includes('management') || lower.includes('grh')) return <Briefcase size={24} weight="bold" />;
  if (lower.includes('langue')) return <Translate size={24} weight="bold" />;
  if (lower.includes('certif')) return <Certificate size={24} weight="bold" />;
  if (lower.includes('digital') || lower.includes('informatique') || lower.includes('bureautique')) return <Desktop size={24} weight="bold" />;
  return <Books size={24} weight="bold" />;
}

function getCategoryColor(index: number): string {
  const colors = ['orange', 'blue', 'green', 'violet', 'pink', 'teal', 'cyan', 'indigo', 'grape', 'red'];
  return colors[index % colors.length];
}

export default function ObjectifsLdPage() {
  const [data, setData] = useState<LdObjectivesData | null>(null);
  const [loading, setLoading] = useState(true);

  // Period selector
  const [periode, setPeriode] = useState<'annee' | 'mois' | 'plage'>('annee');
  const [date, setDate] = useState<string>(new Date().getFullYear().toString());
  const [dateDebut, setDateDebut] = useState<Date | null>(null);
  const [dateFin, setDateFin] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, [periode, date, dateDebut, dateFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined;
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined;
      const result = await statsService.getLdObjectivesKpis(periode, date, startDateStr, endDateStr);
      setData(result);
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs L&D:', error);
    } finally {
      setLoading(false);
    }
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

  if (!data) {
    return (
      <Container size="xl">
        <Alert color="red" title="Erreur" icon={<Lightning size={20} />}>
          Impossible de charger les objectifs L&D
        </Alert>
      </Container>
    );
  }

  // Prepare radar chart data
  const radarData = data.categories
    .filter(c => c.totalSessions > 0 || c.formations > 0)
    .map(c => ({
      category: c.categorieNom.length > 15 ? c.categorieNom.substring(0, 15) + '...' : c.categorieNom,
      atteinte: c.tauxAtteinte,
      objectif: c.objectifCible,
      completion: c.tauxCompletion,
    }));

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>
              <Target size={28} weight="bold" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Objectifs L&D
            </Title>
            <Text c="dimmed" size="sm">
              Suivi des objectifs de formation par catégorie
            </Text>
          </div>
          <PeriodSelector
            periode={periode}
            date={date}
            dateDebut={dateDebut}
            dateFin={dateFin}
            onChange={(p, d) => { setPeriode(p); setDate(d); }}
            onDateRangeChange={(debut, fin) => { setDateDebut(debut); setDateFin(fin); }}
          />
        </Group>

        {/* Global Summary Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Formations</Text>
                <Text size="xl" fw={700}>{data.global.totalFormations}</Text>
                <Text size="xs" c="dimmed">{data.global.totalSessions} sessions</Text>
              </div>
              <ThemeIcon color="blue" size="lg" radius="md">
                <Books size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Collaborateurs formés</Text>
                <Text size="xl" fw={700}>{data.global.collaborateursFormes}</Text>
                <Text size="xs" c="dimmed">sur {data.global.totalCollaborateurs} actifs</Text>
              </div>
              <ThemeIcon color="green" size="lg" radius="md">
                <Users size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Taux complétion</Text>
                <Text size="xl" fw={700}>{data.global.tauxCompletionGlobal}%</Text>
                <Text size="xs" c="dimmed">{data.global.sessionsCompleted}/{data.global.totalSessions} terminées</Text>
              </div>
              <ThemeIcon color="orange" size="lg" radius="md">
                <ChartBar size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Heures de formation</Text>
                <Text size="xl" fw={700}>{Math.round(data.global.heuresTotales).toLocaleString('fr-FR')}</Text>
                <Text size="xs" c="dimmed">heures dispensées</Text>
              </div>
              <ThemeIcon color="violet" size="lg" radius="md">
                <Clock size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Categories Grid */}
        <Title order={3}>Par catégorie</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {data.categories.map((cat, index) => (
            <Card key={cat.categorieId} shadow="sm" p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <ThemeIcon color={getCategoryColor(index)} size="lg" radius="md" variant="light">
                    {getCategoryIcon(cat.categorieNom)}
                  </ThemeIcon>
                  <div>
                    <Text fw={600} size="sm">{cat.categorieNom}</Text>
                    <Text size="xs" c="dimmed">{cat.formations} formations</Text>
                  </div>
                </Group>
                <Badge
                  color={cat.evolution > 0 ? 'green' : cat.evolution < 0 ? 'red' : 'gray'}
                  variant="light"
                  size="sm"
                  leftSection={cat.evolution > 0 ? <TrendUp size={12} weight="bold" /> : cat.evolution < 0 ? <TrendDown size={12} weight="bold" /> : null}
                >
                  {cat.evolution > 0 ? '+' : ''}{cat.evolution}%
                </Badge>
              </Group>

              <Center>
                <RingProgress
                  size={120}
                  thickness={10}
                  roundCaps
                  sections={[
                    { value: Math.min(cat.tauxAtteinte, 100), color: cat.tauxAtteinte >= cat.objectifCible ? 'green' : cat.tauxAtteinte >= cat.objectifCible * 0.7 ? 'orange' : 'red' },
                  ]}
                  label={
                    <Center>
                      <div style={{ textAlign: 'center' }}>
                        <Text size="lg" fw={800}>{cat.tauxAtteinte}</Text>
                        <Text size="xs" c="dimmed">/ {cat.objectifCible}%</Text>
                      </div>
                    </Center>
                  }
                />
              </Center>

              <SimpleGrid cols={3} mt="md" spacing="xs">
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">Formés</Text>
                  <Text size="sm" fw={600}>{cat.collaborateursFormes}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">Heures</Text>
                  <Text size="sm" fw={600}>{Math.round(cat.heuresTotales)}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">Sessions</Text>
                  <Text size="sm" fw={600}>{cat.totalSessions}</Text>
                </div>
              </SimpleGrid>
            </Card>
          ))}
        </SimpleGrid>

        {/* Radar Chart */}
        {radarData.length > 2 && (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={4} mb="md">Vue synthétique</Title>
            <Text c="dimmed" size="sm" mb="lg">
              Comparaison entre les taux d'atteinte et les objectifs cibles par catégorie
            </Text>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Taux d'atteinte (%)"
                  dataKey="atteinte"
                  stroke="#ff7900"
                  fill="#ff7900"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Objectif cible (%)"
                  dataKey="objectif"
                  stroke="#228be6"
                  fill="#228be6"
                  fillOpacity={0.1}
                  strokeDasharray="5 5"
                />
                <RechartsTooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Summary Table */}
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={4} mb="md">Récapitulatif</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Catégorie</Table.Th>
                <Table.Th>Formations</Table.Th>
                <Table.Th>Sessions</Table.Th>
                <Table.Th>Formés</Table.Th>
                <Table.Th>Heures</Table.Th>
                <Table.Th>Objectif</Table.Th>
                <Table.Th>Atteinte</Table.Th>
                <Table.Th>Écart</Table.Th>
                <Table.Th>Évolution</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.categories.map((cat, index) => {
                const ecart = cat.tauxAtteinte - cat.objectifCible;
                return (
                  <Table.Tr key={cat.categorieId}>
                    <Table.Td>
                      <Group gap="xs">
                        <ThemeIcon color={getCategoryColor(index)} size="sm" radius="md" variant="light">
                          {getCategoryIcon(cat.categorieNom)}
                        </ThemeIcon>
                        <Text size="sm" fw={500}>{cat.categorieNom}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm">{cat.formations}</Text></Table.Td>
                    <Table.Td><Text size="sm">{cat.totalSessions}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={600}>{cat.collaborateursFormes}</Text></Table.Td>
                    <Table.Td><Text size="sm">{Math.round(cat.heuresTotales)}</Text></Table.Td>
                    <Table.Td><Badge variant="light" color="blue" size="sm">{cat.objectifCible}%</Badge></Table.Td>
                    <Table.Td>
                      <Badge
                        variant="filled"
                        color={cat.tauxAtteinte >= cat.objectifCible ? 'green' : cat.tauxAtteinte >= cat.objectifCible * 0.7 ? 'orange' : 'red'}
                        size="sm"
                      >
                        {cat.tauxAtteinte}%
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} c={ecart >= 0 ? 'green' : 'red'}>
                        {ecart >= 0 ? '+' : ''}{ecart}%
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={cat.evolution > 0 ? 'green' : cat.evolution < 0 ? 'red' : 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {cat.evolution > 0 ? '+' : ''}{cat.evolution}%
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </Container>
  );
}
