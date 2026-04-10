'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Text,
  Badge,
  Tooltip,
  Select,
  Modal,
  Button,
  Stack,
  Checkbox,
  Alert,
  Divider,
  Paper,
  Group,
  Accordion,
  Container,
  Card,
  Title,
  SimpleGrid,
  ThemeIcon,
  Loader,
  Center,
  Table,
  Progress,
  TextInput,
  ActionIcon,
  Tabs,
  Box,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings'
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye'
import { X } from '@phosphor-icons/react/dist/ssr/X'
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass'
import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple'
import { Info } from '@phosphor-icons/react/dist/ssr/Info'
import { UserList } from '@phosphor-icons/react/dist/ssr/UserList'
import { Scales } from '@phosphor-icons/react/dist/ssr/Scales'
import { PeriodSelector } from '@/components/PeriodSelector'
import { motion, AnimatePresence } from 'framer-motion'
import { statsService, formationsService, notificationsService } from '@/lib/services'
import { ComplianceEthicsKPIsResponse } from '@/lib/types'

// ===== Interfaces =====

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

// ===== KPI Card Component =====

function KPICard({
  title,
  value,
  suffix = '',
  subtitle,
  icon,
  color = 'cyan',
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15, delay }}
    >
      <Card withBorder radius="md" padding="lg" h="100%">
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed" fw={500}>{title}</Text>
          <ThemeIcon variant="light" color={color} size="lg" radius="md">
            {icon}
          </ThemeIcon>
        </Group>
        <Group align="baseline" gap={4}>
          <Text size="xl" fw={700}>{value.toLocaleString('fr-FR')}</Text>
          {suffix && <Text size="md" fw={600} c="dimmed">{suffix}</Text>}
        </Group>
        {subtitle && <Text size="xs" c="dimmed" mt={4}>{subtitle}</Text>}
      </Card>
    </motion.div>
  )
}

// ===== Main Page Component =====

export default function ConformitePage() {
  // Period selector state
  const [periode, setPeriode] = useState<'annee' | 'mois' | 'plage'>('annee')
  const [date, setDate] = useState<string>(new Date().getFullYear().toString())
  const [dateDebut, setDateDebut] = useState<Date | null>(null)
  const [dateFin, setDateFin] = useState<Date | null>(null)

  // Mandatory trainings data
  const [mandatoryData, setMandatoryData] = useState<MandatoryTrainingsKPIs | null>(null)
  const [mandatoryLoading, setMandatoryLoading] = useState(true)

  // Compliance / risk category data
  const [complianceData, setComplianceData] = useState<ComplianceEthicsKPIsResponse | null>(null)
  const [complianceLoading, setComplianceLoading] = useState(false)

  // Formation scope selection
  const [selectedFormationIds, setSelectedFormationIds] = useState<number[]>([])
  const [availableFormations, setAvailableFormations] = useState<{ id: number; nom: string }[]>([])
  const [allFormations, setAllFormations] = useState<{ id: number; nom: string }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Formation detail modal
  const [selectedFormation, setSelectedFormation] = useState<MandatoryTrainingsKPIs['formations'][0] | null>(null)
  const [modalTab, setModalTab] = useState<'formes' | 'nonFormes'>('nonFormes')

  // Matrix detail modal
  const [matrixDetail, setMatrixDetail] = useState<{ dept: string; formation: MandatoryTrainingsKPIs['formations'][0] } | null>(null)

  // Manager view
  const [byManagerData, setByManagerData] = useState<MandatoryByManagerResponse | null>(null)
  const [byManagerLoading, setByManagerLoading] = useState(false)
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [selectedManagers, setSelectedManagers] = useState<number[]>([])

  // Reminder modal
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [smtpLoading, setSmtpLoading] = useState(false)

  // Email status
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; connectionValid: boolean; message: string } | null>(null)

  // ===== Initial Load =====

  useEffect(() => {
    fetchAllFormations()
    checkEmailStatusOnMount()
  }, [])

  // Load data when period changes
  useEffect(() => {
    fetchMandatoryData()
  }, [periode, date, dateDebut, dateFin])

  // Load compliance data when scope changes
  useEffect(() => {
    fetchComplianceData()
  }, [periode, date, dateDebut, dateFin, selectedFormationIds, availableFormations.length, hasInitialized])

  // Load manager data when dept filter changes
  useEffect(() => {
    if (mandatoryData) {
      fetchByManagerData()
    }
  }, [selectedDept])

  // ===== Data Fetching =====

  const fetchAllFormations = async () => {
    try {
      const response = await formationsService.getFormations({ limit: 1000 })
      setAllFormations(response.data.map(f => ({ id: f.id, nom: f.nomFormation })))
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error)
    }
  }

  const checkEmailStatusOnMount = async () => {
    try {
      const status = await statsService.checkEmailStatus()
      setEmailStatus(status)
    } catch (error) {
      console.error('Erreur lors de la verification du statut email:', error)
      setEmailStatus({ configured: false, connectionValid: false, message: 'Impossible de verifier le statut' })
    }
  }

  const fetchMandatoryData = async () => {
    if (periode === 'plage' && (!dateDebut || !dateFin)) return

    setMandatoryLoading(true)
    setByManagerLoading(true)
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined

      const mandatoryResponse = await statsService.getMandatoryTrainingsKPIs(periode, date, startDateStr, endDateStr)
      setMandatoryData(mandatoryResponse)

      // Initialize scope with ALL mandatory formations on first load
      if (!hasInitialized && mandatoryResponse.formations.length > 0) {
        const mandatoryFormationsList = mandatoryResponse.formations.map((f: { id: number; nomFormation: string }) => ({
          id: f.id,
          nom: f.nomFormation
        }))
        setAvailableFormations(mandatoryFormationsList)
        setSelectedFormationIds(mandatoryFormationsList.map((f: { id: number }) => f.id))
        setHasInitialized(true)
      }

      setMandatoryLoading(false)

      // Load by-manager data in parallel
      try {
        const byManagerResponse = await statsService.getMandatoryTrainingsByManager(
          periode, date, startDateStr, endDateStr,
          selectedDept ? parseInt(selectedDept) : undefined
        )
        setByManagerData(byManagerResponse)
      } catch (managerError) {
        console.error('Erreur lors du chargement des donnees par manager:', managerError)
        setByManagerData(null)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations obligatoires:', error)
    } finally {
      setMandatoryLoading(false)
      setByManagerLoading(false)
    }
  }

  const fetchComplianceData = async () => {
    if (periode === 'plage' && (!dateDebut || !dateFin)) return

    // If user deselected everything after init, show zeros
    if (hasInitialized && selectedFormationIds.length === 0) {
      const zeroGenre = { nombre: 0, heures: 0, formations: 0, moyenne: 0 }
      const zeroCategory = {
        total: 0, formes: 0, nonFormes: 0, heures: 0, formations: 0,
        tauxCouverture: 0, moyenneHeuresParPersonne: 0,
        parGenre: { homme: zeroGenre, femme: zeroGenre }
      }
      setComplianceData({
        periode: {
          annee: parseInt(date) || new Date().getFullYear(),
          mois: null,
          dateDebut: null,
          dateFin: null,
          libelle: 'Aucune formation selectionnee'
        },
        formationsEthique: { liste: [], nombreFormations: 0 },
        parCategorieSimple: {
          b2b: zeroCategory,
          b2c: zeroCategory,
          managers: zeroCategory,
          directeurs: zeroCategory,
          collaborateurs: zeroCategory
        },
        parCategorieCroisee: [],
        comparatifGlobal: { totalEmployesRisque: 0, formes: 0, nonFormes: 0, tauxCouverture: 0 },
        parFormation: []
      })
      return
    }

    setComplianceLoading(true)
    try {
      const startDate = dateDebut instanceof Date ? dateDebut.toISOString() :
                        dateDebut ? new Date(dateDebut).toISOString() : undefined
      const endDate = dateFin instanceof Date ? dateFin.toISOString() :
                      dateFin ? new Date(dateFin).toISOString() : undefined

      const formationIds = selectedFormationIds.length > 0 ? selectedFormationIds : undefined
      const response = await statsService.getComplianceEthicsKpis(
        periode, date, startDate, endDate, undefined, formationIds
      )
      setComplianceData(response)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs compliance:', error)
    } finally {
      setComplianceLoading(false)
    }
  }

  const fetchByManagerData = async () => {
    setByManagerLoading(true)
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined

      const response = await statsService.getMandatoryTrainingsByManager(
        periode, date, startDateStr, endDateStr,
        selectedDept ? parseInt(selectedDept) : undefined
      )
      setByManagerData(response)
      setSelectedManagers([])
    } catch (error) {
      console.error('Erreur lors du chargement des donnees par manager:', error)
    } finally {
      setByManagerLoading(false)
    }
  }

  // ===== Formation Scope Management =====

  const addFormationToList = (formation: { id: number; nom: string }) => {
    if (!availableFormations.find(f => f.id === formation.id)) {
      setAvailableFormations(prev => [...prev, formation])
      setSelectedFormationIds(prev => [...prev, formation.id])
    }
    setSearchQuery('')
    setShowSearch(false)
  }

  const removeFormationFromList = (formationId: number) => {
    setAvailableFormations(prev => prev.filter(f => f.id !== formationId))
    setSelectedFormationIds(prev => prev.filter(id => id !== formationId))
  }

  const filteredSearchResults = allFormations.filter(f =>
    !availableFormations.find(af => af.id === f.id) &&
    f.nom.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10)

  // ===== Manager View Helpers =====

  const toggleManager = (managerId: number) => {
    setSelectedManagers(prev =>
      prev.includes(managerId)
        ? prev.filter(id => id !== managerId)
        : [...prev, managerId]
    )
  }

  const toggleSelectAllManagers = () => {
    if (!byManagerData) return
    const allManagerIds = byManagerData.departements.flatMap((d: any) => d.managers.map((m: any) => m.id))
    if (selectedManagers.length === allManagerIds.length) {
      setSelectedManagers([])
    } else {
      setSelectedManagers(allManagerIds)
    }
  }

  const getManagersForDept = (deptName: string): number[] => {
    if (!byManagerData) return []
    const dept = byManagerData.departements.find((d: any) => d.nom === deptName)
    return dept ? dept.managers.map((m: any) => m.id) : []
  }

  const isDeptSelected = (deptName: string): boolean => {
    const managerIds = getManagersForDept(deptName)
    return managerIds.length > 0 && managerIds.every(id => selectedManagers.includes(id))
  }

  const isDeptIndeterminate = (deptName: string): boolean => {
    const managerIds = getManagersForDept(deptName)
    const selected = managerIds.filter(id => selectedManagers.includes(id))
    return selected.length > 0 && selected.length < managerIds.length
  }

  const toggleDept = (deptName: string) => {
    const managerIds = getManagersForDept(deptName)
    if (managerIds.length === 0) return
    if (isDeptSelected(deptName)) {
      setSelectedManagers(prev => prev.filter(id => !managerIds.includes(id)))
    } else {
      setSelectedManagers(prev => [...new Set([...prev, ...managerIds])])
    }
  }

  const getSelectedManagersList = () => {
    if (!byManagerData) return []
    return byManagerData.departements.flatMap((d: any) =>
      d.managers.filter((m: any) => selectedManagers.includes(m.id))
    )
  }

  // ===== SMTP & Reminders =====

  const handleCheckSmtp = async () => {
    setSmtpLoading(true)
    try {
      const status = await notificationsService.checkEmailStatus()
      notifications.show({
        title: status.configured ? 'SMTP configure' : 'SMTP non configure',
        message: status.message,
        color: status.connectionValid ? 'green' : status.configured ? 'orange' : 'red',
        icon: status.connectionValid ? <CheckCircle size={20} weight="fill" /> : <WarningCircle size={20} weight="fill" />
      })
    } catch {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de verifier le statut SMTP',
        color: 'red'
      })
    } finally {
      setSmtpLoading(false)
    }
  }

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
          title: 'Rappels envoyes',
          message: `${result.envoyesAvecSucces}/${result.totalManagers} rappels envoyes avec succes.${result.erreurs > 0 ? ` ${result.erreurs} erreur(s).` : ''}`,
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
        title: "Erreur d'envoi",
        message: error?.response?.data?.message || "Impossible d'envoyer les rappels. Verifiez la configuration SMTP.",
        color: 'red',
        icon: <WarningCircle size={20} weight="fill" />
      })
    } finally {
      setSendingReminders(false)
    }
  }

  // ===== Helper Functions =====

  const getCoverageColor = (taux: number) => {
    if (taux >= 80) return 'green'
    if (taux >= 50) return 'yellow'
    return 'red'
  }

  const getCategoryBadgeColor = (categorie: string) => {
    if (categorie.includes('Autres Collaborateurs')) return 'gray'
    if (categorie.includes('B2B')) return 'blue'
    if (categorie.includes('B2C')) return 'cyan'
    if (categorie.includes('Manager')) return 'violet'
    if (categorie.includes('Directeur')) return 'grape'
    return 'teal'
  }

  // ===== Loading State =====

  if (mandatoryLoading && !mandatoryData) {
    return (
      <Container size="xl" py="md">
        <Center h={400}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Chargement des donnees de conformite...</Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  // ===== Render =====

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">

        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Title order={1}>Formations Obligatoires</Title>
                <Text c="dimmed">
                  Suivi des formations obligatoires
                </Text>
              </Stack>
              <Badge color="green" variant="light" size="lg">Temps reel</Badge>
            </Group>
            <PeriodSelector
              periode={periode}
              date={date}
              dateDebut={dateDebut}
              dateFin={dateFin}
              onChange={(p, d) => { setPeriode(p); setDate(d) }}
              onDateRangeChange={(debut, fin) => { setDateDebut(debut); setDateFin(fin) }}
            />
          </Stack>
        </motion.div>

        {/* ===== SECTION 1: SCOPE DES FORMATIONS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card withBorder radius="md" padding="lg">
            <Stack gap="md">
              <Group gap="xs">
                <ThemeIcon variant="light" color="teal" size="md" radius="md">
                  <ShieldCheck size={18} weight="bold" />
                </ThemeIcon>
                <Title order={4}>
                  Formations obligatoires ({selectedFormationIds.length}/{availableFormations.length} selectionnees)
                </Title>
              </Group>

              <Group gap="xs">
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => setSelectedFormationIds(availableFormations.map(f => f.id))}
                  disabled={selectedFormationIds.length === availableFormations.length}
                >
                  Tout selectionner
                </Button>
                <Button
                  variant="light"
                  color="gray"
                  size="xs"
                  onClick={() => setSelectedFormationIds([])}
                  disabled={selectedFormationIds.length === 0}
                >
                  Tout deselectionner
                </Button>
                <Button
                  variant="light"
                  color="cyan"
                  size="xs"
                  leftSection={<Plus size={14} weight="bold" />}
                  onClick={() => {
                    setShowSearch(!showSearch)
                    setTimeout(() => searchInputRef.current?.focus(), 100)
                  }}
                >
                  Ajouter une formation
                </Button>
              </Group>

              {/* Search to add formations */}
              {showSearch && (
                <Stack gap="xs">
                  <TextInput
                    ref={searchInputRef}
                    leftSection={<MagnifyingGlass size={16} />}
                    rightSection={
                      <ActionIcon variant="subtle" color="gray" onClick={() => { setShowSearch(false); setSearchQuery('') }}>
                        <X size={14} />
                      </ActionIcon>
                    }
                    placeholder="Rechercher une formation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && filteredSearchResults.length > 0 && (
                    <Paper withBorder p="xs">
                      <Stack gap={4}>
                        {filteredSearchResults.map(f => (
                          <Button
                            key={f.id}
                            variant="subtle"
                            justify="flex-start"
                            leftSection={<Plus size={14} />}
                            onClick={() => addFormationToList(f)}
                          >
                            {f.nom}
                          </Button>
                        ))}
                      </Stack>
                    </Paper>
                  )}
                  {searchQuery && filteredSearchResults.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center">Aucune formation trouvee</Text>
                  )}
                </Stack>
              )}

              {/* Formation tags */}
              <Group gap="xs">
                {availableFormations.map(f => {
                  const isSelected = selectedFormationIds.includes(f.id)
                  return (
                    <Group key={f.id} gap={4} wrap="nowrap">
                      <Button
                        variant={isSelected ? 'filled' : 'default'}
                        color={isSelected ? 'teal' : 'gray'}
                        size="xs"
                        leftSection={
                          isSelected
                            ? <CheckCircle size={14} weight="fill" />
                            : <XCircle size={14} weight="regular" />
                        }
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFormationIds(prev => prev.filter(id => id !== f.id))
                          } else {
                            setSelectedFormationIds(prev => [...prev, f.id])
                          }
                        }}
                      >
                        {f.nom}
                      </Button>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => removeFormationFromList(f.id)}
                        title="Retirer de la liste"
                      >
                        <X size={12} />
                      </ActionIcon>
                    </Group>
                  )
                })}
              </Group>

              {selectedFormationIds.length === 0 && availableFormations.length === 0 && (
                <Alert color="orange" icon={<Warning size={16} />}>
                  Aucune formation obligatoire trouvee - Utilisez "Ajouter une formation" pour en ajouter
                </Alert>
              )}
            </Stack>
          </Card>
        </motion.div>

        {/* ===== SECTION 2: STATS GLOBALES (KPI CARDS) ===== */}
        {mandatoryData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
              <KPICard
                title="Formations obligatoires"
                value={mandatoryData.stats.totalFormations}
                subtitle="A suivre par tous"
                icon={<ShieldCheck size={22} weight="bold" />}
                color="violet"
                delay={0.1}
              />
              <KPICard
                title="Taux de conformite"
                value={mandatoryData.stats.tauxConformiteGlobal}
                suffix="%"
                subtitle="Toutes formations"
                icon={<CheckCircle size={22} weight="bold" />}
                color={mandatoryData.stats.tauxConformiteGlobal >= 80 ? 'green' : mandatoryData.stats.tauxConformiteGlobal >= 50 ? 'cyan' : 'pink'}
                delay={0.15}
              />
              <KPICard
                title="Collaborateurs conformes"
                value={mandatoryData.stats.totalFormes}
                subtitle={`sur ${mandatoryData.stats.totalCollaborateursAFormer}`}
                icon={<Users size={22} weight="bold" />}
                color="green"
                delay={0.2}
              />
              <KPICard
                title="Collaborateurs non conformes"
                value={mandatoryData.stats.totalNonFormes}
                subtitle="A former"
                icon={<WarningCircle size={22} weight="bold" />}
                color="pink"
                delay={0.25}
              />
              {complianceData && (
                <>
                  <KPICard
                    title="Taux couverture"
                    value={complianceData.comparatifGlobal.tauxCouverture}
                    suffix="%"
                    subtitle="Formations selectionnees"
                    icon={<Scales size={22} weight="bold" />}
                    color="teal"
                    delay={0.3}
                  />
                  <KPICard
                    title="Employes a risque"
                    value={complianceData.comparatifGlobal.totalEmployesRisque}
                    subtitle="Sans formations requises"
                    icon={<Warning size={22} weight="bold" />}
                    color="orange"
                    delay={0.35}
                  />
                </>
              )}
            </SimpleGrid>
          </motion.div>
        )}

        {/* ===== SECTION 3: DETAIL PAR FORMATION (TABLE) ===== */}
        {mandatoryData && mandatoryData.formations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card withBorder radius="md" padding="lg">
              <Stack gap="md">
                <Stack gap={4}>
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
                          <Stack gap={2}>
                            <Text fw={600} size="sm">{formation.nomFormation}</Text>
                            <Text size="xs" c="dimmed">{formation.codeFormation}</Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="gray" size="sm">{formation.categorie}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text c="green" fw={600}>{formation.collaborateursFormes}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c="red" fw={600}>{formation.collaborateursNonFormes}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={formation.tauxConformite >= 80 ? 'green' : formation.tauxConformite >= 50 ? 'yellow' : 'red'}
                            variant="light"
                          >
                            {formation.tauxConformite}%
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Button
                            variant="light"
                            size="xs"
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
        )}

        {/* SECTION 4: PAR DEPARTEMENT - Supprimée */}

        {/* ===== SECTION 5: MATRICE DEPARTEMENT × FORMATION ===== */}
        {mandatoryData && mandatoryData.formations.length > 0 && (() => {
          // Construire la matrice départements × formations
          const deptSet = new Set<string>();
          mandatoryData.formations.forEach((f: any) => {
            f.formes.forEach((c: any) => { if (c.departement) deptSet.add(c.departement); });
            f.nonFormes.forEach((c: any) => { if (c.departement) deptSet.add(c.departement); });
          });
          const departments = Array.from(deptSet).sort();

          // Calculer les données par cellule
          const getCellData = (dept: string, formation: any) => {
            const formes = formation.formes.filter((c: any) => c.departement === dept);
            const nonFormes = formation.nonFormes.filter((c: any) => c.departement === dept);
            const total = formes.length + nonFormes.length;
            const taux = total > 0 ? Math.round((formes.length / total) * 100) : 0;
            return { formes: formes.length, nonFormes: nonFormes.length, nonFormesDetails: nonFormes, formesDetails: formes, total, taux };
          };

          // Calculer le total par département
          const getDeptTotal = (dept: string) => {
            let totalFormes = 0, totalAll = 0;
            mandatoryData.formations.forEach((f: any) => {
              const cell = getCellData(dept, f);
              totalFormes += cell.formes;
              totalAll += cell.total;
            });
            return totalAll > 0 ? Math.round((totalFormes / totalAll) * 100) : 0;
          };

          // Trier les départements par taux de conformité (les moins conformes en premier)
          const sortedDepts = [...departments].sort((a, b) => getDeptTotal(a) - getDeptTotal(b));

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card withBorder radius="md" padding="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <Group gap="xs">
                      <ThemeIcon variant="light" color="blue" size="md" radius="md">
                        <Buildings size={18} weight="bold" />
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Title order={3}>Matrice de conformite</Title>
                        <Text size="sm" c="dimmed">
                          Cliquez sur une cellule pour voir le detail des collaborateurs
                        </Text>
                      </Stack>
                    </Group>
                    <Button
                      leftSection={<EnvelopeSimple size={18} weight="bold" />}
                      disabled={selectedManagers.length === 0}
                      onClick={() => setShowReminderModal(true)}
                      variant="filled"
                      size="sm"
                    >
                      Envoyer rappels ({selectedManagers.length})
                    </Button>
                  </Group>

                  <Table.ScrollContainer minWidth={500}>
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ width: 40 }}></Table.Th>
                          <Table.Th style={{ minWidth: 180 }}>Departement</Table.Th>
                          {mandatoryData.formations.map((f: any) => (
                            <Table.Th key={f.id} style={{ textAlign: 'center', minWidth: 120 }}>
                              <Tooltip label={f.nomFormation} multiline w={250}>
                                <Text size="xs" fw={600} lineClamp={2} ta="center">
                                  {f.nomFormation.length > 30 ? f.nomFormation.substring(0, 28) + '...' : f.nomFormation}
                                </Text>
                              </Tooltip>
                            </Table.Th>
                          ))}
                          <Table.Th style={{ textAlign: 'center', minWidth: 80 }}>Total</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {sortedDepts.map((dept) => {
                          const deptTaux = getDeptTotal(dept);
                          return (
                            <Table.Tr key={dept}>
                              <Table.Td>
                                {getManagersForDept(dept).length > 0 ? (
                                  <Tooltip label={isDeptSelected(dept) ? 'Desélectionner' : 'Sélectionner pour rappel'}>
                                    <Checkbox
                                      size="xs"
                                      checked={isDeptSelected(dept)}
                                      indeterminate={isDeptIndeterminate(dept)}
                                      onChange={() => toggleDept(dept)}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Tooltip label="Aucun manager identifié">
                                    <Text size="xs" c="dimmed">-</Text>
                                  </Tooltip>
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" fw={500}>{dept}</Text>
                              </Table.Td>
                              {mandatoryData.formations.map((f: any) => {
                                const cell = getCellData(dept, f);
                                if (cell.total === 0) {
                                  return (
                                    <Table.Td key={f.id} style={{ textAlign: 'center' }}>
                                      <Text size="xs" c="dimmed">-</Text>
                                    </Table.Td>
                                  );
                                }
                                return (
                                  <Table.Td
                                    key={f.id}
                                    style={{ textAlign: 'center', cursor: 'pointer' }}
                                    onClick={() => setMatrixDetail({ dept, formation: f })}
                                  >
                                    <Stack gap={4} align="center">
                                      <Badge
                                        size="sm"
                                        variant="light"
                                        color={cell.taux >= 100 ? 'green' : cell.taux >= 50 ? 'yellow' : 'red'}
                                      >
                                        {cell.formes}/{cell.total}
                                      </Badge>
                                      <Progress
                                        value={cell.taux}
                                        color={cell.taux >= 100 ? 'green' : cell.taux >= 50 ? 'yellow' : 'red'}
                                        size="xs"
                                        radius="md"
                                        w="100%"
                                      />
                                    </Stack>
                                  </Table.Td>
                                );
                              })}
                              <Table.Td style={{ textAlign: 'center' }}>
                                <Text size="sm" fw={700} c={deptTaux >= 100 ? 'green' : deptTaux >= 50 ? 'yellow.7' : 'red'}>
                                  {deptTaux}%
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>

                  {/* Info sélection */}
                  {byManagerData && byManagerData.departements.length > 0 && (
                    <Group justify="space-between" mt="xs">
                      <Group gap="sm">
                        <Checkbox
                          label="Tout selectionner"
                          checked={!!(selectedManagers.length === byManagerData.departements.flatMap((d: any) => d.managers).length && selectedManagers.length > 0)}
                          indeterminate={!!(selectedManagers.length > 0 && selectedManagers.length < byManagerData.departements.flatMap((d: any) => d.managers).length)}
                          onChange={toggleSelectAllManagers}
                          size="xs"
                        />
                        {selectedManagers.length > 0 && (
                          <Badge variant="light" color="blue" size="sm">
                            {selectedManagers.length} manager{selectedManagers.length > 1 ? 's' : ''} selectionne{selectedManagers.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </Group>
                    </Group>
                  )}
                </Stack>
              </Card>
            </motion.div>
          );
        })()}

        {/* ===== MATRIX DETAIL MODAL ===== */}
        <Modal
          opened={!!matrixDetail}
          onClose={() => setMatrixDetail(null)}
          title={
            matrixDetail && (
              <Stack gap={2}>
                <Title order={4}>{matrixDetail.dept}</Title>
                <Text size="xs" c="dimmed">{matrixDetail.formation.nomFormation}</Text>
              </Stack>
            )
          }
          size="lg"
          centered
        >
          {matrixDetail && (() => {
            const formes = matrixDetail.formation.formes.filter((c: any) => c.departement === matrixDetail.dept);
            const nonFormes = matrixDetail.formation.nonFormes.filter((c: any) => c.departement === matrixDetail.dept);
            return (
              <Tabs defaultValue="nonFormes">
                <Tabs.List>
                  <Tabs.Tab value="nonFormes" leftSection={<WarningCircle size={16} weight="bold" />}>
                    Non formes ({nonFormes.length})
                  </Tabs.Tab>
                  <Tabs.Tab value="formes" leftSection={<CheckCircle size={16} weight="bold" />}>
                    Formes ({formes.length})
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="nonFormes" pt="md">
                  {nonFormes.length === 0 ? (
                    <Center py="xl">
                      <Stack align="center" gap="sm">
                        <ThemeIcon variant="light" color="green" size={56} radius="xl">
                          <CheckCircle size={32} weight="duotone" />
                        </ThemeIcon>
                        <Text fw={600}>Tous formes !</Text>
                      </Stack>
                    </Center>
                  ) : (
                    <Stack gap="xs" style={{ maxHeight: 400, overflowY: 'auto' }}>
                      {nonFormes.map((collab: any) => (
                        <Paper key={collab.id} withBorder p="sm" radius="md">
                          <Text size="sm" fw={500}>{collab.nomComplet}</Text>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="formes" pt="md">
                  {formes.length === 0 ? (
                    <Center py="xl">
                      <Stack align="center" gap="sm">
                        <ThemeIcon variant="light" color="red" size={56} radius="xl">
                          <WarningCircle size={32} weight="duotone" />
                        </ThemeIcon>
                        <Text fw={600}>Aucun collaborateur forme</Text>
                      </Stack>
                    </Center>
                  ) : (
                    <Stack gap="xs" style={{ maxHeight: 400, overflowY: 'auto' }}>
                      {formes.map((collab: any) => (
                        <Paper key={collab.id} withBorder p="sm" radius="md">
                          <Group justify="space-between">
                            <Text size="sm" fw={500}>{collab.nomComplet}</Text>
                            <Badge variant="light" color="green" size="sm">
                              {new Date(collab.dateFormation).toLocaleDateString('fr-FR')}
                            </Badge>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Tabs.Panel>
              </Tabs>
            );
          })()}
        </Modal>

        {/* ===== REMINDER MODAL ===== */}
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
              Les rappels seront envoyes par email aux managers selectionnes.
              Assurez-vous que la configuration SMTP est en place.
            </Alert>

            <Text fw={500}>Managers selectionnes : {selectedManagers.length}</Text>

            {/* Message preview */}
            <Paper withBorder p="md">
              <Text size="sm" fw={600} c="dimmed" mb="xs">Apercu du message :</Text>
              <Divider my="xs" />
              <Text size="sm" style={{ lineHeight: 1.6 }}>
                Bonjour [Nom du manager],<br /><br />
                Certains membres de votre equipe n'ont pas encore complete
                les formations obligatoires suivantes :<br />
                - [Liste des formations par collaborateur]<br /><br />
                Merci de vous assurer qu'ils completent ces formations
                dans les meilleurs delais.<br /><br />
                Cordialement,<br />
                L'equipe Formation
              </Text>
            </Paper>

            {/* Recipients list */}
            <Accordion>
              <Accordion.Item value="recipients">
                <Accordion.Control>
                  <Text size="sm">Voir les {selectedManagers.length} destinataires</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Box style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {getSelectedManagersList().map(m => (
                      <Group key={m.id} justify="space-between" py="xs">
                        <Text size="sm">{m.nomComplet}</Text>
                        <Badge size="sm">{m.collaborateursNonFormes.length} a former</Badge>
                      </Group>
                    ))}
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
                Verifier config SMTP
              </Button>
              <Group>
                <Button variant="light" color="gray" onClick={() => setShowReminderModal(false)}>
                  Annuler
                </Button>
                <Button
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

        {/* ===== FORMATION DETAIL MODAL ===== */}
        <Modal
          opened={!!selectedFormation}
          onClose={() => setSelectedFormation(null)}
          title={
            selectedFormation && (
              <Stack gap={2}>
                <Title order={4}>{selectedFormation.nomFormation}</Title>
                <Text size="xs" c="dimmed">
                  {selectedFormation.codeFormation} - {selectedFormation.categorie}
                </Text>
              </Stack>
            )
          }
          size="lg"
          centered
        >
          {selectedFormation && (
            <Tabs value={modalTab} onChange={(v) => setModalTab(v as 'formes' | 'nonFormes')}>
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
                      <ThemeIcon variant="light" color="green" size={56} radius="xl">
                        <CheckCircle size={32} weight="duotone" />
                      </ThemeIcon>
                      <Text size="lg" fw={600}>Tous les collaborateurs sont formes !</Text>
                      <Text size="sm" c="dimmed">Aucun collaborateur n'est en attente de cette formation.</Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="xs">
                    {selectedFormation.nonFormes.map((collab) => (
                      <Paper key={collab.id} withBorder p="sm" radius="md">
                        <Group justify="space-between">
                          <Text size="sm" fw={500}>{collab.nomComplet}</Text>
                          <Text size="xs" c="dimmed">{collab.departement}</Text>
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
                      <ThemeIcon variant="light" color="red" size={56} radius="xl">
                        <WarningCircle size={32} weight="duotone" />
                      </ThemeIcon>
                      <Text size="lg" fw={600}>Aucun collaborateur forme</Text>
                      <Text size="sm" c="dimmed">Personne n'a encore suivi cette formation sur la periode.</Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="xs">
                    {selectedFormation.formes.map((collab) => (
                      <Paper key={collab.id} withBorder p="sm" radius="md">
                        <Group justify="space-between">
                          <Stack gap={2}>
                            <Text size="sm" fw={500}>{collab.nomComplet}</Text>
                            <Text size="xs" c="dimmed">{collab.departement}</Text>
                          </Stack>
                          <Badge variant="light" color="green">
                            {new Date(collab.dateFormation).toLocaleDateString('fr-FR')}
                          </Badge>
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
