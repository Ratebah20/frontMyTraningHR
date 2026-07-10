'use client'

import { useState, useEffect } from 'react'
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { UserCircle } from '@phosphor-icons/react/dist/ssr/UserCircle';
import { Briefcase } from '@phosphor-icons/react/dist/ssr/Briefcase';
import { Trophy } from '@phosphor-icons/react/dist/ssr/Trophy';
import { GenderMale } from '@phosphor-icons/react/dist/ssr/GenderMale';
import { GenderFemale } from '@phosphor-icons/react/dist/ssr/GenderFemale';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { UsersFour } from '@phosphor-icons/react/dist/ssr/UsersFour';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Crown } from '@phosphor-icons/react/dist/ssr/Crown';
import { Handshake } from '@phosphor-icons/react/dist/ssr/Handshake';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { UserSwitch } from '@phosphor-icons/react/dist/ssr/UserSwitch';
import {
  Container,
  Card,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Badge,
  ThemeIcon,
  Loader,
  Center,
  Table,
  Progress,
  Switch,
  MultiSelect,
  Alert,
  Divider,
} from '@mantine/core'
import api from '@/lib/api'
import { motion } from 'framer-motion'
import { useReducedMotionPreference } from '@/lib/hooks/useReducedMotionPreference'
import { statsService } from '@/lib/services'
import { DetailedKPIsResponse } from '@/lib/types'
import { PeriodSelector } from '@/components/PeriodSelector'

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

// Neutralisé pour la performance (comme sur kpi/formations) : la version animée
// lançait une boucle requestAnimationFrame de 1,5 s avec setState à chaque frame
// PAR carte (8-10 instances simultanées), sans cleanup au démontage.
function useAnimatedCounter(endValue: number) {
  return endValue
}

function HeroCard({
  label,
  value,
  suffix,
  meta,
  icon: Icon,
  variant,
  delay = 0
}: {
  label: string
  value: number
  suffix?: string
  meta: string
  icon: any
  variant: 'blue' | 'pink' | 'violet' | 'orange' | 'teal'
  delay?: number
}) {
  const animatedValue = useAnimatedCounter(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card withBorder p="lg" radius="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group gap="xs">
              <ThemeIcon color={variant} variant="light" size="md">
                <Icon size={18} weight="bold" />
              </ThemeIcon>
              <Text size="sm" c="dimmed" fw={500}>{label}</Text>
            </Group>
            <Title order={2}>
              {animatedValue}
              {suffix && <Text span size="lg" c="dimmed" ml={4}>{suffix}</Text>}
            </Title>
            <Text size="xs" c="dimmed">{meta}</Text>
          </Stack>
          <ThemeIcon color={variant} variant="light" size="xl" radius="md">
            <Icon size={28} weight="fill" />
          </ThemeIcon>
        </Group>
      </Card>
    </motion.div>
  )
}

function GlassCard({
  label,
  value,
  suffix,
  meta,
  icon: Icon,
  iconVariant,
  delay = 0
}: {
  label: string
  value: number
  suffix?: string
  meta: string
  icon: any
  iconVariant: 'blue' | 'pink' | 'violet' | 'teal' | 'orange' | 'gray'
  delay?: number
}) {
  const animatedValue = useAnimatedCounter(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card withBorder p="lg" radius="md">
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed" fw={500}>{label}</Text>
          <ThemeIcon color={iconVariant} variant="light" size="md">
            <Icon size={20} weight="bold" />
          </ThemeIcon>
        </Group>
        <Title order={3}>
          {animatedValue}
          {suffix && <Text span size="md" c="dimmed" ml={4}>{suffix}</Text>}
        </Title>
        <Text size="xs" c="dimmed" mt={4}>{meta}</Text>
      </Card>
    </motion.div>
  )
}

export default function CollaborateursKPIsPage() {
  const reducedMotion = useReducedMotionPreference()
  const [data, setData] = useState<CollaborateursKPIs | null>(null)
  const [detailedData, setDetailedData] = useState<DetailedKPIsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailedLoading, setDetailedLoading] = useState(false)

  const [periode, setPeriode] = useState<'annee' | 'mois' | 'plage'>('annee')
  const [date, setDate] = useState(new Date().getFullYear().toString())
  const [dateDebut, setDateDebut] = useState<Date | null>(null)
  const [dateFin, setDateFin] = useState<Date | null>(null)

  const [includeInactifs, setIncludeInactifs] = useState(false)

  const [contratFilters, setContratFilters] = useState<number[]>([])
  const [typesContrats, setTypesContrats] = useState<{ id: number; typeContrat: string }[]>([])

  useEffect(() => {
    fetchTypesContrats()
  }, [])

  useEffect(() => {
    fetchData()
  }, [periode, date, dateDebut, dateFin])

  const fetchTypesContrats = async () => {
    try {
      const response = await api.get('/common/types-contrats')
      setTypesContrats(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des types de contrats:', error)
    }
  }

  useEffect(() => {
    fetchDetailedData()
  }, [periode, date, dateDebut, dateFin, includeInactifs, contratFilters])

  const fetchData = async () => {
    if (periode === 'plage' && (!dateDebut || !dateFin)) {
      return
    }
    try {
      const params = new URLSearchParams()
      params.append('periode', periode)
      params.append('date', date)
      if (periode === 'plage' && dateDebut && dateFin) {
        params.append('startDate', dateDebut.toISOString().split('T')[0])
        params.append('endDate', dateFin.toISOString().split('T')[0])
      }
      const response = await api.get(`/stats/collaborateurs-kpis?${params.toString()}`)
      setData(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs collaborateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedData = async () => {
    if (periode === 'plage' && (!dateDebut || !dateFin)) {
      return
    }

    setDetailedLoading(true)
    try {
      const startDate = dateDebut instanceof Date ? dateDebut.toISOString() :
                        dateDebut ? new Date(dateDebut).toISOString() : undefined
      const endDate = dateFin instanceof Date ? dateFin.toISOString() :
                      dateFin ? new Date(dateFin).toISOString() : undefined
      const response = await statsService.getCollaborateursDetailedKpis(periode, date, startDate, endDate, includeInactifs, contratFilters.length > 0 ? contratFilters : undefined)
      setDetailedData(response)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs détaillés:', error)
    } finally {
      setDetailedLoading(false)
    }
  }

  const getRankColor = (index: number): 'yellow' | 'gray' | 'orange' | 'blue' => {
    if (index === 0) return 'yellow'
    if (index === 1) return 'gray'
    if (index === 2) return 'orange'
    return 'blue'
  }

  if (loading) {
    return (
      <Container size="xl" py="md">
        <Center h={400}>
          <Stack align="center" gap="md">
            <Loader />
            <Text c="dimmed">Chargement des données...</Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container size="xl" py="md">
        <Alert color="red" icon={<Warning size={18} />} title="Erreur">
          Erreur lors du chargement des données
        </Alert>
      </Container>
    )
  }

  const contratOptions = typesContrats.map(tc => ({
    value: String(tc.id),
    label: tc.typeContrat,
  }))

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -20 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.5 }}
        >
          <Stack gap={4}>
            <Title order={1}>KPIs Collaborateurs</Title>
            <Text c="dimmed">Statistiques détaillées par catégorie</Text>
          </Stack>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.1 }}
        >
          <Card withBorder p="lg" radius="md">
            <Stack gap="md">
              <PeriodSelector
                periode={periode}
                date={date}
                dateDebut={dateDebut}
                dateFin={dateFin}
                onChange={(newPeriode, newDate) => {
                  setPeriode(newPeriode)
                  setDate(newDate)
                }}
                onDateRangeChange={(newDateDebut, newDateFin) => {
                  setDateDebut(newDateDebut)
                  setDateFin(newDateFin)
                }}
              />
              <Group align="flex-end" wrap="wrap">
                <MultiSelect
                  label="Types de contrats"
                  placeholder="Tous les contrats"
                  data={contratOptions}
                  value={contratFilters.map(String)}
                  onChange={(values) => setContratFilters(values.map(Number))}
                  clearable
                  searchable
                  style={{ minWidth: 260 }}
                />
                <Switch
                  label="Inclure inactifs"
                  checked={includeInactifs}
                  onChange={(e) => setIncludeInactifs(e.currentTarget.checked)}
                />
                {detailedData?.collaborateurs && (
                  <Badge variant="light" color="blue">
                    {includeInactifs
                      ? `${detailedData.collaborateurs.formes} formés`
                      : `${detailedData.collaborateurs.formesActifs} actifs`}
                  </Badge>
                )}
                {detailedData && (
                  <Badge variant="light" color="grape">
                    {detailedData.periode.libelle}
                  </Badge>
                )}
              </Group>
            </Stack>
          </Card>
        </motion.div>

        {detailedLoading ? (
          <Card withBorder p="lg" radius="md">
            <Center mih={200}>
              <Stack align="center" gap="md">
                <Loader />
                <Text c="dimmed">Chargement des statistiques détaillées...</Text>
              </Stack>
            </Center>
          </Card>
        ) : detailedData ? (
          <>
            {detailedData.collaborateurs && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.25 }}
              >
                <Card withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <ThemeIcon color="violet" variant="light">
                        <UserSwitch size={20} weight="bold" />
                      </ThemeIcon>
                      <Title order={3}>Statut de formation des collaborateurs</Title>
                    </Group>
                    <Table striped withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th></Table.Th>
                          <Table.Th>Formés</Table.Th>
                          <Table.Th>Non formés</Table.Th>
                          <Table.Th>Total</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td fw={600}>Actifs</Table.Td>
                          <Table.Td>{detailedData.collaborateurs.formesActifs}</Table.Td>
                          <Table.Td>{detailedData.collaborateurs.nonFormesActifs}</Table.Td>
                          <Table.Td>{detailedData.collaborateurs.formesActifs + detailedData.collaborateurs.nonFormesActifs}</Table.Td>
                        </Table.Tr>
                        {includeInactifs && (
                          <Table.Tr>
                            <Table.Td fw={600}>Inactifs</Table.Td>
                            <Table.Td>{detailedData.collaborateurs.formesInactifs}</Table.Td>
                            <Table.Td>{detailedData.collaborateurs.nonFormesInactifs}</Table.Td>
                            <Table.Td>{detailedData.collaborateurs.formesInactifs + detailedData.collaborateurs.nonFormesInactifs}</Table.Td>
                          </Table.Tr>
                        )}
                        <Table.Tr>
                          <Table.Td fw={700}>Total</Table.Td>
                          <Table.Td fw={700}>{includeInactifs ? detailedData.collaborateurs.formes : detailedData.collaborateurs.formesActifs}</Table.Td>
                          <Table.Td fw={700}>{includeInactifs ? detailedData.collaborateurs.nonFormes : detailedData.collaborateurs.nonFormesActifs}</Table.Td>
                          <Table.Td fw={700}>{includeInactifs ? detailedData.collaborateurs.total : (detailedData.collaborateurs.formesActifs + detailedData.collaborateurs.nonFormesActifs)}</Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </Stack>
                </Card>
              </motion.div>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <HeroCard
                label="Heures - Hommes"
                value={detailedData.parGenre.homme.heures}
                suffix="h"
                meta={`${detailedData.parGenre.homme.formations} formations • ${detailedData.parGenre.homme.moyenne}h/personne`}
                icon={GenderMale}
                variant="blue"
                delay={0.2}
              />
              <HeroCard
                label="Heures - Femmes"
                value={detailedData.parGenre.femme.heures}
                suffix="h"
                meta={`${detailedData.parGenre.femme.formations} formations • ${detailedData.parGenre.femme.moyenne}h/personne`}
                icon={GenderFemale}
                variant="pink"
                delay={0.3}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              <GlassCard
                label="Directeurs"
                value={detailedData.parRole.directeur.heures}
                suffix="h"
                meta={`${detailedData.parRole.directeur.formations} formations • ${detailedData.parRole.directeur.moyenne}h/pers`}
                icon={Crown}
                iconVariant="violet"
                delay={0.4}
              />
              <GlassCard
                label="Managers"
                value={detailedData.parRole.manager.heures}
                suffix="h"
                meta={`${detailedData.parRole.manager.formations} formations • ${detailedData.parRole.manager.moyenne}h/pers`}
                icon={UsersFour}
                iconVariant="teal"
                delay={0.5}
              />
              <GlassCard
                label="Non-managers"
                value={detailedData.parRole.nonManager.heures}
                suffix="h"
                meta={`${detailedData.parRole.nonManager.formations} formations • ${detailedData.parRole.nonManager.moyenne}h/pers`}
                icon={Users}
                iconVariant="gray"
                delay={0.6}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, x: -20 }}
                animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.5 }}
              >
                <Card withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <ThemeIcon color="blue" variant="light"><GenderMale size={18} weight="bold" /></ThemeIcon>
                      <ThemeIcon color="pink" variant="light"><GenderFemale size={18} weight="bold" /></ThemeIcon>
                      <Title order={3}>Par genre</Title>
                    </Group>
                    <Table striped withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Catégorie</Table.Th>
                          <Table.Th>Collab.</Table.Th>
                          <Table.Th>Formations</Table.Th>
                          <Table.Th>Heures</Table.Th>
                          <Table.Th>Moyenne</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td><Badge color="blue" variant="light">Homme</Badge></Table.Td>
                          <Table.Td>{detailedData.parGenre.homme.nombre}</Table.Td>
                          <Table.Td>{detailedData.parGenre.homme.formations}</Table.Td>
                          <Table.Td>{detailedData.parGenre.homme.heures}h</Table.Td>
                          <Table.Td fw={700}>{detailedData.parGenre.homme.moyenne}h</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td><Badge color="pink" variant="light">Femme</Badge></Table.Td>
                          <Table.Td>{detailedData.parGenre.femme.nombre}</Table.Td>
                          <Table.Td>{detailedData.parGenre.femme.formations}</Table.Td>
                          <Table.Td>{detailedData.parGenre.femme.heures}h</Table.Td>
                          <Table.Td fw={700}>{detailedData.parGenre.femme.moyenne}h</Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </Stack>
                </Card>
              </motion.div>

              <motion.div
                initial={reducedMotion ? false : { opacity: 0, x: 20 }}
                animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.6 }}
              >
                <Card withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <ThemeIcon color="violet" variant="light"><UserCircle size={18} weight="bold" /></ThemeIcon>
                      <Title order={3}>Par rôle</Title>
                    </Group>
                    <Table striped withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Catégorie</Table.Th>
                          <Table.Th>Collab.</Table.Th>
                          <Table.Th>Formations</Table.Th>
                          <Table.Th>Heures</Table.Th>
                          <Table.Th>Moyenne</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td><Badge color="violet" variant="light">Directeur</Badge></Table.Td>
                          <Table.Td>{detailedData.parRole.directeur.nombre}</Table.Td>
                          <Table.Td>{detailedData.parRole.directeur.formations}</Table.Td>
                          <Table.Td>{detailedData.parRole.directeur.heures}h</Table.Td>
                          <Table.Td fw={700}>{detailedData.parRole.directeur.moyenne}h</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td><Badge color="teal" variant="light">Manager</Badge></Table.Td>
                          <Table.Td>{detailedData.parRole.manager.nombre}</Table.Td>
                          <Table.Td>{detailedData.parRole.manager.formations}</Table.Td>
                          <Table.Td>{detailedData.parRole.manager.heures}h</Table.Td>
                          <Table.Td fw={700}>{detailedData.parRole.manager.moyenne}h</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td><Badge color="gray" variant="light">Non-manager</Badge></Table.Td>
                          <Table.Td>{detailedData.parRole.nonManager.nombre}</Table.Td>
                          <Table.Td>{detailedData.parRole.nonManager.formations}</Table.Td>
                          <Table.Td>{detailedData.parRole.nonManager.heures}h</Table.Td>
                          <Table.Td fw={700}>{detailedData.parRole.nonManager.moyenne}h</Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </Stack>
                </Card>
              </motion.div>
            </SimpleGrid>

            {detailedData.parRoleGenre && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <Card withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <ThemeIcon color="violet" variant="light"><Users size={18} weight="bold" /></ThemeIcon>
                      <Title order={3}>Répartition Rôle × Genre</Title>
                    </Group>
                    <Table striped withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th rowSpan={2}>Rôle</Table.Th>
                          <Table.Th colSpan={3}><Group gap={4}><GenderMale size={14} weight="bold" /> Hommes</Group></Table.Th>
                          <Table.Th colSpan={3}><Group gap={4}><GenderFemale size={14} weight="bold" /> Femmes</Group></Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Th>Nb</Table.Th>
                          <Table.Th>Form.</Table.Th>
                          <Table.Th>Heures</Table.Th>
                          <Table.Th>Nb</Table.Th>
                          <Table.Th>Form.</Table.Th>
                          <Table.Th>Heures</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td><Badge color="violet" variant="light">Directeur</Badge></Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.directeur.homme.nombre}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.directeur.homme.formations}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.directeur.homme.heures}h</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.directeur.femme.nombre}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.directeur.femme.formations}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.directeur.femme.heures}h</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td><Badge color="teal" variant="light">Manager</Badge></Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.manager.homme.nombre}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.manager.homme.formations}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.manager.homme.heures}h</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.manager.femme.nombre}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.manager.femme.formations}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.manager.femme.heures}h</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td><Badge color="gray" variant="light">Non-manager</Badge></Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.nonManager.homme.nombre}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.nonManager.homme.formations}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.nonManager.homme.heures}h</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.nonManager.femme.nombre}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.nonManager.femme.formations}</Table.Td>
                          <Table.Td>{detailedData.parRoleGenre.nonManager.femme.heures}h</Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </Stack>
                </Card>
              </motion.div>
            )}

            {detailedData.parDepartement && detailedData.parDepartement.length > 0 && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.8 }}
              >
                <Card withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <ThemeIcon color="teal" variant="light"><Buildings size={18} weight="bold" /></ThemeIcon>
                      <Title order={3}>Par département</Title>
                    </Group>
                    <Stack gap="sm">
                      {detailedData.parDepartement.map((dept) => (
                        <Paper key={dept.id} withBorder p="md" radius="md">
                          <Group justify="space-between">
                            <Text fw={600}>{dept.nom}</Text>
                            <Group gap="md">
                              <Text size="sm" c="dimmed">{dept.stats.nombre} pers.</Text>
                              <Text size="sm" c="dimmed">{dept.stats.formations} form.</Text>
                              <Text size="sm" fw={600}>{dept.stats.heures}h</Text>
                            </Group>
                          </Group>
                          {dept.sousEquipes && dept.sousEquipes.length > 0 && (
                            <Stack gap={4} mt="sm" pl="md">
                              {dept.sousEquipes.map((sub) => (
                                <Group key={sub.id} justify="space-between">
                                  <Text size="sm">↳ {sub.nom}</Text>
                                  <Group gap="md">
                                    <Text size="xs" c="dimmed">{sub.stats.nombre} pers.</Text>
                                    <Text size="xs" c="dimmed">{sub.stats.formations} form.</Text>
                                    <Text size="xs">{sub.stats.heures}h</Text>
                                  </Group>
                                </Group>
                              ))}
                            </Stack>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              </motion.div>
            )}

          </>
        ) : null}

        <Divider
          my="md"
          label={
            <Group gap="xs">
              <ChartBar size={18} weight="bold" />
              <Text fw={600}>Vue d'ensemble générale</Text>
            </Group>
          }
          labelPosition="center"
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <GlassCard
            label="Total Collaborateurs"
            value={data.summary.totalCollaborateurs}
            meta={`${data.summary.collaborateursActifs} actifs`}
            icon={Users}
            iconVariant="blue"
            delay={0.7}
          />
          <GlassCard
            label="Sans formation"
            value={data.summary.collaborateursSansFormation}
            meta="À former en priorité"
            icon={Warning}
            iconVariant="orange"
            delay={0.8}
          />
        </SimpleGrid>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
        >
          <Card withBorder p="lg" radius="md">
            <Stack gap="md">
              <Group gap="xs">
                <ThemeIcon color="teal" variant="light"><Briefcase size={18} weight="bold" /></ThemeIcon>
                <Title order={3}>Types de contrat</Title>
              </Group>
              <Stack gap="md">
                {data.repartitionContrat.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                  >
                    <Stack gap={4}>
                      <Group justify="space-between">
                        <Group gap="xs">
                          <Handshake size={16} />
                          <Text>{item.type}</Text>
                        </Group>
                        <Text fw={600}>{item.nombre}</Text>
                      </Group>
                      <Progress value={item.pourcentage} />
                    </Stack>
                  </motion.div>
                ))}
              </Stack>
            </Stack>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          <Card withBorder p="lg" radius="md">
            <Stack gap="md">
              <Group gap="xs">
                <ThemeIcon color="yellow" variant="light"><Trophy size={20} weight="fill" /></ThemeIcon>
                <Title order={3}>Top 10 des participants</Title>
              </Group>
              <Stack gap="sm">
                {data.topParticipants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.3 + index * 0.05 }}
                  >
                    <Paper withBorder p="sm" radius="md">
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap">
                          {index < 3 ? (
                            <Badge color={getRankColor(index)} variant="filled">#{index + 1}</Badge>
                          ) : (
                            <Badge color="blue" variant="light">#{index + 1}</Badge>
                          )}
                          {index < 3 && (
                            <ThemeIcon color={getRankColor(index)} variant="light" size="sm">
                              <Trophy size={14} weight="fill" />
                            </ThemeIcon>
                          )}
                          <Text fw={600}>{participant.nom}</Text>
                        </Group>
                        <Group gap="lg" wrap="nowrap">
                          <Text size="sm" c="dimmed">{participant.departement}</Text>
                          <Text size="sm">
                            <Text span fw={700}>{participant.nombreFormations}</Text> formations
                          </Text>
                          <Text size="sm" fw={600}>{participant.heuresTotal}h</Text>
                        </Group>
                      </Group>
                    </Paper>
                  </motion.div>
                ))}
              </Stack>
            </Stack>
          </Card>
        </motion.div>
      </Stack>
    </Container>
  )
}
