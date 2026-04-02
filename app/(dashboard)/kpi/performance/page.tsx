'use client'

import { useState, useEffect } from 'react'
import { Card, Grid, Text, Title, Badge, Progress, Table, Group, Stack, Paper, Tabs } from '@mantine/core'
import { ChartLine } from '@phosphor-icons/react/dist/ssr/ChartLine';
import { TrendUp } from '@phosphor-icons/react/dist/ssr/TrendUp';
import { TrendDown } from '@phosphor-icons/react/dist/ssr/TrendDown';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { Target } from '@phosphor-icons/react/dist/ssr/Target';
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal';
import { ArrowUp } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { ArrowDown } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { PeriodSelector } from '@/components/PeriodSelector'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface PerformanceMetrics {
  sessionsTotal: number
  sessionsTerminees: number
  heuresTotal: number
  collaborateursFormes: number
  heuresMoyennes: number
  variation?: number
}

interface PerformanceKPIs {
  global: PerformanceMetrics
  anneeEnCours: PerformanceMetrics
  moisEnCours: PerformanceMetrics
  comparaisons: {
    anneePrecedente: PerformanceMetrics
    moisPrecedent: PerformanceMetrics
  }
  evolutionTrimestrielle: Array<{
    trimestre: string
    sessionsTotal: number
    sessionsTerminees: number
    heuresTotal: number
    collaborateursFormes: number
  }>
  benchmarkDepartements: Array<{
    departement: string
    effectif: number
    sessionsTotal: number
    sessionsTerminees: number
    tauxParticipation: number
    heuresTotal: number
    heuresMoyennes: number
  }>
}

export default function PerformanceKPIsPage() {
  const [data, setData] = useState<PerformanceKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string | null>('global')

  // Period selector state
  const [periode, setPeriode] = useState<'annee' | 'mois' | 'plage'>('annee')
  const [date, setDate] = useState<string>(new Date().getFullYear().toString())
  const [dateDebut, setDateDebut] = useState<Date | null>(null)
  const [dateFin, setDateFin] = useState<Date | null>(null)

  useEffect(() => {
    fetchData()
  }, [periode, date, dateDebut, dateFin])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      params.append('periode', periode)
      params.append('date', date)
      if (periode === 'plage' && dateDebut && dateFin) {
        params.append('startDate', dateDebut.toISOString().split('T')[0])
        params.append('endDate', dateFin.toISOString().split('T')[0])
      }
      const response = await axios.get(`${API_URL}/stats/performance-kpis?${params.toString()}`)
      setData(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs performance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Text>Chargement des données...</Text>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Text color="red">Erreur lors du chargement des données</Text>
      </div>
    )
  }

  const getVariationIcon = (variation?: number) => {
    if (!variation) return null
    return variation > 0 ? (
      <ArrowUp size={16} weight="bold" color="green" />
    ) : (
      <ArrowDown size={16} weight="bold" color="red" />
    )
  }

  const getVariationColor = (variation?: number) => {
    if (!variation) return 'gray'
    return variation > 0 ? 'green' : 'red'
  }

  const renderMetricCard = (title: string, metrics: PerformanceMetrics, icon: React.ReactNode) => (
    <Card shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">{title}</Text>
        {icon}
      </Group>
      <Stack gap="xs">
        <Group>
          <Text size="xl" fw={700}>{metrics.sessionsTotal}</Text>
          <Text size="sm" c="dimmed">sessions</Text>
          {metrics.variation !== undefined && (
            <Badge color={getVariationColor(metrics.variation)} variant="light">
              {getVariationIcon(metrics.variation)} {Math.abs(metrics.variation)}%
            </Badge>
          )}
        </Group>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Heures totales</Text>
          <Text size="xs" fw={600}>{metrics.heuresTotal}h</Text>
        </Group>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Participants</Text>
          <Text size="xs" fw={600}>{metrics.collaborateursFormes}</Text>
        </Group>
      </Stack>
    </Card>
  )

  return (
    <div style={{ padding: '1.5rem' }}>
      <Group justify="space-between" mb="xl">
        <Title order={2}>📈 KPIs Performance</Title>
        <PeriodSelector
          periode={periode}
          date={date}
          dateDebut={dateDebut}
          dateFin={dateFin}
          onChange={(p, d) => { setPeriode(p); setDate(d); }}
          onDateRangeChange={(debut, fin) => { setDateDebut(debut); setDateFin(fin); }}
        />
      </Group>

      {/* Métriques principales */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          {renderMetricCard('Performance Globale', data.global, <ChartLine size={20} weight="bold" />)}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          {renderMetricCard('Année en cours', data.anneeEnCours, <Calendar size={20} weight="bold" />)}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          {renderMetricCard('Mois en cours', data.moisEnCours, <TrendUp size={20} weight="bold" />)}
        </Grid.Col>
      </Grid>

      {/* Comparaisons */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Comparaison annuelle</Title>
            <Group justify="space-between" align="flex-start">
              <Stack gap="sm">
                <Text size="sm" c="dimmed">Année précédente</Text>
                <Text size="xl" fw={700}>{data.comparaisons.anneePrecedente.sessionsTotal}</Text>
                <Text size="xs" c="dimmed">sessions</Text>
              </Stack>
              <Badge size="xl" color={getVariationColor(data.anneeEnCours.variation)} variant="light">
                {getVariationIcon(data.anneeEnCours.variation)}
                {data.anneeEnCours.variation}%
              </Badge>
              <Stack gap="sm">
                <Text size="sm" c="dimmed">Année en cours</Text>
                <Text size="xl" fw={700}>{data.anneeEnCours.sessionsTotal}</Text>
                <Text size="xs" c="dimmed">sessions</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Comparaison mensuelle</Title>
            <Group justify="space-between" align="flex-start">
              <Stack gap="sm">
                <Text size="sm" c="dimmed">Mois précédent</Text>
                <Text size="xl" fw={700}>{data.comparaisons.moisPrecedent.sessionsTotal}</Text>
                <Text size="xs" c="dimmed">sessions</Text>
              </Stack>
              <Badge size="xl" color={getVariationColor(data.moisEnCours.variation)} variant="light">
                {getVariationIcon(data.moisEnCours.variation)}
                {data.moisEnCours.variation}%
              </Badge>
              <Stack gap="sm">
                <Text size="sm" c="dimmed">Mois en cours</Text>
                <Text size="xl" fw={700}>{data.moisEnCours.sessionsTotal}</Text>
                <Text size="xs" c="dimmed">sessions</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Tabs pour analyses détaillées */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="global" leftSection={<ChartLine size={16} />}>
            Vue d'ensemble
          </Tabs.Tab>
          <Tabs.Tab value="trimestre" leftSection={<Calendar size={16} />}>
            Évolution trimestrielle
          </Tabs.Tab>
          <Tabs.Tab value="benchmark" leftSection={<Medal size={16} />}>
            Benchmark départements
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="global">
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Métriques de performance globales</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="md">
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Sessions totales</Text>
                    <Text size="2xl" fw={700}>{data.global.sessionsTotal}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Sessions terminées</Text>
                    <Text size="2xl" fw={700} c="green">{data.global.sessionsTerminees}</Text>
                  </div>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="md">
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Heures totales de formation</Text>
                    <Text size="2xl" fw={700} c="blue">{data.global.heuresTotal}h</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Collaborateurs formés</Text>
                    <Text size="2xl" fw={700} c="indigo">{data.global.collaborateursFormes}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Heures moyennes par collaborateur</Text>
                    <Text size="2xl" fw={700} c="violet">{data.global.heuresMoyennes}h</Text>
                  </div>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="trimestre">
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Évolution trimestrielle</Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Trimestre</Table.Th>
                  <Table.Th>Sessions</Table.Th>
                  <Table.Th>Terminées</Table.Th>
                  <Table.Th>Heures</Table.Th>
                  <Table.Th>Participants</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.evolutionTrimestrielle.map((trimestre) => (
                  <Table.Tr key={trimestre.trimestre}>
                    <Table.Td>
                      <Badge color="blue" variant="light">
                        {trimestre.trimestre}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{trimestre.sessionsTotal}</Table.Td>
                    <Table.Td>{trimestre.sessionsTerminees}</Table.Td>
                    <Table.Td>{trimestre.heuresTotal}h</Table.Td>
                    <Table.Td>{trimestre.collaborateursFormes}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="benchmark">
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Benchmark par département</Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Département</Table.Th>
                  <Table.Th>Effectif</Table.Th>
                  <Table.Th>Sessions</Table.Th>
                  <Table.Th>Taux participation</Table.Th>
                  <Table.Th>Heures totales</Table.Th>
                  <Table.Th>Heures/pers</Table.Th>
                  <Table.Th>Score</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.benchmarkDepartements.map((dept, index) => {
                  const score = dept.tauxParticipation
                  const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : score >= 40 ? 'orange' : 'red'

                  return (
                    <Table.Tr key={dept.departement}>
                      <Table.Td>
                        {index < 3 && <Medal size={16} weight="bold" color={index === 0 ? 'gold' : index === 1 ? 'silver' : '#CD7F32'} />}
                        <Text fw={500}>{dept.departement}</Text>
                      </Table.Td>
                      <Table.Td>{dept.effectif}</Table.Td>
                      <Table.Td>{dept.sessionsTotal}</Table.Td>
                      <Table.Td>
                        <Text fw={600} c={dept.tauxParticipation >= 70 ? 'green' : 'orange'}>
                          {dept.tauxParticipation}%
                        </Text>
                      </Table.Td>
                      <Table.Td>{dept.heuresTotal}h</Table.Td>
                      <Table.Td>{dept.heuresMoyennes}h</Table.Td>
                      <Table.Td>
                        <Badge color={scoreColor} variant="filled" size="lg">
                          {score}%
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}