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
  Accordion,
  Modal,
  Button,
  Stack,
  Checkbox,
  Alert,
  Divider,
  Paper,
  Group,
  Select,
  Container,
  Card,
  Title,
  SimpleGrid,
  ThemeIcon,
  Loader,
  Center,
  Table,
  ColorSwatch,
  Box,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
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
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { UserList } from '@phosphor-icons/react/dist/ssr/UserList';
import { PeriodSelector } from '@/components/PeriodSelector'
import { motion } from 'framer-motion'
import { useReducedMotionPreference } from '@/lib/hooks/useReducedMotionPreference'
import axios from 'axios'
import dynamic from 'next/dynamic'
const LazyTauxFormationContratGraphique = dynamic(
  () => import('@/components/charts/TauxFormationContratGraphique').then(mod => mod.TauxFormationContratGraphique),
  { ssr: false, loading: () => <Center h={400}><Loader /></Center> }
)
import { statsService, notificationsService } from '@/lib/services'

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

// Interface for mandatory trainings KPIs
interface MandatoryTrainingsKPIs {
  periode: { annee: number; mois?: number; libelle: string }
  stats: {
    totalFormations: number
    totalCollaborateursAFormer: number
    totalFormes: number
    totalNonFormes: number
    tauxConformiteGlobal: number
  }
  formations: Array<{
    id: number
    codeFormation: string
    nomFormation: string
    categorie: string
    collaborateursFormes: number
    collaborateursNonFormes: number
    tauxConformite: number
    formes: Array<{ id: number; nomComplet: string; departement: string; dateFormation: string }>
    nonFormes: Array<{ id: number; nomComplet: string; departement: string }>
  }>
  parDepartement: Array<{
    departementId: number
    departement: string
    totalCollaborateurs: number
    formes: number
    nonFormes: number
    tauxConformite: number
  }>
}

// Interface for mandatory trainings by manager
interface MandatoryByManagerResponse {
  periode: { annee: number; mois?: number; libelle: string }
  stats: {
    totalDepartements: number
    totalManagers: number
    totalCollaborateursNonFormes: number
  }
  departements: Array<{
    id: number
    nom: string
    totalNonFormes: number
    managers: Array<{
      id: number
      nomComplet: string
      totalSubordonnes: number
      collaborateursNonFormes: Array<{
        id: number
        nomComplet: string
        formationsManquantes: Array<{ id: number; nomFormation: string }>
      }>
    }>
  }>
  sansManager: Array<{
    id: number
    nomComplet: string
    departement: string
    formationsManquantes: Array<{ id: number; nomFormation: string }>
  }>
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

  // États pour les formations obligatoires
  const [mandatoryData, setMandatoryData] = useState<MandatoryTrainingsKPIs | null>(null)
  const [mandatoryLoading, setMandatoryLoading] = useState(false)
  const [selectedFormation, setSelectedFormation] = useState<MandatoryTrainingsKPIs['formations'][0] | null>(null)
  const [modalTab, setModalTab] = useState<'formes' | 'nonFormes'>('nonFormes')

  // États pour la vue par manager
  const [byManagerData, setByManagerData] = useState<MandatoryByManagerResponse | null>(null)
  const [byManagerLoading, setByManagerLoading] = useState(false)
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [selectedManagers, setSelectedManagers] = useState<number[]>([])
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; connectionValid: boolean; message: string } | null>(null)
  const [sendingReminders, setSendingReminders] = useState(false)

  // Read tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'obligatoires') {
      setActiveTab('obligatoires')
    }
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (value: string | null) => {
    if (!value) return
    setActiveTab(value)
    if (value === 'obligatoires') {
      router.push('/kpi/formations?tab=obligatoires', { scroll: false })
    } else {
      router.push('/kpi/formations', { scroll: false })
    }
  }

  // Check email status on component mount
  useEffect(() => {
    const checkEmail = async () => {
      try {
        const status = await statsService.checkEmailStatus()
        setEmailStatus(status)
      } catch (error) {
        console.error('Erreur lors de la verification du statut email:', error)
        setEmailStatus({ configured: false, connectionValid: false, message: 'Impossible de verifier le statut' })
      }
    }
    checkEmail()
  }, [])

  // Load mandatory trainings data when tab is selected
  useEffect(() => {
    if (activeTab === 'obligatoires') {
      fetchMandatoryData()
    }
  }, [activeTab, periode, date, dateDebut, dateFin])

  const fetchMandatoryData = async () => {
    setMandatoryLoading(true)
    setByManagerLoading(true)
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined

      // Charger les données principales (obligatoire)
      const mandatoryResponse = await statsService.getMandatoryTrainingsKPIs(periode, date, startDateStr, endDateStr)
      setMandatoryData(mandatoryResponse)
      setMandatoryLoading(false)

      // Charger les données par manager (optionnel - ne bloque pas l'affichage principal)
      try {
        const byManagerResponse = await statsService.getMandatoryTrainingsByManager(
          periode,
          date,
          startDateStr,
          endDateStr,
          selectedDept ? parseInt(selectedDept) : undefined
        )
        setByManagerData(byManagerResponse)
      } catch (managerError) {
        console.error('Erreur lors du chargement des données par manager:', managerError)
        setByManagerData(null)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations obligatoires:', error)
    } finally {
      setMandatoryLoading(false)
      setByManagerLoading(false)
    }
  }

  // Recharger les données par manager quand le filtre département change
  useEffect(() => {
    if (activeTab === 'obligatoires' && mandatoryData) {
      fetchByManagerData()
    }
  }, [selectedDept])

  const fetchByManagerData = async () => {
    setByManagerLoading(true)
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined

      const response = await statsService.getMandatoryTrainingsByManager(
        periode,
        date,
        startDateStr,
        endDateStr,
        selectedDept ? parseInt(selectedDept) : undefined
      )
      setByManagerData(response)
      // Reset selection quand on change de filtre
      setSelectedManagers([])
    } catch (error) {
      console.error('Erreur lors du chargement des données par manager:', error)
    } finally {
      setByManagerLoading(false)
    }
  }

  // Toggle selection d'un manager
  const toggleManager = (managerId: number) => {
    setSelectedManagers(prev =>
      prev.includes(managerId)
        ? prev.filter(id => id !== managerId)
        : [...prev, managerId]
    )
  }

  // Sélectionner/désélectionner tous les managers
  const toggleSelectAllManagers = () => {
    if (!byManagerData) return
    const allManagerIds = byManagerData.departements.flatMap(d => d.managers.map(m => m.id))
    if (selectedManagers.length === allManagerIds.length) {
      setSelectedManagers([])
    } else {
      setSelectedManagers(allManagerIds)
    }
  }

  // État pour le statut SMTP
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; connectionValid: boolean; message: string } | null>(null)
  const [smtpLoading, setSmtpLoading] = useState(false)

  // Vérifier le statut SMTP
  const handleCheckSmtp = async () => {
    setSmtpLoading(true)
    try {
      const status = await notificationsService.checkEmailStatus()
      setSmtpStatus(status)
      notifications.show({
        title: status.configured ? 'SMTP configuré' : 'SMTP non configuré',
        message: status.message,
        color: status.connectionValid ? 'green' : status.configured ? 'orange' : 'red',
        icon: status.connectionValid ? <CheckCircle size={20} weight="fill" /> : <WarningCircle size={20} weight="fill" />
      })
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de vérifier le statut SMTP',
        color: 'red'
      })
    } finally {
      setSmtpLoading(false)
    }
  }

  // Envoyer les rappels via l'API réelle
  const handleSendReminders = async () => {
    setSendingReminders(true)
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined

      const result = await notificationsService.sendMandatoryTrainingReminders({
        managerIds: selectedManagers,
        periode,
        date,
        startDate: startDateStr,
        endDate: endDateStr,
      })

      setShowReminderModal(false)

      if (result.success) {
        notifications.show({
          title: 'Rappels envoyés',
          message: `${result.envoyesAvecSucces}/${result.totalManagers} rappels envoyés avec succès.${result.erreurs > 0 ? ` ${result.erreurs} erreur(s).` : ''}`,
          color: result.erreurs > 0 ? 'orange' : 'green',
          icon: <CheckCircle size={20} weight="fill" />
        })
      } else {
        notifications.show({
          title: 'Erreur',
          message: result.message,
          color: 'red',
          icon: <WarningCircle size={20} weight="fill" />
        })
      }

      setSelectedManagers([])
    } catch (error: any) {
      notifications.show({
        title: 'Erreur d\'envoi',
        message: error?.response?.data?.message || 'Impossible d\'envoyer les rappels. Vérifiez la configuration SMTP.',
        color: 'red',
        icon: <WarningCircle size={20} weight="fill" />
      })
    } finally {
      setSendingReminders(false)
    }
  }

  // Récupérer les infos des managers sélectionnés pour le modal
  const getSelectedManagersList = () => {
    if (!byManagerData) return []
    return byManagerData.departements.flatMap(d =>
      d.managers.filter(m => selectedManagers.includes(m.id))
    )
  }

  // Options pour le filtre département
  const departementOptions = byManagerData?.departements.map(d => ({
    value: d.id.toString(),
    label: `${d.nom} (${d.totalNonFormes})`
  })) || []

  useEffect(() => {
    fetchData()
  }, [periode, date, dateDebut, dateFin])

  // Recharger les données quand includeInactifs change
  useEffect(() => {
    fetchTauxContratData()
  }, [includeInactifs])

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
              <Tabs.Tab value="obligatoires" leftSection={<ShieldCheck size={16} weight="bold" />}>
                Formations obligatoires
                {mandatoryData?.stats?.totalFormations && mandatoryData.stats.totalFormations > 0 ? (
                  <Badge ml="xs" size="sm" variant="filled" color="orange">
                    {mandatoryData.stats.totalFormations}
                  </Badge>
                ) : null}
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

        {/* Tab Content: Formations Obligatoires */}
        {activeTab === 'obligatoires' && (
          <>
            {mandatoryLoading ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" />
                  <Text c="dimmed">Chargement des formations obligatoires...</Text>
                </Stack>
              </Center>
            ) : mandatoryData?.stats?.totalFormations === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="xl" variant="light" color="gray">
                    <ShieldCheck size={40} weight="duotone" />
                  </ThemeIcon>
                  <Title order={3}>Aucune formation obligatoire</Title>
                  <Text c="dimmed">Aucune formation n'est marquee comme obligatoire dans le systeme.</Text>
                </Stack>
              </Center>
            ) : mandatoryData && (
              <>
                {/* Stats Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                    <KPICard
                      title="Formations obligatoires"
                      value={mandatoryData.stats.totalFormations}
                      subtitle="A suivre par tous"
                      icon={<ShieldCheck size={22} weight="bold" />}
                      color="orange"
                    />
                    <KPICard
                      title="Taux de conformite"
                      value={mandatoryData.stats.tauxConformiteGlobal}
                      suffix="%"
                      subtitle="Toutes formations"
                      icon={<CheckCircle size={22} weight="bold" />}
                      color={mandatoryData.stats.tauxConformiteGlobal >= 80 ? 'green' : mandatoryData.stats.tauxConformiteGlobal >= 50 ? 'orange' : 'pink'}
                    />
                    <KPICard
                      title="Collaborateurs conformes"
                      value={mandatoryData.stats.totalFormes}
                      subtitle={`sur ${mandatoryData.stats.totalCollaborateursAFormer}`}
                      icon={<Users size={22} weight="bold" />}
                      color="green"
                    />
                    <KPICard
                      title="Collaborateurs non conformes"
                      value={mandatoryData.stats.totalNonFormes}
                      subtitle="A former"
                      icon={<WarningCircle size={22} weight="bold" />}
                      color="pink"
                    />
                  </SimpleGrid>
                </motion.div>

                {/* Formations Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card withBorder padding="lg" radius="md">
                    <Stack gap="sm">
                      <Stack gap={0}>
                        <Title order={3}>Detail par formation</Title>
                        <Text size="sm" c="dimmed">Taux de conformite pour chaque formation obligatoire</Text>
                      </Stack>

                      <Table striped withTableBorder highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Formation</Table.Th>
                            <Table.Th>Categorie</Table.Th>
                            <Table.Th>Formes</Table.Th>
                            <Table.Th>Non formes</Table.Th>
                            <Table.Th>Taux</Table.Th>
                            <Table.Th>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {mandatoryData.formations.map((formation) => (
                            <Table.Tr key={formation.id}>
                              <Table.Td>
                                <Stack gap={0}>
                                  <Text size="sm" fw={600}>{formation.nomFormation}</Text>
                                  <Text size="xs" c="dimmed">{formation.codeFormation}</Text>
                                </Stack>
                              </Table.Td>
                              <Table.Td>
                                <Badge variant="light" color="gray" size="sm">{formation.categorie}</Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" fw={600} c="green">{formation.collaborateursFormes}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" fw={600} c="red">{formation.collaborateursNonFormes}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  color={formation.tauxConformite >= 80 ? 'green' : formation.tauxConformite >= 50 ? 'orange' : 'red'}
                                  variant="light"
                                  size="sm"
                                >
                                  {formation.tauxConformite}%
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Button
                                  size="xs"
                                  variant="light"
                                  leftSection={<Eye size={14} weight="bold" />}
                                  onClick={() => {
                                    setSelectedFormation(formation)
                                    setModalTab('nonFormes')
                                  }}
                                >
                                  Details
                                </Button>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Stack>
                  </Card>
                </motion.div>

                {/* Department Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card withBorder padding="lg" radius="md">
                    <Stack gap="md">
                      <Group gap="sm">
                        <Buildings size={24} weight="bold" />
                        <Stack gap={0}>
                          <Title order={3}>Conformite par departement</Title>
                          <Text size="sm" c="dimmed">Pourcentage de collaborateurs ayant complete toutes les formations obligatoires</Text>
                        </Stack>
                      </Group>

                      <Stack gap="sm">
                        {mandatoryData.parDepartement.slice(0, 10).map((dept, index) => (
                          <motion.div
                            key={dept.departementId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.05 }}
                          >
                            <Group gap="md" wrap="nowrap">
                              <Text size="sm" style={{ minWidth: 180 }}>{dept.departement}</Text>
                              <Box style={{ flex: 1 }}>
                                <Progress
                                  value={dept.tauxConformite}
                                  color={dept.tauxConformite >= 80 ? 'green' : dept.tauxConformite >= 50 ? 'orange' : 'red'}
                                  size="lg"
                                  radius="xl"
                                />
                              </Box>
                              <Text size="xs" c="dimmed" style={{ minWidth: 60, textAlign: 'right' }}>
                                {dept.formes}/{dept.totalCollaborateurs}
                              </Text>
                              <Text size="sm" fw={600} style={{ minWidth: 50, textAlign: 'right' }}>
                                {dept.tauxConformite}%
                              </Text>
                            </Group>
                          </motion.div>
                        ))}
                      </Stack>

                      {mandatoryData.parDepartement.length > 10 && (
                        <Text size="sm" c="dimmed" ta="center" mt="md">
                          +{mandatoryData.parDepartement.length - 10} autres departements
                        </Text>
                      )}
                    </Stack>
                  </Card>
                </motion.div>

                {/* Vue par Manager - Section rappels */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card withBorder padding="lg" radius="md">
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start" wrap="wrap">
                        <Group gap="sm">
                          <UserList size={24} weight="bold" />
                          <Stack gap={0}>
                            <Title order={3}>Vue par departement et manager</Title>
                            <Text size="sm" c="dimmed">
                              Selectionnez les managers a notifier pour les formations obligatoires manquantes
                            </Text>
                          </Stack>
                        </Group>
                        <Select
                          placeholder="Tous les departements"
                          data={departementOptions}
                          value={selectedDept}
                          onChange={setSelectedDept}
                          clearable
                          w={220}
                        />
                      </Group>

                      {/* Actions groupées */}
                      <Group justify="space-between" wrap="wrap">
                        <Checkbox
                          label="Selectionner tous les managers"
                          checked={!!(byManagerData && selectedManagers.length === byManagerData.departements.flatMap(d => d.managers).length && selectedManagers.length > 0)}
                          indeterminate={!!(selectedManagers.length > 0 && byManagerData && selectedManagers.length < byManagerData.departements.flatMap(d => d.managers).length)}
                          onChange={toggleSelectAllManagers}
                        />
                        <Button
                          leftSection={<EnvelopeSimple size={18} weight="bold" />}
                          disabled={selectedManagers.length === 0}
                          onClick={() => setShowReminderModal(true)}
                          color="orange"
                          variant="filled"
                        >
                          Envoyer rappels ({selectedManagers.length})
                        </Button>
                      </Group>

                      {/* Loading state */}
                      {byManagerLoading ? (
                        <Center py="xl">
                          <Stack align="center" gap="sm">
                            <Loader />
                            <Text size="sm" c="dimmed">Chargement de la vue par manager...</Text>
                          </Stack>
                        </Center>
                      ) : byManagerData && byManagerData.departements.length === 0 && byManagerData.sansManager.length === 0 ? (
                        <Center py="xl">
                          <Stack align="center" gap="md">
                            <ThemeIcon size="xl" radius="xl" variant="light" color="green">
                              <CheckCircle size={40} weight="duotone" />
                            </ThemeIcon>
                            <Title order={4}>Tous les collaborateurs sont conformes</Title>
                            <Text c="dimmed">Aucun collaborateur n'a de formation obligatoire manquante.</Text>
                          </Stack>
                        </Center>
                      ) : byManagerData && (
                        <>
                          {/* Stats récapitulatifs */}
                          <Group gap="xl" wrap="wrap">
                            <Group gap={6}>
                              <Buildings size={16} weight="bold" />
                              <Text size="sm">{byManagerData.stats.totalDepartements} departements</Text>
                            </Group>
                            <Group gap={6}>
                              <UserList size={16} weight="bold" />
                              <Text size="sm">{byManagerData.stats.totalManagers} managers</Text>
                            </Group>
                            <Group gap={6}>
                              <WarningCircle size={16} weight="bold" />
                              <Text size="sm">{byManagerData.stats.totalCollaborateursNonFormes} collaborateurs a former</Text>
                            </Group>
                          </Group>

                          {/* Accordéon par département */}
                          <Accordion
                            multiple
                            defaultValue={byManagerData.departements.slice(0, 2).map(d => `dept-${d.id}`)}
                            variant="separated"
                          >
                            {byManagerData.departements.map(dept => (
                              <Accordion.Item key={dept.id} value={`dept-${dept.id}`}>
                                <Accordion.Control>
                                  <Group gap="sm">
                                    <Buildings size={20} weight="bold" />
                                    <Text fw={600}>{dept.nom}</Text>
                                    <Badge color="red" variant="filled" size="sm">{dept.totalNonFormes} non formes</Badge>
                                    <Badge color="gray" variant="light" size="sm">{dept.managers.length} managers</Badge>
                                  </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                  <Stack gap="sm">
                                    {dept.managers.map(manager => (
                                      <motion.div
                                        key={manager.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                      >
                                        <Paper withBorder p="sm" radius="md">
                                          <Group align="flex-start" wrap="nowrap">
                                            <Checkbox
                                              checked={selectedManagers.includes(manager.id)}
                                              onChange={() => toggleManager(manager.id)}
                                              mt={4}
                                            />
                                            <Stack gap="xs" style={{ flex: 1 }}>
                                              <Group justify="space-between">
                                                <Text fw={600} size="sm">{manager.nomComplet}</Text>
                                                <Badge color="orange" variant="light" size="xs">
                                                  {manager.totalSubordonnes} collaborateur{manager.totalSubordonnes > 1 ? 's' : ''}
                                                </Badge>
                                              </Group>
                                              <Stack gap="xs">
                                                {manager.collaborateursNonFormes.map(collab => (
                                                  <Group key={collab.id} gap="xs" wrap="wrap">
                                                    <Text size="xs" c="dimmed">{collab.nomComplet}</Text>
                                                    <Group gap={4}>
                                                      {collab.formationsManquantes.map(f => (
                                                        <Badge key={f.id} size="xs" color="pink" variant="light">
                                                          {f.nomFormation}
                                                        </Badge>
                                                      ))}
                                                    </Group>
                                                  </Group>
                                                ))}
                                              </Stack>
                                            </Stack>
                                          </Group>
                                        </Paper>
                                      </motion.div>
                                    ))}
                                  </Stack>
                                </Accordion.Panel>
                              </Accordion.Item>
                            ))}
                          </Accordion>

                          {/* Collaborateurs sans manager */}
                          {byManagerData.sansManager.length > 0 && (
                            <Card withBorder padding="md" radius="md">
                              <Stack gap="sm">
                                <Group gap={6}>
                                  <WarningCircle size={18} weight="bold" />
                                  <Title order={5}>
                                    Collaborateurs sans manager ({byManagerData.sansManager.length})
                                  </Title>
                                </Group>
                                <Stack gap="xs">
                                  {byManagerData.sansManager.map(collab => (
                                    <Paper key={collab.id} withBorder p="sm" radius="sm">
                                      <Stack gap={4}>
                                        <Text size="sm">{collab.nomComplet}</Text>
                                        <Text size="xs" c="dimmed">{collab.departement}</Text>
                                        <Group gap={4}>
                                          {collab.formationsManquantes.map(f => (
                                            <Badge key={f.id} size="xs" color="pink" variant="light">
                                              {f.nomFormation}
                                            </Badge>
                                          ))}
                                        </Group>
                                      </Stack>
                                    </Paper>
                                  ))}
                                </Stack>
                              </Stack>
                            </Card>
                          )}
                        </>
                      )}
                    </Stack>
                  </Card>
                </motion.div>
              </>
            )}
          </>
        )}

        {/* Modal for sending reminders */}
        <Modal
          opened={showReminderModal}
          onClose={() => !sendingReminders && setShowReminderModal(false)}
          title="Envoyer des rappels aux managers"
          size="lg"
          centered
          closeOnClickOutside={!sendingReminders}
          closeOnEscape={!sendingReminders}
        >
          <Stack>
            <Alert color="blue" icon={<Info size={20} weight="bold" />} variant="light">
              Les rappels seront envoyés par email aux managers sélectionnés.
              Assurez-vous que la configuration SMTP est en place.
            </Alert>

            <Text fw={500}>Managers selectionnes : {selectedManagers.length}</Text>

            {/* Preview du message */}
            <Paper withBorder p="md">
              <Text size="sm" fw={600} c="dimmed" mb="xs">Apercu du message :</Text>
              <Divider my="xs" />
              <Text size="sm" style={{ lineHeight: 1.6 }}>
                Bonjour [Nom du manager],<br/><br/>
                Certains membres de votre equipe n'ont pas encore complete
                les formations obligatoires suivantes :<br/>
                - [Liste des formations par collaborateur]<br/><br/>
                Merci de vous assurer qu'ils completent ces formations
                dans les meilleurs delais.<br/><br/>
                Cordialement,<br/>
                L'equipe Formation
              </Text>
            </Paper>

            {/* Liste des destinataires */}
            <Accordion>
              <Accordion.Item value="recipients">
                <Accordion.Control>
                  <Text size="sm">Voir les {selectedManagers.length} destinataires</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Box style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <Stack gap="xs">
                      {getSelectedManagersList().map(m => (
                        <Group key={m.id} justify="space-between" py="xs">
                          <Text size="sm">{m.nomComplet}</Text>
                          <Badge size="sm" color="orange">{m.collaborateursNonFormes.length} a former</Badge>
                        </Group>
                      ))}
                    </Stack>
                  </Box>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            <Group justify="space-between" mt="md">
              <Button
                variant="light"
                color="blue"
                onClick={handleCheckSmtp}
                loading={smtpLoading}
                size="xs"
              >
                Vérifier config SMTP
              </Button>
              <Group>
                <Button variant="light" color="gray" onClick={() => setShowReminderModal(false)}>
                  Annuler
                </Button>
                <Button
                  color="orange"
                  leftSection={<EnvelopeSimple size={18} weight="bold" />}
                  onClick={handleSendReminders}
                  loading={sendingReminders}
                >
                  Envoyer les rappels
                </Button>
              </Group>
            </Group>
          </Stack>
        </Modal>

        {/* Modal for formation details */}
        <Modal
          opened={!!selectedFormation}
          onClose={() => setSelectedFormation(null)}
          title={
            selectedFormation && (
              <Stack gap={0}>
                <Title order={4}>{selectedFormation.nomFormation}</Title>
                <Text size="sm" c="dimmed">
                  {selectedFormation.codeFormation} - {selectedFormation.categorie}
                </Text>
              </Stack>
            )
          }
          size="lg"
          centered
        >
          {selectedFormation && (
            <Tabs value={modalTab} onChange={(value) => setModalTab((value as 'formes' | 'nonFormes') || 'nonFormes')}>
              <Tabs.List>
                <Tabs.Tab
                  value="nonFormes"
                  leftSection={<WarningCircle size={16} weight="bold" />}
                >
                  Non formes ({selectedFormation.collaborateursNonFormes})
                </Tabs.Tab>
                <Tabs.Tab
                  value="formes"
                  leftSection={<CheckCircle size={16} weight="bold" />}
                >
                  Formes ({selectedFormation.collaborateursFormes})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="nonFormes" pt="md">
                {selectedFormation.nonFormes.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="sm">
                      <ThemeIcon size="xl" radius="xl" variant="light" color="green">
                        <CheckCircle size={32} weight="duotone" />
                      </ThemeIcon>
                      <Text size="lg" fw={600}>Tous les collaborateurs sont formes !</Text>
                      <Text size="sm" c="dimmed">Aucun collaborateur n'est en attente de cette formation.</Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="xs">
                    {selectedFormation.nonFormes.map((collab) => (
                      <Paper key={collab.id} withBorder p="sm" radius="sm">
                        <Group justify="space-between">
                          <Group gap={4}>
                            <Text size="sm" fw={500}>{collab.nomComplet}</Text>
                            <Text size="sm" c="dimmed">- {collab.departement}</Text>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="formes" pt="md">
                {selectedFormation.formes.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="sm">
                      <ThemeIcon size="xl" radius="xl" variant="light" color="red">
                        <WarningCircle size={32} weight="duotone" />
                      </ThemeIcon>
                      <Text size="lg" fw={600}>Aucun collaborateur forme</Text>
                      <Text size="sm" c="dimmed">Personne n'a encore suivi cette formation sur la periode.</Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="xs">
                    {selectedFormation.formes.map((collab) => (
                      <Paper key={collab.id} withBorder p="sm" radius="sm">
                        <Group justify="space-between">
                          <Group gap={4}>
                            <Text size="sm" fw={500}>{collab.nomComplet}</Text>
                            <Text size="sm" c="dimmed">- {collab.departement}</Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {new Date(collab.dateFormation).toLocaleDateString('fr-FR')}
                          </Text>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          )}
        </Modal>
      </Stack>
    </Container>
  )
}
