'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Text, Badge, RingProgress, Tooltip, useMantineColorScheme, MultiSelect, Chip, Switch, SegmentedControl, Tabs, Progress, Accordion, Modal, Button, Stack, Checkbox, Alert, Divider, Paper, Group, Select } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Users, BookOpen, ChartBar, Lightbulb, TrendUp, Fire, Funnel, UsersFour, ChartLine, ListBullets, UserMinus, WarningCircle, ShieldCheck, X, CheckCircle, Eye, Buildings, EnvelopeSimple, Info, CaretDown, UserList } from '@phosphor-icons/react'
import { PeriodSelector } from '@/components/PeriodSelector'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, LabelList, Cell } from 'recharts'
import { statsService, notificationsService } from '@/lib/services'
import styles from './formations.module.css'

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
      className={styles.kpiCard}
      variants={cardVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ delay }}
    >
      <div className={styles.kpiCardInner}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiTitle}>{title}</span>
          <div className={styles.kpiIcon} data-color={color}>
            {icon}
          </div>
        </div>

        <motion.div className={styles.kpiValue} variants={numberVariants}>
          <span className={styles.kpiNumber}>{animatedValue.toLocaleString('fr-FR')}</span>
          {suffix && <span className={styles.kpiSuffix}>{suffix}</span>}
        </motion.div>

        {subtitle && (
          <div className={styles.kpiSubtitle}>{subtitle}</div>
        )}

        <div className={styles.kpiGlow} data-color={color} />
      </div>
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
      className={styles.topRow}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.1, type: 'spring', stiffness: 100 }}
      whileHover={{ x: 12, backgroundColor: 'rgba(255, 121, 0, 0.05)' }}
    >
      <div className={styles.topRank} data-top={index < 3}>
        {index < 3 ? (
          <Fire size={20} weight="fill" />
        ) : (
          <span>{String(index + 1).padStart(2, '0')}</span>
        )}
      </div>

      <div className={styles.topContent}>
        <div className={styles.topHeader}>
          <Tooltip label={formation.nom} position="top" withArrow>
            <h4 className={styles.topName}>{formation.nom}</h4>
          </Tooltip>
          <Badge
            variant="light"
            color={index < 3 ? 'orange' : 'gray'}
            size="sm"
            className={styles.topBadge}
          >
            {formation.categorie}
          </Badge>
        </div>

        <div className={styles.topBar}>
          <motion.div
            className={styles.topProgress}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.6 + index * 0.1, ease: 'easeOut' }}
          />
        </div>

        <div className={styles.topStats}>
          <span>{formation.sessions} sessions</span>
          <span className={styles.topParticipants}>
            <Users size={14} weight="bold" />
            {participants}
          </span>
        </div>
      </div>
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
  // Filtrer les contrats à afficher
  const contratsAffiches = data.parContrat.filter(c =>
    selectedContrats.length === 0 || selectedContrats.includes(c.contratId.toString())
  )

  // Si une année spécifique est sélectionnée
  if (selectedAnnee !== 'all') {
    return (
      <div className={styles.contratChartContainer}>
        {contratsAffiches.map((contrat, index) => {
          const stats = contrat.annees[selectedAnnee]
          if (!stats || stats.effectif === 0) return null

          return (
            <motion.div
              key={contrat.contratId}
              className={styles.contratRow}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={styles.contratInfo}>
                <div
                  className={styles.contratColorDot}
                  style={{ backgroundColor: getContractColor(contrat.typeContrat) }}
                />
                <span className={styles.contratName}>{contrat.typeContrat}</span>
                <span className={styles.contratEffectif}>
                  {stats.formes}/{stats.effectif}
                </span>
              </div>
              <div className={styles.contratBarContainer}>
                <motion.div
                  className={styles.contratBar}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.tauxFormation}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                  style={{ backgroundColor: getContractColor(contrat.typeContrat) }}
                />
              </div>
              <span className={styles.contratTaux}>{stats.tauxFormation}%</span>
            </motion.div>
          )
        })}

        {/* Total */}
        {data.totauxParAnnee[selectedAnnee] && (
          <motion.div
            className={`${styles.contratRow} ${styles.contratRowTotal}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: contratsAffiches.length * 0.1 }}
          >
            <div className={styles.contratInfo}>
              <span className={styles.contratName}>Total</span>
              <span className={styles.contratEffectif}>
                {data.totauxParAnnee[selectedAnnee].formes}/{data.totauxParAnnee[selectedAnnee].effectif}
              </span>
            </div>
            <div className={styles.contratBarContainer}>
              <motion.div
                className={styles.contratBar}
                initial={{ width: 0 }}
                animate={{ width: `${data.totauxParAnnee[selectedAnnee].tauxFormation}%` }}
                transition={{ duration: 0.8, delay: contratsAffiches.length * 0.1, ease: 'easeOut' }}
                style={{ backgroundColor: '#ff7900' }}
              />
            </div>
            <span className={styles.contratTaux}>
              {data.totauxParAnnee[selectedAnnee].tauxFormation}%
            </span>
          </motion.div>
        )}
      </div>
    )
  }

  // Vue multi-années (comparaison)
  return (
    <div className={styles.contratMultiYearContainer}>
      {contratsAffiches.map((contrat, contratIndex) => (
        <motion.div
          key={contrat.contratId}
          className={styles.contratMultiYearRow}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: contratIndex * 0.15 }}
        >
          <div className={styles.contratMultiYearHeader}>
            <div
              className={styles.contratColorDot}
              style={{ backgroundColor: getContractColor(contrat.typeContrat) }}
            />
            <span className={styles.contratName}>{contrat.typeContrat}</span>
          </div>
          <div className={styles.contratYearBars}>
            {data.annees.map((annee, anneeIndex) => {
              const stats = contrat.annees[annee]
              if (!stats) return null

              return (
                <Tooltip
                  key={annee}
                  label={`${annee}: ${stats.formes}/${stats.effectif} formes (${stats.tauxFormation}%)`}
                  withArrow
                >
                  <div className={styles.contratYearBarWrapper}>
                    <motion.div
                      className={styles.contratYearBar}
                      initial={{ height: 0 }}
                      animate={{ height: `${stats.tauxFormation}%` }}
                      transition={{ duration: 0.8, delay: contratIndex * 0.1 + anneeIndex * 0.05 }}
                      style={{
                        backgroundColor: getContractColor(contrat.typeContrat),
                        opacity: 0.6 + (anneeIndex / data.annees.length) * 0.4
                      }}
                    />
                    <span className={styles.contratYearLabel}>{annee}</span>
                  </div>
                </Tooltip>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Composant graphique Recharts pour le taux de formation par contrat
function TauxFormationContratGraphique({
  data,
  selectedContrats,
  selectedAnnee
}: {
  data: TauxFormationContrat
  selectedContrats: string[]
  selectedAnnee: number | 'all'
}) {
  // Filtrer les contrats à afficher
  const contratsAffiches = data.parContrat.filter(c =>
    selectedContrats.length === 0 || selectedContrats.includes(c.contratId.toString())
  )

  // Préparer les données pour le graphique
  if (selectedAnnee !== 'all') {
    // Vue année unique - Bar chart horizontal
    const chartData = contratsAffiches
      .map(contrat => {
        const stats = contrat.annees[selectedAnnee]
        if (!stats || stats.effectif === 0) return null
        return {
          name: contrat.typeContrat,
          taux: stats.tauxFormation,
          formes: stats.formes,
          effectif: stats.effectif,
          fill: getContractColor(contrat.typeContrat)
        }
      })
      .filter(Boolean)

    // Ajouter le total
    if (data.totauxParAnnee[selectedAnnee]) {
      chartData.push({
        name: 'Total',
        taux: data.totauxParAnnee[selectedAnnee].tauxFormation,
        formes: data.totauxParAnnee[selectedAnnee].formes,
        effectif: data.totauxParAnnee[selectedAnnee].effectif,
        fill: '#ff7900'
      })
    }

    return (
      <motion.div
        className={styles.chartContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="rgba(255,255,255,0.7)"
              tick={{ fill: 'white' }}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="rgba(255,255,255,0.7)"
              tick={{ fill: 'white' }}
              fontSize={12}
              width={90}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(26, 26, 46, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white'
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value}% (${props.payload.formes}/${props.payload.effectif} formés)`,
                'Taux de formation'
              ]}
            />
            <Bar dataKey="taux" radius={[0, 4, 4, 0]}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry?.fill || '#6b7280'} />
              ))}
              <LabelList
                dataKey="taux"
                position="right"
                fill="#ffffff"
                fontSize={12}
                fontWeight={600}
                formatter={(value: number) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    )
  }

  // Vue multi-années - Line chart ou grouped bar chart
  const chartData = data.annees.map(annee => {
    const point: any = { annee: annee.toString() }

    contratsAffiches.forEach(contrat => {
      const stats = contrat.annees[annee]
      if (stats) {
        point[contrat.typeContrat] = stats.tauxFormation
      }
    })

    // Ajouter le total
    if (data.totauxParAnnee[annee]) {
      point['Total'] = data.totauxParAnnee[annee].tauxFormation
    }

    return point
  })

  return (
    <motion.div
      className={styles.chartContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="annee"
            stroke="rgba(255,255,255,0.7)"
            tick={{ fill: 'white' }}
            fontSize={12}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="rgba(255,255,255,0.7)"
            tick={{ fill: 'white' }}
            fontSize={12}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: 'rgba(26, 26, 46, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'white'
            }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Legend
            wrapperStyle={{ color: 'white', paddingTop: '20px' }}
          />
          {contratsAffiches.map(contrat => (
            <Line
              key={contrat.contratId}
              type="monotone"
              dataKey={contrat.typeContrat}
              stroke={getContractColor(contrat.typeContrat)}
              strokeWidth={2}
              dot={{ fill: getContractColor(contrat.typeContrat), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="Total"
            stroke="#ff7900"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: '#ff7900', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<FormationsKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const { colorScheme } = useMantineColorScheme()

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
      <div className={styles.loadingContainer}>
        <motion.div
          className={styles.loadingOrb}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.p
          className={styles.loadingText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Chargement des indicateurs...
        </motion.p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.errorContainer}>
        <motion.div
          className={styles.errorIcon}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          !
        </motion.div>
        <h2>Erreur de chargement</h2>
        <p>Impossible de recuperer les donnees</p>
        <motion.button
          onClick={fetchData}
          className={styles.retryButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Reessayer
        </motion.button>
      </div>
    )
  }

  // Calculate derived metrics
  const tauxUtilisation = data.summary.formationsAvecSessions > 0
    ? Math.round((data.summary.formationsAvecSessions / data.summary.totalFormations) * 100)
    : 0
  const maxParticipants = Math.max(...(data.topFormations.map(f => f.participants || 0)), 1)

  return (
    <div className={styles.container} data-theme={colorScheme}>
      {/* Animated background */}
      <div className={styles.bgEffects}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />
        <div className={styles.bgNoise} />
      </div>

      {/* Header */}
      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        <div className={styles.headerContent}>
          <div>
            <motion.h1
              className={styles.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              KPIs Formations
            </motion.h1>
            <motion.p
              className={styles.subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Vue d'ensemble des indicateurs cles de performance
            </motion.p>
          </div>
          <motion.div
            className={styles.liveTag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className={styles.liveDot} />
            Temps reel
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <PeriodSelector
            periode={periode}
            date={date}
            dateDebut={dateDebut}
            dateFin={dateFin}
            onChange={(p, d) => { setPeriode(p); setDate(d); }}
            onDateRangeChange={(debut, fin) => { setDateDebut(debut); setDateFin(fin); }}
          />
        </motion.div>
      </motion.header>

      {/* Tabs Navigation */}
      <motion.div
        className={styles.tabsContainer}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <Tabs value={activeTab} onChange={handleTabChange} variant="pills" color="orange">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<ChartBar size={16} weight="bold" />}>
              Vue d'ensemble
            </Tabs.Tab>
            <Tabs.Tab value="obligatoires" leftSection={<ShieldCheck size={16} weight="bold" />}>
              Formations obligatoires
              {mandatoryData?.stats?.totalFormations && mandatoryData.stats.totalFormations > 0 && (
                <Badge ml="xs" size="sm" variant="filled" color="orange">
                  {mandatoryData.stats.totalFormations}
                </Badge>
              )}
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </motion.div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <>
      {/* KPIs */}
      <motion.section
        className={styles.kpiGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
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
      </motion.section>

      {/* Detailed sections */}
      <div className={styles.detailsGrid}>
        {/* Utilization Ring */}
        <motion.div
          className={styles.utilizationCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className={styles.sectionTitle}>Taux d'utilisation</h3>
          <p className={styles.sectionSubtitle}>Formations avec au moins une session</p>

          <div className={styles.ringContainer}>
            <RingProgress
              size={180}
              thickness={14}
              roundCaps
              sections={[{ value: tauxUtilisation, color: '#ff7900' }]}
              label={
                <div className={styles.ringLabel}>
                  <Text size="2rem" fw={800} c="white">{tauxUtilisation}</Text>
                  <Text size="sm" c="dimmed">%</Text>
                </div>
              }
            />
          </div>

          <div className={styles.utilizationStats}>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>{data.summary.formationsAvecSessions}</span>
              <span className={styles.statLabel}>Utilisees</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBox}>
              <span className={styles.statNumber}>{data.summary.formationsOrphelines}</span>
              <span className={styles.statLabel}>Inactives</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Taux de Formation par Type de Contrat */}
      {(tauxContratData || tauxContratLoading) && (
        <motion.section
          className={styles.contratSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          {/* Overlay de chargement */}
          {tauxContratLoading && (
            <div className={styles.contratLoadingOverlay}>
              <motion.div
                className={styles.contratLoadingSpinner}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span>Chargement des donnees...</span>
            </div>
          )}
          <div className={styles.contratHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                <UsersFour size={24} weight="bold" style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Taux de formation par type de contrat
              </h3>
              <p className={styles.sectionSubtitle}>
                Pourcentage d'effectif forme par type de contrat et par annee
              </p>
            </div>
          </div>

          {/* Filtres et contenu - seulement si données disponibles */}
          {tauxContratData && (
            <>
              {/* Filtres */}
              <div className={styles.contratFilters}>
                {/* Ligne 1: Année et Vue */}
                <div className={styles.contratFiltersRow}>
                  {/* Sélection de l'année */}
                  <div className={styles.contratFilterGroup}>
                    <span className={styles.contratFilterLabel}>Annee :</span>
                    <div className={styles.contratChips}>
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
                    </div>
                  </div>

                  {/* Mode de vue */}
                  <div className={styles.contratFilterGroup}>
                    <SegmentedControl
                      value={viewMode}
                      onChange={(value) => setViewMode(value as 'list' | 'chart')}
                      data={[
                        {
                          value: 'list',
                          label: (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ListBullets size={16} weight="bold" />
                              <span>Liste</span>
                            </div>
                          )
                        },
                        {
                          value: 'chart',
                          label: (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ChartLine size={16} weight="bold" />
                              <span>Graphique</span>
                            </div>
                          )
                        }
                      ]}
                      size="sm"
                      color="orange"
                      styles={{
                        root: {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Ligne 2: Contrats et Inactifs */}
                <div className={styles.contratFiltersRow}>
                  {/* Sélection des types de contrat */}
                  <div className={styles.contratFilterGroup}>
                    <span className={styles.contratFilterLabel}>
                      <Funnel size={16} weight="bold" style={{ marginRight: 4 }} />
                      Contrats :
                    </span>
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
                      className={styles.contratMultiSelect}
                      styles={{
                        input: {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        },
                        dropdown: {
                          backgroundColor: '#1a1a2e',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    />
                  </div>

                  {/* Switch pour inclure les inactifs */}
                  <div className={styles.contratFilterGroup}>
                    <Switch
                      checked={includeInactifs}
                      onChange={(event) => setIncludeInactifs(event.currentTarget.checked)}
                      color="orange"
                      size="sm"
                      label={
                        <span className={styles.contratFilterLabel} style={{ marginLeft: 8 }}>
                          <UserMinus size={16} weight="bold" style={{ marginRight: 4 }} />
                          Inclure inactifs
                        </span>
                      }
                      styles={{
                        track: {
                          backgroundColor: includeInactifs ? undefined : 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bandeau d'avertissement pour les inactifs sans date */}
              {includeInactifs && tauxContratData?.meta?.inactifsSansDate > 0 && (
                <div className={styles.warningBanner}>
                  <WarningCircle size={20} weight="fill" />
                  <span>
                    <strong>{tauxContratData.meta.inactifsSansDate}</strong> collaborateurs inactifs
                    n'ont pas de date d'inactivation renseignee. Ils sont comptes sur toutes les annees.
                  </span>
                </div>
              )}

              {/* Graphique ou Liste selon le mode */}
              {viewMode === 'list' ? (
                <TauxFormationContratChart
                  data={tauxContratData}
                  selectedContrats={selectedContrats}
                  selectedAnnee={selectedAnnee}
                />
              ) : (
                <TauxFormationContratGraphique
                  data={tauxContratData}
                  selectedContrats={selectedContrats}
                  selectedAnnee={selectedAnnee}
                />
              )}
            </>
          )}
        </motion.section>
      )}

      {/* Top Formations */}
      <motion.section
        className={styles.topSection}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className={styles.topHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Top Formations</h3>
            <p className={styles.sectionSubtitle}>Les plus suivies par vos collaborateurs</p>
          </div>
          <Badge color="orange" variant="filled" size="lg" className={styles.topBadgeMain}>
            TOP 5
          </Badge>
        </div>

        <div className={styles.topList}>
          {data.topFormations.slice(0, 5).map((formation, index) => (
            <TopFormationRow
              key={formation.id}
              formation={formation}
              index={index}
              maxParticipants={maxParticipants}
            />
          ))}
        </div>
      </motion.section>

      {/* Footer insight */}
      <motion.footer
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className={styles.insightCard}>
          <Lightbulb size={20} weight="fill" color="#fbbf24" />
          <span>
            <strong>{data.summary.nouvellesFormations}</strong> nouvelles formations ajoutees ces 30 derniers jours
          </span>
        </div>
      </motion.footer>
        </>
      )}

      {/* Tab Content: Formations Obligatoires */}
      {activeTab === 'obligatoires' && (
        <div className={styles.mandatorySection}>
          {mandatoryLoading ? (
            <div className={styles.mandatoryLoadingOverlay}>
              <motion.div
                className={styles.loadingOrb}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span>Chargement des formations obligatoires...</span>
            </div>
          ) : mandatoryData?.stats?.totalFormations === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <ShieldCheck size={40} weight="duotone" />
              </div>
              <h3>Aucune formation obligatoire</h3>
              <p>Aucune formation n'est marquee comme obligatoire dans le systeme.</p>
            </div>
          ) : mandatoryData && (
            <>
              {/* Stats Cards */}
              <motion.div
                className={styles.mandatoryStatsGrid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
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
              </motion.div>

              {/* Formations Table */}
              <motion.div
                className={styles.mandatoryTableSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className={styles.sectionTitle}>Detail par formation</h3>
                <p className={styles.sectionSubtitle}>Taux de conformite pour chaque formation obligatoire</p>

                <table className={styles.mandatoryTable}>
                  <thead>
                    <tr>
                      <th>Formation</th>
                      <th>Categorie</th>
                      <th>Formes</th>
                      <th>Non formes</th>
                      <th>Taux</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mandatoryData.formations.map((formation, index) => (
                      <motion.tr
                        key={formation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{formation.nomFormation}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{formation.codeFormation}</div>
                          </div>
                        </td>
                        <td>
                          <Badge variant="light" color="gray" size="sm">{formation.categorie}</Badge>
                        </td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{formation.collaborateursFormes}</td>
                        <td style={{ color: '#ef4444', fontWeight: 600 }}>{formation.collaborateursNonFormes}</td>
                        <td>
                          <span
                            className={styles.tauxBadge}
                            data-level={formation.tauxConformite >= 80 ? 'high' : formation.tauxConformite >= 50 ? 'medium' : 'low'}
                          >
                            {formation.tauxConformite}%
                          </span>
                        </td>
                        <td>
                          <button
                            className={styles.detailButton}
                            onClick={() => {
                              setSelectedFormation(formation)
                              setModalTab('nonFormes')
                            }}
                          >
                            <Eye size={14} weight="bold" style={{ marginRight: 4 }} />
                            Details
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>

              {/* Department Progress */}
              <motion.div
                className={styles.mandatoryDeptSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className={styles.sectionTitle}>
                  <Buildings size={24} weight="bold" style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Conformite par departement
                </h3>
                <p className={styles.sectionSubtitle}>Pourcentage de collaborateurs ayant complete toutes les formations obligatoires</p>

                <div className={styles.deptProgressList}>
                  {mandatoryData.parDepartement.slice(0, 10).map((dept, index) => (
                    <motion.div
                      key={dept.departementId}
                      className={styles.deptProgressRow}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <span className={styles.deptName}>{dept.departement}</span>
                      <div className={styles.deptBarContainer}>
                        <motion.div
                          className={styles.deptBar}
                          data-level={dept.tauxConformite >= 80 ? 'high' : dept.tauxConformite >= 50 ? 'medium' : 'low'}
                          initial={{ width: 0 }}
                          animate={{ width: `${dept.tauxConformite}%` }}
                          transition={{ duration: 0.8, delay: 0.6 + index * 0.05, ease: 'easeOut' }}
                        />
                      </div>
                      <span className={styles.deptStats}>{dept.formes}/{dept.totalCollaborateurs}</span>
                      <span className={styles.deptTaux}>{dept.tauxConformite}%</span>
                    </motion.div>
                  ))}
                </div>

                {mandatoryData.parDepartement.length > 10 && (
                  <Text size="sm" c="dimmed" ta="center" mt="md">
                    +{mandatoryData.parDepartement.length - 10} autres departements
                  </Text>
                )}
              </motion.div>

              {/* Vue par Manager - Section rappels */}
              <motion.div
                className={styles.managerViewSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className={styles.managerViewHeader}>
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <UserList size={24} weight="bold" style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Vue par departement et manager
                    </h3>
                    <p className={styles.sectionSubtitle}>
                      Selectionnez les managers a notifier pour les formations obligatoires manquantes
                    </p>
                  </div>
                  <Select
                    placeholder="Tous les departements"
                    data={departementOptions}
                    value={selectedDept}
                    onChange={setSelectedDept}
                    clearable
                    style={{ minWidth: 220 }}
                    styles={{
                      input: {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white'
                      },
                      dropdown: {
                        backgroundColor: '#1a1a2e',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      },
                      option: {
                        color: 'white'
                      }
                    }}
                  />
                </div>

                {/* Actions groupées */}
                <div className={styles.managerActions}>
                  <Checkbox
                    label="Selectionner tous les managers"
                    checked={!!(byManagerData && selectedManagers.length === byManagerData.departements.flatMap(d => d.managers).length && selectedManagers.length > 0)}
                    indeterminate={!!(selectedManagers.length > 0 && byManagerData && selectedManagers.length < byManagerData.departements.flatMap(d => d.managers).length)}
                    onChange={toggleSelectAllManagers}
                    styles={{
                      label: { color: 'rgba(255, 255, 255, 0.8)' }
                    }}
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
                </div>

                {/* Loading state */}
                {byManagerLoading ? (
                  <div className={styles.managerLoadingState}>
                    <motion.div
                      className={styles.loadingOrb}
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span>Chargement de la vue par manager...</span>
                  </div>
                ) : byManagerData && byManagerData.departements.length === 0 && byManagerData.sansManager.length === 0 ? (
                  <div className={styles.managerEmptyState}>
                    <div className={styles.managerEmptyIcon}>
                      <CheckCircle size={40} weight="duotone" />
                    </div>
                    <h4>Tous les collaborateurs sont conformes</h4>
                    <p>Aucun collaborateur n'a de formation obligatoire manquante.</p>
                  </div>
                ) : byManagerData && (
                  <>
                    {/* Stats récapitulatifs */}
                    <div className={styles.managerStatsBar}>
                      <div className={styles.managerStat}>
                        <Buildings size={16} weight="bold" />
                        <span>{byManagerData.stats.totalDepartements} departements</span>
                      </div>
                      <div className={styles.managerStat}>
                        <UserList size={16} weight="bold" />
                        <span>{byManagerData.stats.totalManagers} managers</span>
                      </div>
                      <div className={styles.managerStat}>
                        <WarningCircle size={16} weight="bold" />
                        <span>{byManagerData.stats.totalCollaborateursNonFormes} collaborateurs a former</span>
                      </div>
                    </div>

                    {/* Accordéon par département */}
                    <Accordion
                      classNames={{
                        root: styles.managerAccordion,
                        item: styles.accordionItem,
                        control: styles.accordionControl,
                        content: styles.accordionContent,
                        chevron: styles.accordionChevron
                      }}
                      multiple
                      defaultValue={byManagerData.departements.slice(0, 2).map(d => `dept-${d.id}`)}
                    >
                      {byManagerData.departements.map(dept => (
                        <Accordion.Item key={dept.id} value={`dept-${dept.id}`}>
                          <Accordion.Control>
                            <Group gap="sm">
                              <Buildings size={20} weight="bold" style={{ color: '#ff7900' }} />
                              <Text fw={600} c="white">{dept.nom}</Text>
                              <Badge color="red" variant="filled" size="sm">{dept.totalNonFormes} non formes</Badge>
                              <Badge color="gray" variant="light" size="sm">{dept.managers.length} managers</Badge>
                            </Group>
                          </Accordion.Control>
                          <Accordion.Panel>
                            <div className={styles.managerList}>
                              {dept.managers.map(manager => (
                                <motion.div
                                  key={manager.id}
                                  className={styles.managerRow}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                                >
                                  <Checkbox
                                    checked={selectedManagers.includes(manager.id)}
                                    onChange={() => toggleManager(manager.id)}
                                    styles={{
                                      root: { alignSelf: 'flex-start', marginTop: 4 }
                                    }}
                                  />
                                  <div className={styles.managerInfo}>
                                    <div className={styles.managerHeader}>
                                      <Text fw={600} c="white" size="sm">{manager.nomComplet}</Text>
                                      <Badge color="orange" variant="light" size="xs">
                                        {manager.totalSubordonnes} collaborateur{manager.totalSubordonnes > 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                    <div className={styles.collaborateursList}>
                                      {manager.collaborateursNonFormes.map(collab => (
                                        <div key={collab.id} className={styles.collaborateurItem}>
                                          <Text size="xs" c="dimmed">{collab.nomComplet}</Text>
                                          <div className={styles.formationsManquantes}>
                                            {collab.formationsManquantes.map(f => (
                                              <Badge key={f.id} size="xs" color="pink" variant="light">
                                                {f.nomFormation}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </Accordion.Panel>
                        </Accordion.Item>
                      ))}
                    </Accordion>

                    {/* Collaborateurs sans manager */}
                    {byManagerData.sansManager.length > 0 && (
                      <div className={styles.sansManagerSection}>
                        <h4 className={styles.sansManagerTitle}>
                          <WarningCircle size={18} weight="bold" style={{ marginRight: 6, color: '#f59e0b' }} />
                          Collaborateurs sans manager ({byManagerData.sansManager.length})
                        </h4>
                        <div className={styles.sansManagerList}>
                          {byManagerData.sansManager.map(collab => (
                            <div key={collab.id} className={styles.sansManagerItem}>
                              <Text size="sm" c="white">{collab.nomComplet}</Text>
                              <Text size="xs" c="dimmed">{collab.departement}</Text>
                              <div className={styles.formationsManquantes}>
                                {collab.formationsManquantes.map(f => (
                                  <Badge key={f.id} size="xs" color="pink" variant="light">
                                    {f.nomFormation}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </>
          )}
        </div>
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
        styles={{
          header: { backgroundColor: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.1)' },
          title: { color: 'white', fontWeight: 700 },
          body: { backgroundColor: '#1a1a2e' },
          close: { color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }
        }}
      >
        <Stack>
          <Alert color="blue" icon={<Info size={20} weight="bold" />} variant="light">
            Les rappels seront envoyés par email aux managers sélectionnés.
            Assurez-vous que la configuration SMTP est en place.
          </Alert>

          <Text fw={500} c="white">Managers selectionnes : {selectedManagers.length}</Text>

          {/* Preview du message */}
          <Paper withBorder p="md" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <Text size="sm" fw={600} c="dimmed" mb="xs">Apercu du message :</Text>
            <Divider my="xs" color="rgba(255,255,255,0.1)" />
            <Text size="sm" c="white" style={{ lineHeight: 1.6 }}>
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
                <Text size="sm" c="white">Voir les {selectedManagers.length} destinataires</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {getSelectedManagersList().map(m => (
                    <Group key={m.id} justify="space-between" py="xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Text size="sm" c="white">{m.nomComplet}</Text>
                      <Badge size="sm" color="orange">{m.collaborateursNonFormes.length} a former</Badge>
                    </Group>
                  ))}
                </div>
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
      <AnimatePresence>
        {selectedFormation && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFormation(null)}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>{selectedFormation.nomFormation}</h2>
                  <p className={styles.modalSubtitle}>
                    {selectedFormation.codeFormation} - {selectedFormation.categorie}
                  </p>
                </div>
                <button className={styles.modalClose} onClick={() => setSelectedFormation(null)}>
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalTabs}>
                  <button
                    className={styles.modalTab}
                    data-active={modalTab === 'nonFormes'}
                    onClick={() => setModalTab('nonFormes')}
                  >
                    <WarningCircle size={16} weight="bold" style={{ marginRight: 6 }} />
                    Non formes ({selectedFormation.collaborateursNonFormes})
                  </button>
                  <button
                    className={styles.modalTab}
                    data-active={modalTab === 'formes'}
                    onClick={() => setModalTab('formes')}
                  >
                    <CheckCircle size={16} weight="bold" style={{ marginRight: 6 }} />
                    Formes ({selectedFormation.collaborateursFormes})
                  </button>
                </div>

                {modalTab === 'nonFormes' ? (
                  selectedFormation.nonFormes.length === 0 ? (
                    <div className={styles.modalEmptyState}>
                      <div className={styles.modalEmptyIcon}>
                        <CheckCircle size={32} weight="duotone" />
                      </div>
                      <Text size="lg" fw={600} c="white">Tous les collaborateurs sont formes !</Text>
                      <Text size="sm" c="dimmed">Aucun collaborateur n'est en attente de cette formation.</Text>
                    </div>
                  ) : (
                    <div className={styles.modalList}>
                      {selectedFormation.nonFormes.map((collab) => (
                        <div key={collab.id} className={styles.modalListItem}>
                          <div>
                            <span className={styles.modalListName}>{collab.nomComplet}</span>
                            <span className={styles.modalListDept}>- {collab.departement}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  selectedFormation.formes.length === 0 ? (
                    <div className={styles.modalEmptyState}>
                      <div className={styles.modalEmptyIcon} style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                        <WarningCircle size={32} weight="duotone" color="#ef4444" />
                      </div>
                      <Text size="lg" fw={600} c="white">Aucun collaborateur forme</Text>
                      <Text size="sm" c="dimmed">Personne n'a encore suivi cette formation sur la periode.</Text>
                    </div>
                  ) : (
                    <div className={styles.modalList}>
                      {selectedFormation.formes.map((collab) => (
                        <div key={collab.id} className={styles.modalListItem}>
                          <div>
                            <span className={styles.modalListName}>{collab.nomComplet}</span>
                            <span className={styles.modalListDept}>- {collab.departement}</span>
                          </div>
                          <span className={styles.modalListDate}>
                            {new Date(collab.dateFormation).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
