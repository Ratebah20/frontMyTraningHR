'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Grid, 
  Card,
  Group,
  Badge,
  Button,
  Progress,
  ThemeIcon,
  Stack,
  Paper,
  Skeleton,
  Box,
} from '@mantine/core';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import { Card as TremorCard, Grid as TremorGrid, Flex, AreaChart, DonutChart } from '@tremor/react';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  CheckCircle,
  ArrowUpRight,
  Clock,
} from '@phosphor-icons/react';
import { mockData, mockServices } from '@/lib/mock-data';

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const [loading, setLoading] = useState(false);
  
  const kpiData = [
    {
      title: "Collaborateurs",
      value: mockData.collaborateurs.length,
      icon: Users,
      color: "blue",
      progress: 75,
      subtitle: `${mockData.collaborateurs.length} actifs`,
      metric: "75%",
      metricLabel: "Taux de participation",
    },
    {
      title: "Formations", 
      value: mockData.formations.length,
      icon: GraduationCap,
      color: "grape",
      progress: 60,
      subtitle: `${mockData.sessions.length} sessions`,
      metric: mockData.sessions.length.toString(),
      metricLabel: "Sessions actives",
    },
    {
      title: "Inscriptions",
      value: mockData.kpi.heuresFormation,
      icon: Calendar,
      color: "orange", 
      progress: 80,
      subtitle: "Heures de formation",
      metric: "80%",
      metricLabel: "Objectif atteint",
    },
    {
      title: "Budget",
      value: `${mockData.kpi.budget.toLocaleString('fr-FR')}€`,
      icon: CheckCircle,
      color: "green",
      progress: 65,
      subtitle: "Budget formation",
      metric: "65%",
      metricLabel: "Budget utilisé",
    }
  ];
  
  const chartData = [
    { month: 'Jan', inscriptions: 45 },
    { month: 'Fév', inscriptions: 52 },
    { month: 'Mar', inscriptions: 48 },
    { month: 'Avr', inscriptions: 61 },
    { month: 'Mai', inscriptions: 55 },
    { month: 'Juin', inscriptions: 67 },
  ];
  
  const donutData = [
    { name: 'IT', value: 40 },
    { name: 'RH', value: 30 },
    { name: 'Finance', value: 20 },
    { name: 'Marketing', value: 10 },
  ];

  useEffect(() => {
    if (cardsRef.current.length > 0) {
      gsap.fromTo(cardsRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <Container size="xl" ref={containerRef}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1}>Tableau de bord</Title>
            <Text size="lg" c="dimmed">Vue d'ensemble de vos formations</Text>
          </div>
          <Badge size="lg" variant="light" color="blue">Données de démonstration</Badge>
        </Group>
      </motion.div>

      <Grid gutter="lg" mb="xl">
        {kpiData.map((kpi, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
            <motion.div
              ref={el => { if (el) cardsRef.current[index] = el as HTMLDivElement; }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{ height: '220px' }}
            >
              <Card shadow="sm" radius="md" withBorder className="hover:shadow-lg transition-shadow" h="100%" p="md">
                <Stack h="100%" justify="space-between" gap="sm">
                  <div>
                    <Group justify="space-between" mb="sm">
                      <ThemeIcon size={40} radius="md" variant="light" color={kpi.color}>
                        <kpi.icon size={24} weight="duotone" />
                      </ThemeIcon>
                    </Group>
                    
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={4}>
                      {kpi.title}
                    </Text>
                    
                    <Box>
                      <Text size="2rem" fw={700} lh={1}>{kpi.value}</Text>
                      <Text size="xs" c="dimmed" fw={500} mt={4}>{kpi.subtitle}</Text>
                    </Box>
                  </div>
                  
                  <Stack gap={6}>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">{kpi.metricLabel}</Text>
                      <Text size="xs" fw={600} color={kpi.color}>{kpi.metric}</Text>
                    </Group>
                    <Progress value={kpi.progress} color={kpi.color} size="xs" radius="xl" animated />
                  </Stack>
                </Stack>
              </Card>
            </motion.div>
          </Grid.Col>
        ))}
      </Grid>

      <TremorGrid numItemsSm={1} numItemsLg={2} className="gap-6 mb-6">
        <TremorCard className="hover:shadow-lg transition-shadow">
          <Flex justifyContent="between" alignItems="center" className="mb-4">
            <div>
              <Title order={3}>Évolution des inscriptions</Title>
              <Text size="sm" c="dimmed">6 derniers mois</Text>
            </div>
          </Flex>
          <AreaChart
            className="h-72"
            data={chartData}
            index="month"
            categories={["inscriptions"]}
            colors={["indigo"]}
            valueFormatter={(value) => `${value}`}
            showAnimation={true}
            showLegend={false}
            showGridLines={true}
            curveType="monotone"
          />
        </TremorCard>

        <TremorCard className="hover:shadow-lg transition-shadow">
          <Flex justifyContent="between" alignItems="center" className="mb-4">
            <div>
              <Title order={3}>Répartition par département</Title>
              <Text size="sm" c="dimmed">Taux de participation</Text>
            </div>
          </Flex>
          <DonutChart
            className="h-64"
            data={donutData}
            category="value"
            index="name"
            valueFormatter={(value) => `${value}%`}
            colors={["blue", "cyan", "indigo", "violet"]}
            showAnimation={true}
            label={`${mockData.kpi.tauxParticipation}%`}
          />
        </TremorCard>
      </TremorGrid>

      <Paper shadow="sm" radius="md" p="lg" withBorder className="hover:shadow-lg transition-shadow">
        <Group justify="space-between" mb="md">
          <div>
            <Title order={3}>Sessions récentes</Title>
            <Text size="sm" c="dimmed">{mockData.sessions.length} sessions actives</Text>
          </div>
          <Button variant="subtle" size="sm" rightSection={<ArrowUpRight size={14} />}>
            Voir toutes les sessions
          </Button>
        </Group>
        <Stack gap="md">
          {mockData.sessions.map((session, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
              <Paper p="md" withBorder className="hover:shadow-sm transition-all hover:border-blue-300">
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb="xs">
                      <Text fw={600} size="sm">
                        {mockData.formations.find(f => f.id === session.formation_id)?.titre}
                      </Text>
                      <Badge size="xs" color="blue" variant="light">Planifiée</Badge>
                    </Group>
                    <Group gap="lg">
                      <Group gap={4}>
                        <ThemeIcon size="xs" variant="transparent" color="blue">
                          <Users size={14} />
                        </ThemeIcon>
                        <Text size="xs" c="dimmed">{session.inscrits} / {session.places} inscrits</Text>
                      </Group>
                      <Group gap={4}>
                        <ThemeIcon size="xs" variant="transparent" color="orange">
                          <Calendar size={14} />
                        </ThemeIcon>
                        <Text size="xs" c="dimmed">
                          {new Date(session.date_debut).toLocaleDateString('fr-FR')}
                        </Text>
                      </Group>
                    </Group>
                  </div>
                </Group>
              </Paper>
            </motion.div>
          ))}
        </Stack>
      </Paper>
    </Container>
  );
}