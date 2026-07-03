'use client'

import { Grid, Card, Title, Text, Group, Badge, Stack, Button } from '@mantine/core'
import { Book } from '@phosphor-icons/react/dist/ssr/Book';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { ChartLine } from '@phosphor-icons/react/dist/ssr/ChartLine';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { TrendUp } from '@phosphor-icons/react/dist/ssr/TrendUp';
import { Building } from '@phosphor-icons/react/dist/ssr/Building';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { Target } from '@phosphor-icons/react/dist/ssr/Target';
import { Trophy } from '@phosphor-icons/react/dist/ssr/Trophy';
import { useRouter } from 'next/navigation'

export default function KPIMainPage() {
  const router = useRouter()

  const kpiModules = [
    {
      title: 'Formations obligatoires',
      description: 'Conformité des formations obligatoires : matrice département × formation, listes par collaborateur, rappels managers et export Excel',
      href: '/kpi/conformite',
      icon: <ShieldCheck size={32} weight="bold" />,
      color: 'orange',
      metrics: [
        { label: 'Conformité', value: 'Matrice dept × formation' },
        { label: 'À relancer', value: 'Listes par manager' },
        { label: 'Actions', value: 'Rappels + export Excel' },
      ]
    },
    {
      title: 'KPIs Formations',
      description: 'Analyse détaillée du catalogue de formations, taux d\'utilisation, heures dispensées et cumulées',
      href: '/kpi/formations',
      icon: <Book size={32} weight="bold" />,
      color: 'blue',
      metrics: [
        { label: 'Catalogue complet', value: 'Toutes les formations' },
        { label: 'Taux utilisation', value: 'Performance formations' },
        { label: 'Heures & activité', value: 'Organismes, catégories' },
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
      title: 'Objectifs L&D',
      description: 'Suivi des objectifs Learning & Development par catégorie : certifiants, IA, Cybersécurité...',
      href: '/kpi/objectifs-ld',
      icon: <Target size={32} weight="bold" />,
      color: 'violet',
      metrics: [
        { label: 'Par catégorie', value: 'Cibles et atteinte' },
        { label: 'Évolution', value: 'Comparaison N-1' },
        { label: 'Radar', value: 'Vue synthétique' },
      ]
    },
    {
      title: 'Bilan annuel',
      description: 'Chiffres clés de l\'année en un coup d\'œil : stagiaires, heures, distanciel, formateurs mobilisés',
      href: '/kpi/bilan',
      icon: <Trophy size={32} weight="bold" />,
      color: 'yellow',
      metrics: [
        { label: 'Stagiaires & heures', value: 'Avec évolution vs N-1' },
        { label: 'Distanciel', value: 'Part des sessions' },
        { label: 'Records', value: 'Formateurs, participants' },
      ]
    },
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