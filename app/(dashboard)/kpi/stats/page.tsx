'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Stack,
  ThemeIcon,
  RingProgress,
  Center,
  Group,
  Badge,
  Paper,
  Progress,
  Table,
  Loader,
  Alert,
  Grid,
  Box,
  Divider,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  Clock,
  ChartBar,
  TrendUp,
  Building,
  Trophy,
  Target,
  Pulse,
  ArrowsClockwise,
  Warning,
  CheckCircle,
  BookOpen,
  Certificate,
} from '@phosphor-icons/react';
import { statsService } from '@/lib/services';

interface GlobalStats {
  totalCollaborateurs: number;
  totalFormations: number;
  totalSessions: number;
  heuresFormation: number;
  collaborateursActifs: number;
  tauxCompletion: number;
  formationsEnCours: number;
  formationsTerminees: number;
}

interface TopFormation {
  formationId: number;
  codeFormation: string;
  titre: string;
  nombreParticipants: number;
  nombreSessions: number;
  heuresTotal: number;
  categorie: string;
}

interface DepartmentStat {
  departement: string;
  nombreCollaborateurs: number;
  totalSessions: number;
  sessionsTerminees: number;
  heuresFormation: number;
  tauxCompletion: number;
}

interface CompletionRate {
  categorie: string;
  totalSessions: number;
  sessionsTerminees: number;
  tauxCompletion: number;
}

export default function KPIStatsPage() {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [topFormations, setTopFormations] = useState<TopFormation[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [completionRates, setCompletionRates] = useState<CompletionRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Charger toutes les statistiques en parallèle
      const [global, top, depts, completion] = await Promise.all([
        statsService.getGlobalStats(),
        statsService.getTopFormations(10),
        statsService.getStatsByDepartment(),
        statsService.getCompletionRate(),
      ]);

      setGlobalStats(global);
      setTopFormations(Array.isArray(top) ? top : []);
      setDepartmentStats(Array.isArray(depts) ? depts : []);
      setCompletionRates(Array.isArray(completion) ? completion : []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Loader size="lg" variant="bars" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Alert icon={<Warning size={20} />} color="red" variant="light">
          {error}
        </Alert>
      </Container>
    );
  }

  const tauxParticipation = globalStats ? 
    Math.round((globalStats.collaborateursActifs / globalStats.totalCollaborateurs) * 100) : 0;

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* En-tête */}
        <Paper shadow="xs" p="lg" radius="md">
          <Group justify="space-between" align="center">
            <div>
              <Group align="center" gap="sm">
                <ChartBar size={32} color="#228BE6" />
                <Title order={1}>Tableau de bord statistiques</Title>
              </Group>
              <Text c="dimmed" size="lg" mt="xs">
                Vue d'ensemble des indicateurs de formation
              </Text>
            </div>
            <Tooltip label="Rafraîchir les données">
              <ActionIcon variant="light" size="lg" onClick={loadAllStats}>
                <ArrowsClockwise size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Paper>

        {/* Section 1: Statistiques globales */}
        <div>
          <Title order={3} mb="md">Statistiques globales</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" variant="light" color="blue">
                  <Users size={32} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total collaborateurs
                  </Text>
                  <Text size="2xl" fw={700}>
                    {globalStats?.totalCollaborateurs || 0}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {globalStats?.collaborateursActifs || 0} actifs
                  </Text>
                </div>
              </Stack>
            </Card>

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" variant="light" color="green">
                  <GraduationCap size={32} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total formations
                  </Text>
                  <Text size="2xl" fw={700}>
                    {globalStats?.totalFormations || 0}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {globalStats?.formationsEnCours || 0} en cours
                  </Text>
                </div>
              </Stack>
            </Card>

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" variant="light" color="grape">
                  <Calendar size={32} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total sessions
                  </Text>
                  <Text size="2xl" fw={700}>
                    {globalStats?.totalSessions || 0}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {globalStats?.formationsTerminees || 0} terminées
                  </Text>
                </div>
              </Stack>
            </Card>

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" variant="light" color="orange">
                  <Clock size={32} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Heures de formation
                  </Text>
                  <Text size="2xl" fw={700}>
                    {globalStats?.heuresFormation || 0}
                  </Text>
                  <Text size="xs" c="dimmed">
                    heures dispensées
                  </Text>
                </div>
              </Stack>
            </Card>
          </SimpleGrid>
        </div>

        {/* Section 2: Top 10 des formations */}
        <Paper shadow="xs" p="lg" radius="md">
          <Group align="center" gap="sm" mb="lg">
            <Trophy size={24} color="#FFD43B" />
            <Title order={3}>Top 10 des formations populaires</Title>
          </Group>
          
          {topFormations.length > 0 ? (
            <Table.ScrollContainer minWidth={600}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Rang</Table.Th>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Participants</Table.Th>
                    <Table.Th>Sessions</Table.Th>
                    <Table.Th>Heures totales</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {topFormations.map((formation, index) => (
                    <Table.Tr key={formation.formationId}>
                      <Table.Td>
                        <Badge 
                          color={index < 3 ? 'yellow' : 'gray'} 
                          variant={index < 3 ? 'filled' : 'light'}
                        >
                          #{index + 1}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text fw={500}>{formation.titre}</Text>
                          <Text size="xs" c="dimmed">{formation.categorie}</Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline">{formation.codeFormation}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Users size={16} />
                          {formation.nombreParticipants}
                        </Group>
                      </Table.Td>
                      <Table.Td>{formation.nombreSessions}</Table.Td>
                      <Table.Td>{formation.heuresTotal}h</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              Aucune formation disponible
            </Text>
          )}
        </Paper>

        {/* Section 3: Statistiques par département */}
        <Paper shadow="xs" p="lg" radius="md">
          <Group align="center" gap="sm" mb="lg">
            <Building size={24} color="#228BE6" />
            <Title order={3}>Statistiques par département</Title>
          </Group>
          
          {departmentStats.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
              {departmentStats.map((dept, index) => (
                <Card key={index} withBorder p="md" radius="md">
                  <Stack gap="xs">
                    <Text fw={600} size="lg">{dept.departement}</Text>
                    <Divider />
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Collaborateurs</Text>
                      <Text fw={500}>{dept.nombreCollaborateurs}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Sessions totales</Text>
                      <Text fw={500}>{dept.totalSessions}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Sessions terminées</Text>
                      <Text fw={500} c="green">{dept.sessionsTerminees}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Heures formation</Text>
                      <Text fw={500}>{Math.round(dept.heuresFormation)}h</Text>
                    </Group>
                    
                    <Box mt="xs">
                      <Group justify="space-between" mb={4}>
                        <Text size="xs" c="dimmed">Taux de complétion</Text>
                        <Text size="xs" fw={500}>{dept.tauxCompletion}%</Text>
                      </Group>
                      <Progress 
                        value={dept.tauxCompletion} 
                        color={dept.tauxCompletion > 70 ? 'green' : dept.tauxCompletion > 40 ? 'yellow' : 'red'}
                        size="sm"
                        radius="sm"
                      />
                    </Box>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              Aucune statistique par département disponible
            </Text>
          )}
        </Paper>

        {/* Section 4: Taux de complétion par catégorie */}
        <Paper shadow="xs" p="lg" radius="md">
          <Group align="center" gap="sm" mb="lg">
            <Target size={24} color="#40C057" />
            <Title order={3}>Taux de complétion par catégorie</Title>
          </Group>
          
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              {completionRates.length > 0 ? (
                <Stack gap="md">
                  {completionRates.map((category, index) => (
                    <Card key={index} withBorder p="md" radius="md">
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text fw={500}>{category.categorie}</Text>
                          <Badge 
                            color={category.tauxCompletion > 70 ? 'green' : category.tauxCompletion > 40 ? 'yellow' : 'red'}
                            variant="light"
                            size="lg"
                          >
                            {category.tauxCompletion}%
                          </Badge>
                        </Group>
                        
                        <Progress 
                          value={category.tauxCompletion} 
                          color={category.tauxCompletion > 70 ? 'green' : category.tauxCompletion > 40 ? 'yellow' : 'red'}
                          size="xl"
                          radius="sm"
                        />
                        
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            {category.sessionsTerminees} / {category.totalSessions} sessions
                          </Text>
                          <Text size="xs" c="dimmed">
                            terminées
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  Aucune donnée de complétion disponible
                </Text>
              )}
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder p="lg" radius="md" h="100%">
                <Stack align="center" justify="center" h="100%">
                  <Center>
                    <RingProgress
                      size={200}
                      thickness={20}
                      sections={[
                        { 
                          value: globalStats?.tauxCompletion || 0, 
                          color: globalStats?.tauxCompletion > 70 ? 'green' : 
                                 globalStats?.tauxCompletion > 40 ? 'yellow' : 'red' 
                        }
                      ]}
                      label={
                        <Center>
                          <Stack align="center" gap={0}>
                            <Text size="xl" fw={700}>
                              {globalStats?.tauxCompletion || 0}%
                            </Text>
                            <Text size="xs" c="dimmed">
                              Taux global
                            </Text>
                          </Stack>
                        </Center>
                      }
                    />
                  </Center>
                  
                  <Stack gap="xs" w="100%" mt="lg">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <CheckCircle size={16} color="#40C057" />
                        <Text size="sm">Sessions terminées</Text>
                      </Group>
                      <Text fw={500}>{globalStats?.formationsTerminees || 0}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Pulse size={16} color="#FAB005" />
                        <Text size="sm">Sessions en cours</Text>
                      </Group>
                      <Text fw={500}>{globalStats?.formationsEnCours || 0}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Calendar size={16} color="#228BE6" />
                        <Text size="sm">Total sessions</Text>
                      </Group>
                      <Text fw={500}>{globalStats?.totalSessions || 0}</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Indicateurs de performance supplémentaires */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group align="center" gap="sm" mb="md">
              <TrendUp size={20} color="#40C057" />
              <Title order={4}>Taux de participation</Title>
            </Group>
            <Center>
              <RingProgress
                size={180}
                thickness={16}
                sections={[{ value: tauxParticipation, color: 'blue' }]}
                label={
                  <Center>
                    <Text size="xl" fw={700}>{tauxParticipation}%</Text>
                  </Center>
                }
              />
            </Center>
            <Text size="sm" c="dimmed" ta="center" mt="md">
              des collaborateurs ont participé à au moins une formation
            </Text>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group align="center" gap="sm" mb="md">
              <Certificate size={20} color="#7950F2" />
              <Title order={4}>Moyenne heures/collaborateur</Title>
            </Group>
            <Center>
              <Stack align="center">
                <Text size="3xl" fw={700} c="violet">
                  {globalStats && globalStats.collaborateursActifs > 0 
                    ? Math.round(globalStats.heuresFormation / globalStats.collaborateursActifs)
                    : 0}h
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Moyenne d'heures de formation par collaborateur actif
                </Text>
              </Stack>
            </Center>
          </Card>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}