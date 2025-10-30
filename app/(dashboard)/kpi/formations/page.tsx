'use client'

import { useState, useEffect } from 'react'
import { Card, Grid, Text, Title, Badge, Progress, Table, Group, Stack, Paper, ScrollArea, Tabs, TextInput, Select, ActionIcon } from '@mantine/core'
import { Book, ChartBar, Target, Clock, MagnifyingGlass, Funnel, TrendUp, Warning, Users, BookOpen } from '@phosphor-icons/react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface FormationsKPIs {
  summary: {
    totalFormations: number
    formationsActives: number
    formationsAvecSessions: number
    formationsOrphelines: number
    nouvellesFormations: number
    tauxUtilisation: number
    dureeMoyenne: number
  }
  catalogue: Array<{
    id: string
    code: string
    nom: string
    categorie: string
    type: string
    duree: number
    sessions: number
    participants: number
    heuresTotal: number
    departements: string[]
    actif: boolean
  }>
  formationsOrphelines: Array<{
    id: string
    code: string
    nom: string
    categorie: string
  }>
  repartitionCategories: Array<{
    nom: string
    formations: number
    pourcentage: number
  }>
  topFormations: Array<any>
}

export default function FormationsKPIsPage() {
  const [data, setData] = useState<FormationsKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>('catalogue')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats/formations-kpis`)
      setData(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs formations:', error)
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

  const filteredCatalogue = data.catalogue.filter(formation => {
    const matchSearch = formation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       formation.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = !categoryFilter || formation.categorie === categoryFilter
    return matchSearch && matchCategory
  })

  const categories = [...new Set(data.catalogue.map(f => f.categorie))]

  return (
    <div style={{ padding: '1.5rem' }}>
      <Title order={2} mb="xl">📊 KPIs Formations</Title>

      {/* KPIs Summary Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Total Formations</Text>
              <Book size={20} weight="bold" />
            </Group>
            <Text size="xl" fw={700}>{data.summary.totalFormations}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              {data.summary.formationsActives} actives
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Taux d'utilisation</Text>
              <Target size={20} weight="bold" />
            </Group>
            <Text size="xl" fw={700}>{data.summary.tauxUtilisation}%</Text>
            <Progress value={data.summary.tauxUtilisation} size="xs" mt="xs" color="teal" />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Durée moyenne</Text>
              <Clock size={20} weight="bold" />
            </Group>
            <Text size="xl" fw={700}>{data.summary.dureeMoyenne}h</Text>
            <Text size="xs" c="dimmed" mt="xs">
              Par formation
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Formations orphelines</Text>
              <Warning size={20} weight="bold" color="orange" />
            </Group>
            <Text size="xl" fw={700} c="orange">{data.summary.formationsOrphelines}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              Sans sessions
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Répartition par catégorie */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Répartition par catégorie</Title>
            <Stack gap="xs">
              {data.repartitionCategories.map((cat, index) => (
                <div key={index}>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm">{cat.nom}</Text>
                    <Badge color="blue" variant="light">
                      {cat.formations} formations ({cat.pourcentage}%)
                    </Badge>
                  </Group>
                  <Progress value={cat.pourcentage} size="sm" color="blue" />
                </div>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Nouvelles formations (30j)</Title>
            <Group align="center" mt="xl">
              <TrendUp size={40} weight="bold" color="green" />
              <div>
                <Text size="2xl" fw={700} c="green">{data.summary.nouvellesFormations}</Text>
                <Text size="sm" c="dimmed">formations ajoutées</Text>
              </div>
            </Group>
            <Text size="xs" c="dimmed" mt="md">
              Enrichissement continu du catalogue
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Tabs pour catalogue et analyses */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="catalogue" leftSection={<BookOpen size={16} />}>
            Catalogue complet
          </Tabs.Tab>
          <Tabs.Tab value="orphelines" leftSection={<Warning size={16} />}>
            Formations orphelines
          </Tabs.Tab>
          <Tabs.Tab value="top" leftSection={<ChartBar size={16} />}>
            Top formations
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="catalogue">
          <Card shadow="sm" p="md" radius="md">
            <Group mb="md">
              <TextInput
                placeholder="Rechercher une formation..."
                leftSection={<MagnifyingGlass size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Filtrer par catégorie"
                data={categories}
                value={categoryFilter}
                onChange={setCategoryFilter}
                clearable
                leftSection={<Funnel size={16} />}
                style={{ width: 250 }}
              />
            </Group>

            <ScrollArea h={500}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Catégorie</Table.Th>
                    <Table.Th>Sessions</Table.Th>
                    <Table.Th>Participants</Table.Th>
                    <Table.Th>Heures</Table.Th>
                    <Table.Th>Statut</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredCatalogue.map((formation) => (
                    <Table.Tr key={formation.id}>
                      <Table.Td>{formation.code}</Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{formation.nom}</Text>
                        <Text size="xs" c="dimmed">Durée: {formation.duree}h</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="blue" variant="light" size="sm">
                          {formation.categorie}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{formation.sessions}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Users size={14} />
                          <Text size="sm">{formation.participants}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>{formation.heuresTotal}h</Table.Td>
                      <Table.Td>
                        <Badge color={formation.actif ? 'green' : 'gray'} variant="dot">
                          {formation.actif ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="orphelines">
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Formations sans sessions</Title>
            <Text size="sm" c="dimmed" mb="md">
              Ces formations n'ont jamais eu de participants
            </Text>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Nom</Table.Th>
                  <Table.Th>Catégorie</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.formationsOrphelines.map((formation) => (
                  <Table.Tr key={formation.id}>
                    <Table.Td>{formation.code}</Table.Td>
                    <Table.Td>{formation.nom}</Table.Td>
                    <Table.Td>
                      <Badge color="gray" variant="light">
                        {formation.categorie}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="top">
          <Card shadow="sm" p="md" radius="md">
            <Title order={4} mb="md">Top 10 des formations populaires</Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Rang</Table.Th>
                  <Table.Th>Formation</Table.Th>
                  <Table.Th>Catégorie</Table.Th>
                  <Table.Th>Sessions</Table.Th>
                  <Table.Th>Heures totales</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.topFormations.map((formation, index) => (
                  <Table.Tr key={formation.id}>
                    <Table.Td>
                      <Badge color={index < 3 ? 'yellow' : 'gray'} variant="filled">
                        #{index + 1}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{formation.nom}</Text>
                      <Text size="xs" c="dimmed">{formation.code}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="blue" variant="light">
                        {formation.categorie}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formation.sessions}</Table.Td>
                    <Table.Td>{formation.heuresTotal}h</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}