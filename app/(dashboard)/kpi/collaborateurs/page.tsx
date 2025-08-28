'use client'

import { useState, useEffect } from 'react'
import { Card, Grid, Text, Title, Badge, Progress, Table, Group, Stack, Paper, RingProgress, PieChart, BarChart } from '@mantine/core'
import { Users, UserCircle, Briefcase, TrendUp, Building, Trophy, GenderIntersex } from '@phosphor-icons/react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface CollaborateursKPIs {
  summary: {
    totalCollaborateurs: number
    collaborateursActifs: number
    collaborateursFormes: number
    tauxParticipation: number
    nouveauxCollaborateurs: number
    nombreManagers: number
    collaborateursSansFormation: number
  }
  repartitionGenre: Array<{
    genre: string
    nombre: number
    pourcentage: number
  }>
  repartitionContrat: Array<{
    type: string
    nombre: number
    pourcentage: number
  }>
  analyseDepartements: Array<{
    departement: string
    effectif: number
    collaborateursFormes: number
    tauxFormation: number
    heuresMoyennes: number
    heuresTotal: number
  }>
  topParticipants: Array<{
    id: string
    nom: string
    departement: string
    nombreFormations: number
    heuresTotal: number
  }>
}

export default function CollaborateursKPIsPage() {
  const [data, setData] = useState<CollaborateursKPIs | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats/collaborateurs-kpis`)
      setData(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs collaborateurs:', error)
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

  const getColorByPerformance = (value: number) => {
    if (value >= 80) return 'green'
    if (value >= 60) return 'yellow'
    if (value >= 40) return 'orange'
    return 'red'
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <Title order={2} mb="xl">👥 KPIs Collaborateurs</Title>

      {/* KPIs Summary Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Total Collaborateurs</Text>
              <Users size={20} weight="bold" />
            </Group>
            <Text size="xl" fw={700}>{data.summary.totalCollaborateurs}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              {data.summary.collaborateursActifs} actifs
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Taux de participation</Text>
              <TrendUp size={20} weight="bold" />
            </Group>
            <Text size="xl" fw={700} c={getColorByPerformance(data.summary.tauxParticipation)}>
              {data.summary.tauxParticipation}%
            </Text>
            <Progress 
              value={data.summary.tauxParticipation} 
              size="xs" 
              mt="xs" 
              color={getColorByPerformance(data.summary.tauxParticipation)} 
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Managers</Text>
              <UserCircle size={20} weight="bold" />
            </Group>
            <Text size="xl" fw={700}>{data.summary.nombreManagers}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              Responsables d'équipe
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Sans formation</Text>
              <Users size={20} weight="bold" color="orange" />
            </Group>
            <Text size="xl" fw={700} c="orange">
              {data.summary.collaborateursSansFormation}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              À former en priorité
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Répartitions */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Répartition par genre</Title>
            <Stack gap="sm">
              {data.repartitionGenre.map((item, index) => (
                <div key={index}>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <GenderIntersex size={16} />
                      <Text size="sm">{item.genre}</Text>
                    </Group>
                    <Badge color="blue" variant="light">
                      {item.nombre} ({item.pourcentage}%)
                    </Badge>
                  </Group>
                  <Progress value={item.pourcentage} size="sm" color="blue" />
                </div>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Types de contrat</Title>
            <Stack gap="sm">
              {data.repartitionContrat.map((item, index) => (
                <div key={index}>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Briefcase size={16} />
                      <Text size="sm">{item.type}</Text>
                    </Group>
                    <Badge color="teal" variant="light">
                      {item.nombre}
                    </Badge>
                  </Group>
                  <Progress value={item.pourcentage} size="sm" color="teal" />
                </div>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Nouveaux collaborateurs</Title>
            <Group align="center" mt="xl">
              <TrendUp size={40} weight="bold" color="green" />
              <div>
                <Text size="2xl" fw={700} c="green">+{data.summary.nouveauxCollaborateurs}</Text>
                <Text size="sm" c="dimmed">Ces 30 derniers jours</Text>
              </div>
            </Group>
            <Text size="xs" c="dimmed" mt="md">
              Intégration en cours
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Analyse par département */}
      <Card shadow="sm" p="md" radius="md" mb="xl">
        <Title order={4} mb="md">📊 Analyse par département</Title>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Département</Table.Th>
              <Table.Th>Effectif</Table.Th>
              <Table.Th>Formés</Table.Th>
              <Table.Th>Taux formation</Table.Th>
              <Table.Th>Heures moyennes</Table.Th>
              <Table.Th>Heures totales</Table.Th>
              <Table.Th>Performance</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.analyseDepartements.map((dept) => (
              <Table.Tr key={dept.departement}>
                <Table.Td>
                  <Group gap="xs">
                    <Building size={16} />
                    <Text fw={500}>{dept.departement}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>{dept.effectif}</Table.Td>
                <Table.Td>{dept.collaborateursFormes}</Table.Td>
                <Table.Td>
                  <Text c={getColorByPerformance(dept.tauxFormation)} fw={600}>
                    {dept.tauxFormation}%
                  </Text>
                </Table.Td>
                <Table.Td>{dept.heuresMoyennes}h</Table.Td>
                <Table.Td>{dept.heuresTotal}h</Table.Td>
                <Table.Td>
                  <Progress 
                    value={dept.tauxFormation} 
                    size="sm" 
                    color={getColorByPerformance(dept.tauxFormation)}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Top participants */}
      <Card shadow="sm" p="md" radius="md">
        <Title order={4} mb="md">🏆 Top 10 des participants</Title>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Rang</Table.Th>
              <Table.Th>Collaborateur</Table.Th>
              <Table.Th>Département</Table.Th>
              <Table.Th>Formations suivies</Table.Th>
              <Table.Th>Heures totales</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.topParticipants.map((participant, index) => (
              <Table.Tr key={participant.id}>
                <Table.Td>
                  <Badge 
                    color={index === 0 ? 'yellow' : index === 1 ? 'gray' : index === 2 ? 'orange' : 'blue'} 
                    variant="filled"
                  >
                    #{index + 1}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {index < 3 && <Trophy size={16} weight="bold" color={index === 0 ? 'gold' : index === 1 ? 'silver' : '#CD7F32'} />}
                    <Text fw={500}>{participant.nom}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge color="blue" variant="light">
                    {participant.departement}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color="green" variant="dot">
                    {participant.nombreFormations} formations
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text fw={600} c="teal">{participant.heuresTotal}h</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </div>
  )
}