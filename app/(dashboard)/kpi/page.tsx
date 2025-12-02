'use client'

import { Grid, Card, Title, Text, Group, Badge, Stack, Button } from '@mantine/core'
import { Book, Users, ChartLine, ArrowRight, Target, TrendUp, Building, Clock } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'

export default function KPIMainPage() {
  const router = useRouter()

  const kpiModules = [
    {
      title: 'KPIs Formations',
      description: 'Analyse détaillée du catalogue de formations, taux d\'utilisation, formations populaires et orphelines',
      href: '/kpi/formations',
      icon: <Book size={32} weight="bold" />,
      color: 'blue',
      metrics: [
        { label: 'Catalogue complet', value: 'Toutes les formations' },
        { label: 'Taux utilisation', value: 'Performance formations' },
        { label: 'Top formations', value: 'Les plus populaires' },
      ]
    },
    {
      title: 'KPIs Collaborateurs',
      description: 'Statistiques sur les collaborateurs, participation aux formations, analyses par département',
      href: '/kpi/collaborateurs',
      icon: <Users size={32} weight="bold" />,
      color: 'teal',
      metrics: [
        { label: 'Répartitions', value: 'Genre, contrats' },
        { label: 'Participation', value: 'Taux de formation' },
        { label: 'Top participants', value: 'Classement' },
      ]
    },
    {
      title: 'KPIs Performance',
      description: 'Métriques de performance globales, comparaisons temporelles et benchmark départements',
      href: '/kpi/performance',
      icon: <ChartLine size={32} weight="bold" />,
      color: 'green',
      metrics: [
        { label: 'Comparaisons', value: 'Année/Mois' },
        { label: 'Évolutions', value: 'Trimestrielle' },
        { label: 'Benchmark', value: 'Par département' },
      ]
    },
    {
      title: 'KPIs Rapports',
      description: 'Génération de rapports personnalisés et export des données',
      href: '/kpi/reports',
      icon: <Target size={32} weight="bold" />,
      color: 'orange',
      metrics: [
        { label: 'Rapports', value: 'Personnalisables' },
        { label: 'Exports', value: 'Excel, PDF' },
        { label: 'Planification', value: 'Automatique' },
      ]
    },
    {
      title: 'KPIs Statistiques',
      description: 'Analyses statistiques avancées et tableaux de bord détaillés',
      href: '/kpi/stats',
      icon: <TrendUp size={32} weight="bold" />,
      color: 'violet',
      metrics: [
        { label: 'Tendances', value: 'Analyses prédictives' },
        { label: 'Corrélations', value: 'Multi-critères' },
        { label: 'Prévisions', value: 'Modèles statistiques' },
      ]
    }
  ]

  const quickStats = [
    { label: 'Modules disponibles', value: '5', icon: <Building size={20} />, color: 'blue' },
    { label: 'KPIs actifs', value: '80+', icon: <ChartLine size={20} />, color: 'green' },
    { label: 'Mise à jour', value: 'Temps réel', icon: <Clock size={20} />, color: 'orange' },
    { label: 'Performance', value: '< 2s', icon: <TrendUp size={20} />, color: 'teal' },
  ]

  return (
    <div style={{ padding: '1.5rem' }}>
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={2} mb="xs">📊 Centre de KPIs</Title>
          <Text c="dimmed">Accédez à tous les indicateurs de performance de votre organisation</Text>
        </div>

        {/* Quick Stats */}
        <Grid mb="xl">
          {quickStats.map((stat, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" p="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">{stat.label}</Text>
                  {stat.icon}
                </Group>
                <Text size="xl" fw={700} c={stat.color}>
                  {stat.value}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* KPI Modules */}
        <Grid>
          {kpiModules.map((module, index) => (
            <Grid.Col key={index} span={{ base: 12, md: 6, lg: 4 }}>
              <Card 
                shadow="sm" 
                p="lg" 
                radius="md"
                withBorder
                style={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onClick={() => router.push(module.href)}
              >
                <Stack gap="md" style={{ height: '100%' }}>
                  <Group justify="space-between">
                    <div style={{ color: `var(--mantine-color-${module.color}-6)` }}>
                      {module.icon}
                    </div>
                    <Badge color={module.color} variant="light">
                      Actif
                    </Badge>
                  </Group>
                  
                  <div>
                    <Title order={4} mb="xs">{module.title}</Title>
                    <Text size="sm" c="dimmed">
                      {module.description}
                    </Text>
                  </div>

                  <Stack gap="xs" style={{ marginTop: 'auto' }}>
                    {module.metrics.map((metric, idx) => (
                      <Group key={idx} justify="space-between">
                        <Text size="xs" c="dimmed">{metric.label}</Text>
                        <Text size="xs" fw={500}>{metric.value}</Text>
                      </Group>
                    ))}
                  </Stack>

                  <Button 
                    variant="light" 
                    color={module.color}
                    fullWidth
                    rightSection={<ArrowRight size={16} />}
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(module.href)
                    }}
                  >
                    Accéder aux KPIs
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </div>
  )
}