'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Text,
  Badge,
  RingProgress,
  Tooltip,
  MultiSelect,
  Chip,
  Switch,
  SegmentedControl,
  Tabs,
  Progress,
  Button,
  Stack,
  Alert,
  Divider,
  Paper,
  Group,
  Container,
  Card,
  Title,
  SimpleGrid,
  ThemeIcon,
  Loader,
  Center,
  ColorSwatch,
  Box,
} from '@mantine/core'
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { Lightbulb } from '@phosphor-icons/react/dist/ssr/Lightbulb';
import { TrendUp } from '@phosphor-icons/react/dist/ssr/TrendUp';
import { Fire } from '@phosphor-icons/react/dist/ssr/Fire';
import { Funnel } from '@phosphor-icons/react/dist/ssr/Funnel';
import { UsersFour } from '@phosphor-icons/react/dist/ssr/UsersFour';
import { ChartLine } from '@phosphor-icons/react/dist/ssr/ChartLine';
import { ListBullets } from '@phosphor-icons/react/dist/ssr/ListBullets';
import { UserMinus } from '@phosphor-icons/react/dist/ssr/UserMinus';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { PeriodSelector } from '@/components/PeriodSelector'
import { motion } from 'framer-motion'
import { useReducedMotionPreference } from '@/lib/hooks/useReducedMotionPreference'
import axios from 'axios'
import dynamic from 'next/dynamic'
const LazyTauxFormationContratGraphique = dynamic(
  () => import('@/components/charts/TauxFormationContratGraphique').then(mod => mod.TauxFormationContratGraphique),
  { ssr: false, loading: () => <Center h={400}><Loader /></Center> }
)
import { statsService } from '@/lib/services'
import { DetailedKPIsResponse } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Interface pour le taux de formation par contrat
interface TauxFormationContrat {
  annees: number[]
  typesContrat: Array<{ id: number; nom: string }>
  parContrat: Array<{
    typeContrat: string
    contratId: number
    annees: {
      [annee: number]: {
        effectif: number
        formes: number
        tauxFormation: number
      }
    }
  }>
  totauxParAnnee: {
    [annee: number]: {
      effectif: number
      formes: number
      tauxFormation: number
    }
  }
  meta: {
    includeInactifs: boolean
    inactifsSansDate: number
    nombreContrats: number
    periodeAnalysee: string
  }
}

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
  topFormations: Array<{
    id: string
    code: string
    nom: string
    categorie: string
    sessions: number
    heuresTotal: number
    participants?: number
  }>
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
}

const numberVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  }
}

// Animated counter hook
function useAnimatedCounter(end: number) {
  return end
}

// Standard KPI Card
function KPICard({
  title,
  value,
  suffix = '',
  subtitle,
  icon,
  color = 'orange',
  delay = 0
}: {
  title: string
  value: number
  suffix?: string
  subtitle?: string
  icon: React.ReactNode
  color?: string
  delay?: number
}) {
  const animatedValue = useAnimatedCounter(value)

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ delay }}
    >
      <Card withBorder padding="lg" radius="md" h="100%">
        <Group justify="space-between" mb="sm">
          <Text size="sm" fw={500}>{title}</Text>
          <ThemeIcon variant="light" color={color} size="lg" radius="md">
            {icon}
          </ThemeIcon>
        </Group>

        <motion.div variants={numberVariants}>
          <Group gap={4} align="baseline">
            <Text size="xl" fw={700}>{animatedValue.toLocaleString('fr-FR')}</Text>
            {suffix && <Text size="md" c="dimmed">{suffix}</Text>}
          </Group>
        </motion.div>

        {subtitle && (
          <Text size="sm" c="dimmed" mt={4}>{subtitle}</Text>
        )}
      </Card>
    </motion.div>
  )
}

// Top Formation Row with animated progress
function TopFormationRow({
  formation,
  index,
  maxParticipants
}: {
  formation: FormationsKPIs['topFormations'][0]
  index: number
  maxParticipants: number
}) {
  const participants = formation.participants || 0
  const percentage = maxParticipants > 0 ? (participants / maxParticipants) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.1, type: 'spring', stiffness: 100 }}
    >
      <Paper withBorder p="md" radius="md">
        <Group align="flex-start" wrap="nowrap">
          <ThemeIcon
            variant={index < 3 ? 'filled' : 'light'}
            color={index < 3 ? 'orange' : 'gray'}
            size="lg"
            radius="md"
          >
            {index < 3 ? (
              <Fire size={20} weight="fill" />
            ) : (
              <Text size="sm" fw={700}>{String(index + 1).padStart(2, '0')}</Text>
            )}
          </ThemeIcon>

          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" wrap="nowrap">
              <Tooltip label={formation.nom} position="top" withArrow>
                <Text fw={600} truncate>{formation.nom}</Text>
              </Tooltip>
              <Badge
                variant="light"
                color={index < 3 ? 'orange' : 'gray'}
                size="sm"
              >
                {formation.categorie}
              </Badge>
            </Group>

            <Progress value={percentage} color="orange" size="sm" radius="xl" />

            <Group justify="space-between">
              <Text size="xs" c="dimmed">{formation.sessions} sessions</Text>
              <Group gap={4}>
                <Users size={14} weight="bold" />
                <Text size="xs">{participants}</Text>
              </Group>
            </Group>
          </Stack>
        </Group>
      </Paper>
    </motion.div>
  )
}

// Couleurs pour les types de contrat
const CONTRACT_COLORS: { [key: string]: string } = {
  'CDI': '#10b981',
  'CDD': '#0ea5e9',
  'Alternant': '#8b5cf6',
  'Stagiaire': '#f59e0b',
  'Interim': '#ec4899',
  'Prestataire': '#14b8a6',
  'default': '#6b7280'
}

function getContractColor(type: string): string {
  return CONTRACT_COLORS[type] || CONTRACT_COLORS['default']
}

// Composant pour le graphique de taux de formation par contrat
function TauxFormationContratChart({
  data,
  selectedContrats,
  selectedAnnee
}: {
  data: TauxFormationContrat
  selectedContrats: string[]
  selectedAnnee: number | 'all'
}) {
  const contratsAffiches = data.parContrat.filter(c =>
    selectedContrats.length === 0 || selectedContrats.includes(c.contratId.toString())
  )

  if (selectedAnnee !== 'all') {
    return (
      <Stack gap="md">
        {contratsAffiches.map((contrat, index) => {
          const stats = contrat.annees[selectedAnnee]
          if (!stats || stats.effectif === 0) return null

          return (
            <motion.div
              key={contrat.contratId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Group gap="md" wrap="nowrap">
                <Group gap="xs" style={{ minWidth: 200 }}>
                  <ColorSwatch color={getContractColor(contrat.typeContrat)} size={12} />
                  <Text size="sm" fw={500}>{contrat.typeContrat}</Text>
                  <Text size="xs" c="dimmed">{stats.formes}/{stats.effectif}</Text>
                </Group>
                <Box style={{ flex: 1 }}>
                  <Progress
                    value={stats.tauxFormation}
                    color={getContractColor(contrat.typeContrat)}
                    size="lg"
                    radius="xl"
                  />
                </Box>
                <Text size="sm" fw={600} style={{ minWidth: 50, textAlign: 'right' }}>
                  {stats.tauxFormation}%
                </Text>
              </Group>
            </motion.div>
          )
        })}

        {data.totauxParAnnee[selectedAnnee] && (
          <>
            <Divider />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: contratsAffiches.length * 0.1 }}
            >
              <Group gap="md" wrap="nowrap">
                <Group gap="xs" style={{ minWidth: 200 }}>
                  <Text size="sm" fw={700}>Total</Text>
                  <Text size="xs" c="dimmed">
                    {data.totauxParAnnee[selectedAnnee].formes}/{data.totauxParAnnee[selectedAnnee].effectif}
                  </Text>
                </Group>
                <Box style={{ flex: 1 }}>
                  <Progress
                    value={data.totauxParAnnee[selectedAnnee].tauxFormation}
                    color="orange"
                    size="lg"
                    radius="xl"
                  />
                </Box>
                <Text size="sm" fw={700} style={{ minWidth: 50, textAlign: 'right' }}>
                  {data.totauxParAnnee[selectedAnnee].tauxFormation}%
                </Text>
              </Group>
            </motion.div>
          </>
        )}
      </Stack>
    )
  }

  // Vue multi-années (comparaison)
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {contratsAffiches.map((contrat, contratIndex) => (
        <motion.div
          key={contrat.contratId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: contratIndex * 0.15 }}
        >
          <Paper withBorder p="md" radius="md">
            <Group gap="xs" mb="sm">
              <ColorSwatch color={getContractColor(contrat.typeContrat)} size={12} />
              <Text size="sm" fw={600}>{contrat.typeContrat}</Text>
            </Group>
            <Stack gap="xs">
              {data.annees.map((annee, anneeIndex) => {
                const stats = contrat.annees[annee]
                if (!stats) return null

                return (
                  <Tooltip
                    key={annee}
                    label={`${annee}: ${stats.formes}/${stats.effectif} formes (${stats.tauxFormation}%)`}
                    withArrow
                  >
                    <Group gap="sm" wrap="nowrap">
                      <Text size="xs" c="dimmed" style={{ minWidth: 40 }}>{annee}</Text>
                      <Box style={{ flex: 1 }}>
                        <Progress
                          value={stats.tauxFormation}
                          color={getContractColor(contrat.typeContrat)}
                          size="md"
                          radius="xl"
                        />
                      </Box>
                      <Text size="xs" fw={600} style={{ minWidth: 40, textAlign: 'right' }}>
                        {stats.tauxFormation}%
                      </Text>
                    </Group>
                  </Tooltip>
                )
              })}
            </Stack>
          </Paper>
        </motion.div>
      ))}
    </SimpleGrid>
  )
}

export default function FormationsKPIsPage() {
  const reducedMotion = useReducedMotionPreference()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<FormationsKPIs | null>(null)
  const [loading, setLoading] = useState(true)

  // Tab state - read from URL parameter
  const [activeTab, setActiveTab] = useState<string>('overview')

  // Period selector state
  const [periode, setPeriode] = useState<'annee' | 'mois' | 'plage'>('annee')
  const [date, setDate] = useState<string>(new Date().getFullYear().toString())
  const [dateDebut, setDateDebut] = useState<Date | null>(null)
  const [dateFin, setDateFin] = useState<Date | null>(null)

  // États pour le taux de formation par contrat
  const [tauxContratData, setTauxContratData] = useState<TauxFormationContrat | null>(null)
  const [tauxContratLoading, setTauxContratLoading] = useState(true)
  const [selectedContrats, setSelectedContrats] = useState<string[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | 'all'>('all')
  const [includeInactifs, setIncludeInactifs] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list')

  // États pour l'onglet Heures & activité (KPIs détaillés)
  const [detailedData, setDetailedData] = useState<DetailedKPIsResponse | null>(null)
  const [detailedLoading, setDetailedLoading] = useState(false)

  // Read tab from URL parameter.
  // Le suivi des formations obligatoires a été consolidé sur /kpi/conformite :
  // les anciens liens ?tab=obligatoires y sont redirigés.
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'obligatoires') {
      router.replace('/kpi/conformite')
    } else if (tab === 'activite') {
      setActiveTab('activite')
    }
  }, [searchParams, router])

  // Update URL when tab changes
  const handleTabChange = (value: string | null) => {
    if (!value) return
    setActiveTab(value)
    if (value === 'activite') {
      router.push('/kpi/formations?tab=activite', { scroll: false })
    } else {
      router.push('/kpi/formations', { scroll: false })
    }
  }

  useEffect(() => {
    fetchData()
  }, [periode, date, dateDebut, dateFin])

  // Recharger les données quand includeInactifs change
  useEffect(() => {
    fetchTauxContratData()
  }, [includeInactifs])

  // Charger les KPIs détaillés quand l'onglet Heures & activité est sélectionné
  useEffect(() => {
    if (activeTab === 'activite') {
      fetchDetailedData()
    }
  }, [activeTab, periode, date, dateDebut, dateFin])

  const fetchDetailedData = async () => {
    if (periode === 'plage' && (!dateDebut || !dateFin)) {
      return
    }
    setDetailedLoading(true)
    try {
      const startDate = dateDebut ? dateDebut.toISOString() : undefined
      const endDate = dateFin ? dateFin.toISOString() : undefined
      const response = await statsService.getCollaborateursDetailedKpis(periode, date, startDate, endDate)
      setDetailedData(response)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs détaillés:', error)
    } finally {
      setDetailedLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      params.append('periode', periode)
      params.append('date', date)
      if (periode === 'plage' && dateDebut && dateFin) {
        params.append('startDate', dateDebut.toISOString().split('T')[0])
        params.append('endDate', dateFin.toISOString().split('T')[0])
      }
      const response = await axios.get(`${API_URL}/stats/formations-kpis?${params.toString()}`)
      setData(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs formations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTauxContratData = async () => {
    setTauxContratLoading(true)
    try {
      const params = new URLSearchParams()
      if (includeInactifs) {
        params.append('includeInactifs', 'true')
      }
      const response = await axios.get(`${API_URL}/stats/taux-formation-contrat?${params.toString()}`)
      setTauxContratData(response.data)
      // Sélectionner l'année la plus récente par défaut (seulement si pas déjà défini)
      if (response.data.annees?.length > 0 && selectedAnnee === 'all') {
        setSelectedAnnee(response.data.annees[response.data.annees.length - 1])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des taux par contrat:', error)
    } finally {
      setTauxContratLoading(false)
    }
  }

  if (loading) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Chargement des indicateurs...</Text>
        </Stack>
      </Center>
    )
  }

  if (!data) {
    return (
      <Container size="xl" py="md">
        <Center h="60vh">
          <Stack align="center" gap="md">
            <ThemeIcon color="red" size="xl" radius="xl">
              <WarningCircle size={28} weight="bold" />
            </ThemeIcon>
            <Title order={2}>Erreur de chargement</Title>
            <Text c="dimmed">Impossible de recuperer les donnees</Text>
            <Button onClick={fetchData}>Reessayer</Button>
          </Stack>
        </Center>
      </Container>
    )
  }

  // Calculate derived metrics
  const tauxUtilisation = data.summary.formationsAvecSessions > 0
    ? Math.round((data.summary.formationsAvecSessions / data.summary.totalFormations) * 100)
    : 0
  const maxParticipants = Math.max(...(data.topFormations.map(f => f.participants || 0)), 1)

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -30 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.6, type: 'spring' }}
        >
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Stack gap={4}>
              <Title order={1}>KPIs Formations</Title>
              <Text c="dimmed">Vue d'ensemble des indicateurs cles de performance</Text>
            </Stack>
            <PeriodSelector
              periode={periode}
              date={date}
              dateDebut={dateDebut}
              dateFin={dateFin}
              onChange={(p, d) => { setPeriode(p); setDate(d); }}
              onDateRangeChange={(debut, fin) => { setDateDebut(debut); setDateFin(fin); }}
            />
          </Group>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -10 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { delay: 0.65 }}
        >
          <Tabs value={activeTab} onChange={handleTabChange} variant="pills" color="orange">
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<ChartBar size={16} weight="bold" />}>
                Vue d'ensemble
              </Tabs.Tab>
              <Tabs.Tab value="activite" leftSection={<Clock size={16} weight="bold" />}>
                Heures &amp; activité
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </motion.div>

        {/* Tab Content: Overview */}
        {activeTab === 'overview' && (
          <>
            {/* KPIs */}
            <motion.div
              variants={containerVariants}
              initial={reducedMotion ? false : 'hidden'}
              animate={reducedMotion ? undefined : 'visible'}
            >
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                <KPICard
                  title="Formations actives"
                  value={data.summary.formationsActives}
                  subtitle={`sur ${data.summary.totalFormations} au total`}
                  icon={<BookOpen size={22} weight="bold" />}
                  color="green"
                />
                <KPICard
                  title="Duree moyenne"
                  value={data.summary.dureeMoyenne}
                  suffix="h"
                  subtitle="Par formation"
                  icon={<ChartBar size={22} weight="bold" />}
                  color="violet"
                />
                <KPICard
                  title="Nouvelles"
                  value={data.summary.nouvellesFormations}
                  subtitle="Ces 30 derniers jours"
                  icon={<TrendUp size={22} weight="bold" />}
                  color="cyan"
                />
              </SimpleGrid>
            </motion.div>

            {/* Utilization Ring */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={reducedMotion ? { duration: 0 } : { delay: 0.6 }}
            >
              <Card withBorder padding="lg" radius="md">
                <Stack gap="sm">
                  <Title order={3}>Taux d'utilisation</Title>
                  <Text size="sm" c="dimmed">Formations avec au moins une session</Text>

                  <Center>
                    <RingProgress
                      size={180}
                      thickness={14}
                      roundCaps
                      sections={[{ value: tauxUtilisation, color: 'orange' }]}
                      label={
                        <Stack gap={0} align="center">
                          <Text size="2rem" fw={800}>{tauxUtilisation}</Text>
                          <Text size="sm" c="dimmed">%</Text>
                        </Stack>
                      }
                    />
                  </Center>

                  <Group justify="center" gap="xl">
                    <Stack gap={0} align="center">
                      <Text size="xl" fw={700}>{data.summary.formationsAvecSessions}</Text>
                      <Text size="xs" c="dimmed">Utilisees</Text>
                    </Stack>
                    <Divider orientation="vertical" />
                    <Stack gap={0} align="center">
                      <Text size="xl" fw={700}>{data.summary.formationsOrphelines}</Text>
                      <Text size="xs" c="dimmed">Inactives</Text>
                    </Stack>
                  </Group>
                </Stack>
              </Card>
            </motion.div>

            {/* Taux de Formation par Type de Contrat */}
            {(tauxContratData || tauxContratLoading) && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 30 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : { delay: 0.75 }}
              >
                <Card withBorder padding="lg" radius="md" pos="relative">
                  {tauxContratLoading && (
                    <Center py="xl">
                      <Stack align="center" gap="sm">
                        <Loader />
                        <Text size="sm" c="dimmed">Chargement des donnees...</Text>
                      </Stack>
                    </Center>
                  )}

                  <Stack gap="md">
                    <Group gap="sm">
                      <UsersFour size={24} weight="bold" />
                      <Stack gap={0}>
                        <Title order={3}>Taux de formation par type de contrat</Title>
                        <Text size="sm" c="dimmed">
                          Pourcentage d'effectif forme par type de contrat et par annee
                        </Text>
                      </Stack>
                    </Group>

                    {tauxContratData && (
                      <>
                        {/* Filtres */}
                        <Stack gap="sm">
                          {/* Ligne 1: Année et Vue */}
                          <Group justify="space-between" wrap="wrap">
                            <Group gap="xs" wrap="wrap">
                              <Text size="sm" fw={500}>Annee :</Text>
                              <Chip
                                checked={selectedAnnee === 'all'}
                                onChange={() => setSelectedAnnee('all')}
                                color="orange"
                                variant="filled"
                                size="sm"
                              >
                                Toutes
                              </Chip>
                              {tauxContratData.annees.map(annee => (
                                <Chip
                                  key={annee}
                                  checked={selectedAnnee === annee}
                                  onChange={() => setSelectedAnnee(annee)}
                                  color="orange"
                                  variant="filled"
                                  size="sm"
                                >
                                  {annee}
                                </Chip>
                              ))}
                            </Group>

                            <SegmentedControl
                              value={viewMode}
                              onChange={(value) => setViewMode(value as 'list' | 'chart')}
                              data={[
                                {
                                  value: 'list',
                                  label: (
                                    <Group gap={6}>
                                      <ListBullets size={16} weight="bold" />
                                      <span>Liste</span>
                                    </Group>
                                  )
                                },
                                {
                                  value: 'chart',
                                  label: (
                                    <Group gap={6}>
                                      <ChartLine size={16} weight="bold" />
                                      <span>Graphique</span>
                                    </Group>
                                  )
                                }
                              ]}
                              size="sm"
                              color="orange"
                            />
                          </Group>

                          {/* Ligne 2: Contrats et Inactifs */}
                          <Group justify="space-between" wrap="wrap" align="flex-end">
                            <Group gap="xs" align="flex-end" wrap="wrap">
                              <Stack gap={4}>
                                <Group gap={4}>
                                  <Funnel size={16} weight="bold" />
                                  <Text size="sm" fw={500}>Contrats :</Text>
                                </Group>
                                <MultiSelect
                                  data={tauxContratData.typesContrat.map(c => ({
                                    value: c.id.toString(),
                                    label: c.nom
                                  }))}
                                  value={selectedContrats}
                                  onChange={setSelectedContrats}
                                  placeholder="Tous les contrats"
                                  clearable
                                  searchable
                                  size="sm"
                                  w={300}
                                />
                              </Stack>
                            </Group>

                            <Switch
                              checked={includeInactifs}
                              onChange={(event) => setIncludeInactifs(event.currentTarget.checked)}
                              color="orange"
                              size="sm"
                              label={
                                <Group gap={4}>
                                  <UserMinus size={16} weight="bold" />
                                  <Text size="sm">Inclure inactifs</Text>
                                </Group>
                              }
                            />
                          </Group>
                        </Stack>

                        {/* Bandeau d'avertissement pour les inactifs sans date */}
                        {includeInactifs && tauxContratData?.meta?.inactifsSansDate > 0 && (
                          <Alert
                            color="yellow"
                            icon={<WarningCircle size={20} weight="fill" />}
                            variant="light"
                          >
                            <strong>{tauxContratData.meta.inactifsSansDate}</strong> collaborateurs inactifs
                            n'ont pas de date d'inactivation renseignee. Ils sont comptes sur toutes les annees.
                          </Alert>
                        )}

                        {/* Graphique ou Liste selon le mode */}
                        {viewMode === 'list' ? (
                          <TauxFormationContratChart
                            data={tauxContratData}
                            selectedContrats={selectedContrats}
                            selectedAnnee={selectedAnnee}
                          />
                        ) : (
                          <LazyTauxFormationContratGraphique
                            data={tauxContratData}
                            selectedContrats={selectedContrats}
                            selectedAnnee={selectedAnnee}
                            chartContainerClass=""
                          />
                        )}
                      </>
                    )}
                  </Stack>
                </Card>
              </motion.div>
            )}

            {/* Top Formations */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 30 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : { delay: 0.8 }}
            >
              <Card withBorder padding="lg" radius="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Stack gap={0}>
                      <Title order={3}>Top Formations</Title>
                      <Text size="sm" c="dimmed">Les plus suivies par vos collaborateurs</Text>
                    </Stack>
                    <Badge color="orange" variant="filled" size="lg">
                      TOP 5
                    </Badge>
                  </Group>

                  <Stack gap="sm">
                    {data.topFormations.slice(0, 5).map((formation, index) => (
                      <TopFormationRow
                        key={formation.id}
                        formation={formation}
                        index={index}
                        maxParticipants={maxParticipants}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Card>
            </motion.div>

            {/* Footer insight */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={reducedMotion ? undefined : { opacity: 1 }}
              transition={reducedMotion ? { duration: 0 } : { delay: 1.2 }}
            >
              <Alert
                color="yellow"
                icon={<Lightbulb size={20} weight="fill" />}
                variant="light"
              >
                <strong>{data.summary.nouvellesFormations}</strong> nouvelles formations ajoutees ces 30 derniers jours
              </Alert>
            </motion.div>
          </>
        )}

        {/* Tab Content: Heures & activité */}
        {activeTab === 'activite' && (
          <>
            {detailedLoading ? (
              <Card withBorder p="lg" radius="md">
                <Center mih={200}>
                  <Stack align="center" gap="md">
                    <Loader />
                    <Text c="dimmed">Chargement des heures de formation...</Text>
                  </Stack>
                </Center>
              </Card>
            ) : detailedData ? (
              <>
                {detailedData.heuresFormation && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.1 }}
                  >
                    <Card withBorder p="lg" radius="md">
                      <Stack gap="md">
                        <Group gap="xs">
                          <ThemeIcon color="blue" variant="light">
                            <Clock size={20} weight="bold" />
                          </ThemeIcon>
                          <Title order={3}>Heures de formation</Title>
                          {detailedData.periode?.libelle && (
                            <Badge variant="light" color="grape">{detailedData.periode.libelle}</Badge>
                          )}
                        </Group>
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                          <Paper withBorder p="md" radius="md">
                            <Text size="sm" c="dimmed">Heures dispensées</Text>
                            <Title order={2}>{detailedData.heuresFormation.heuresDispensees.toLocaleString('fr-FR')}h</Title>
                            <Text size="xs" c="dimmed">Sessions comptées 1 fois</Text>
                          </Paper>
                          <Paper withBorder p="md" radius="md">
                            <Text size="sm" c="dimmed">Heures cumulées</Text>
                            <Title order={2}>{detailedData.heuresFormation.heuresCumulees.toLocaleString('fr-FR')}h</Title>
                            <Text size="xs" c="dimmed">Par participant (×N pour collectives)</Text>
                          </Paper>
                        </SimpleGrid>
                        <Group gap="lg">
                          <Text size="sm" c="dimmed">Individuelles: {detailedData.heuresFormation.heuresIndividuelles.toLocaleString('fr-FR')}h</Text>
                          <Text size="sm" c="dimmed">Collectives dispensées: {detailedData.heuresFormation.heuresCollectivesDispensees.toLocaleString('fr-FR')}h</Text>
                          <Text size="sm" c="dimmed">Collectives cumulées: {detailedData.heuresFormation.heuresCollectivesCumulees.toLocaleString('fr-FR')}h</Text>
                        </Group>
                      </Stack>
                    </Card>
                  </motion.div>
                )}

                {detailedData.heuresParOrganisme && detailedData.heuresParOrganisme.length > 0 && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.2 }}
                  >
                    <Card withBorder p="lg" radius="md">
                      <Stack gap="md">
                        <Group gap="xs">
                          <ThemeIcon color="teal" variant="light">
                            <Buildings size={20} weight="bold" />
                          </ThemeIcon>
                          <Title order={3}>Heures par organisme</Title>
                        </Group>
                        <Stack gap="sm">
                          {detailedData.heuresParOrganisme.slice(0, 5).map((org, index) => (
                            <Group key={index} justify="space-between">
                              <Group gap="sm">
                                <Badge variant="light" color="teal">#{index + 1}</Badge>
                                <Text>{org.organisme}</Text>
                              </Group>
                              <Text fw={600}>{org.heuresDispensees.toLocaleString('fr-FR')}h</Text>
                            </Group>
                          ))}
                        </Stack>
                      </Stack>
                    </Card>
                  </motion.div>
                )}

                {detailedData.parCategorie && detailedData.parCategorie.length > 0 && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.3 }}
                  >
                    <Card withBorder p="lg" radius="md">
                      <Stack gap="md">
                        <Group gap="xs">
                          <ThemeIcon color="orange" variant="light"><ChartBar size={18} weight="bold" /></ThemeIcon>
                          <Title order={3}>Par catégorie de formation</Title>
                        </Group>
                        <Stack gap="md">
                          {detailedData.parCategorie.map((cat) => (
                            <Stack key={cat.id} gap={4}>
                              <Group justify="space-between">
                                <Text fw={600}>{cat.nom}</Text>
                                <Text fw={600}>{cat.stats.pourcentage}%</Text>
                              </Group>
                              <Progress value={cat.stats.pourcentage} />
                              <Group gap="md">
                                <Text size="xs" c="dimmed">{cat.stats.nombre} collaborateurs</Text>
                                <Text size="xs" c="dimmed">{cat.stats.formations} formation{cat.stats.formations > 1 ? 's' : ''}</Text>
                                <Text size="xs" fw={600}>{cat.stats.heures}h</Text>
                              </Group>
                            </Stack>
                          ))}
                        </Stack>
                      </Stack>
                    </Card>
                  </motion.div>
                )}
              </>
            ) : (
              <Alert color="red" icon={<WarningCircle size={18} />} title="Erreur">
                Impossible de charger les heures de formation
              </Alert>
            )}
          </>
        )}

      </Stack>
    </Container>
  )
}
