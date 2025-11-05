'use client'

import { useState, useEffect } from 'react'
import { Card, Grid, Text, Title, Badge, Progress, Table, Group, Stack, Paper, RingProgress, Select, Divider } from '@mantine/core'
import { Users, UserCircle, Briefcase, TrendUp, Building, Trophy, GenderIntersex, Clock, Calendar, ChartBar } from '@phosphor-icons/react'
import axios from 'axios'
import { statsService } from '@/lib/services'
import { DetailedKPIsResponse, CategoryStats } from '@/lib/types'

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
  const [detailedData, setDetailedData] = useState<DetailedKPIsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailedLoading, setDetailedLoading] = useState(false)

  // Filtres temporels
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString())
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  // Générer les options d'années (5 dernières années)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i
    return { value: year.toString(), label: year.toString() }
  })

  // Options de mois
  const monthOptions = [
    { value: '', label: 'Toute l\'année' },
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchDetailedData()
  }, [selectedYear, selectedMonth])

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

  const fetchDetailedData = async () => {
    setDetailedLoading(true)
    try {
      const year = parseInt(selectedYear, 10)
      const month = selectedMonth ? parseInt(selectedMonth, 10) : undefined
      const response = await statsService.getCollaborateursDetailedKpis(year, month)
      setDetailedData(response)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs détaillés:', error)
    } finally {
      setDetailedLoading(false)
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
      <Title order={2} mb="xl"> KPIs Collaborateurs</Title>

      {/* ==================== SECTION KPIs DÉTAILLÉS ==================== */}

      <Title order={2} mb="md" mt="xl">Statistiques détaillées par catégorie</Title>

      {/* Filtres temporels */}
      <Card shadow="sm" p="md" radius="md" mb="xl">
        <Group align="center" gap="md">
          <Calendar size={24} weight="bold" />
          <Text fw={600}>Période d'analyse</Text>
          <Select
            placeholder="Année"
            data={yearOptions}
            value={selectedYear}
            onChange={(value) => setSelectedYear(value || currentYear.toString())}
            w={120}
          />
          <Select
            placeholder="Mois"
            data={monthOptions}
            value={selectedMonth}
            onChange={(value) => setSelectedMonth(value || '')}
            w={180}
          />
          {detailedData && (
            <Badge color="blue" variant="light" size="lg">
              {detailedData.periode.libelle}
            </Badge>
          )}
        </Group>
      </Card>

      {detailedLoading ? (
        <Card shadow="sm" p="md" radius="md" mb="xl">
          <Text ta="center">Chargement des statistiques détaillées...</Text>
        </Card>
      ) : detailedData ? (
        <>
          {/* Cards de statistiques clés */}
          <Grid mb="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed" tt="uppercase" fw={700}>Heures - Hommes</Text>
                  <GenderIntersex size={20} color="#228BE6" />
                </Group>
                <Text size="xl" fw={700} c="blue">{detailedData.parGenre.homme.heures}h</Text>
                <Text size="xs" c="dimmed" mt="xs">
                  {detailedData.parGenre.homme.formations} formations • {detailedData.parGenre.homme.moyenne}h/personne
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed" tt="uppercase" fw={700}>Heures - Femmes</Text>
                  <GenderIntersex size={20} color="#E64980" />
                </Group>
                <Text size="xl" fw={700} c="pink">{detailedData.parGenre.femme.heures}h</Text>
                <Text size="xs" c="dimmed" mt="xs">
                  {detailedData.parGenre.femme.formations} formations • {detailedData.parGenre.femme.moyenne}h/personne
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed" tt="uppercase" fw={700}>Directeurs</Text>
                  <UserCircle size={20} color="#7950F2" />
                </Group>
                <Text size="xl" fw={700} c="violet">{detailedData.parRole.directeur.heures}h</Text>
                <Text size="xs" c="dimmed" mt="xs">
                  {detailedData.parRole.directeur.formations} formations • {detailedData.parRole.directeur.moyenne}h/personne
                </Text>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Tableaux comparatifs */}
          <Grid mb="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" p="md" radius="md">
                <Title order={4} mb="md">Par genre</Title>
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Catégorie</Table.Th>
                      <Table.Th>Collaborateurs</Table.Th>
                      <Table.Th>Formations</Table.Th>
                      <Table.Th>Heures</Table.Th>
                      <Table.Th>Moyenne</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td><Badge color="blue">Homme</Badge></Table.Td>
                      <Table.Td>{detailedData.parGenre.homme.nombre}</Table.Td>
                      <Table.Td>{detailedData.parGenre.homme.formations}</Table.Td>
                      <Table.Td>{detailedData.parGenre.homme.heures}h</Table.Td>
                      <Table.Td fw={600}>{detailedData.parGenre.homme.moyenne}h</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td><Badge color="pink">Femme</Badge></Table.Td>
                      <Table.Td>{detailedData.parGenre.femme.nombre}</Table.Td>
                      <Table.Td>{detailedData.parGenre.femme.formations}</Table.Td>
                      <Table.Td>{detailedData.parGenre.femme.heures}h</Table.Td>
                      <Table.Td fw={600}>{detailedData.parGenre.femme.moyenne}h</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" p="md" radius="md">
                <Title order={4} mb="md">Par rôle</Title>
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Catégorie</Table.Th>
                      <Table.Th>Collaborateurs</Table.Th>
                      <Table.Th>Formations</Table.Th>
                      <Table.Th>Heures</Table.Th>
                      <Table.Th>Moyenne</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td><Badge color="violet">Directeur</Badge></Table.Td>
                      <Table.Td>{detailedData.parRole.directeur.nombre}</Table.Td>
                      <Table.Td>{detailedData.parRole.directeur.formations}</Table.Td>
                      <Table.Td>{detailedData.parRole.directeur.heures}h</Table.Td>
                      <Table.Td fw={600}>{detailedData.parRole.directeur.moyenne}h</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td><Badge color="teal">Manager</Badge></Table.Td>
                      <Table.Td>{detailedData.parRole.manager.nombre}</Table.Td>
                      <Table.Td>{detailedData.parRole.manager.formations}</Table.Td>
                      <Table.Td>{detailedData.parRole.manager.heures}h</Table.Td>
                      <Table.Td fw={600}>{detailedData.parRole.manager.moyenne}h</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td><Badge color="gray">Non-manager</Badge></Table.Td>
                      <Table.Td>{detailedData.parRole.nonManager.nombre}</Table.Td>
                      <Table.Td>{detailedData.parRole.nonManager.formations}</Table.Td>
                      <Table.Td>{detailedData.parRole.nonManager.heures}h</Table.Td>
                      <Table.Td fw={600}>{detailedData.parRole.nonManager.moyenne}h</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Card>
            </Grid.Col>
          </Grid>
        </>
      ) : null}

      {/* Séparateur */}
      <Divider
        my="xl"
        size="md"
        label={
          <Group gap="xs">
            <ChartBar size={20} weight="bold" />
            <Text size="sm" fw={600} tt="uppercase">Vue d'ensemble générale</Text>
          </Group>
        }
        labelPosition="center"
      />

      {/* KPIs Summary Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
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

        <Grid.Col span={{ base: 12, md: 6 }}>
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
        <Grid.Col span={{ base: 12, md: 6 }}>
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
      </Grid>

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