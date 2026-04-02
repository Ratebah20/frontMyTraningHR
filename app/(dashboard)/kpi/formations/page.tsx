'use client'

import { useState, useEffect } from 'react'
import { Text, Badge, RingProgress, Tooltip, MultiSelect, Chip, Switch, SegmentedControl } from '@mantine/core'
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
import { PeriodSelector } from '@/components/PeriodSelector'
import { motion } from 'framer-motion'
import axios from 'axios'
import dynamic from 'next/dynamic'
const LazyTauxFormationContratGraphique = dynamic(
  () => import('@/components/charts/TauxFormationContratGraphique').then(mod => mod.TauxFormationContratGraphique),
  { ssr: false, loading: () => <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Chargement du graphique...</div> }
)
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
} as any

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
} as any

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
      whileHover={{ x: 12 }}
    >
      <div className={styles.topRank} data-top={index < 3}>
        {index < 3 ? (
          <Fire size={20} weight="fill" />
        ) : (
          <span>{String(index + 1).padStart(2, '0')}</span>
        )}
      </div>

      <div className={styles.topContent}>
        <div className={styles.topRowHeader}>
          <Tooltip label={formation.nom} position="top" withArrow>
            <h4 className={styles.topName}>{formation.nom}</h4>
          </Tooltip>
          <Badge
            variant="light"
            color={index < 3 ? 'blue' : 'gray'}
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
                style={{ backgroundColor: 'var(--mantine-primary-color-filled)' }}
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

// TauxFormationContratGraphique moved to @/components/charts/TauxFormationContratGraphique
// and loaded via next/dynamic (LazyTauxFormationContratGraphique) for code splitting

export default function FormationsKPIsPage() {
  const [data, setData] = useState<FormationsKPIs | null>(null)
  const [loading, setLoading] = useState(true)

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
    <div className={styles.container}>
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

      {/* Overview Content */}
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
              sections={[{ value: tauxUtilisation, color: 'var(--mantine-primary-color-filled)' }]}
              label={
                <div className={styles.ringLabel}>
                  <Text size="2rem" fw={800}>{tauxUtilisation}</Text>
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
                    />
                  </div>

                  {/* Switch pour inclure les inactifs */}
                  <div className={styles.contratFilterGroup}>
                    <Switch
                      checked={includeInactifs}
                      onChange={(event) => setIncludeInactifs(event.currentTarget.checked)}
                      size="sm"
                      label={
                        <span className={styles.contratFilterLabel} style={{ marginLeft: 8 }}>
                          <UserMinus size={16} weight="bold" style={{ marginRight: 4 }} />
                          Inclure inactifs
                        </span>
                      }
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
                <LazyTauxFormationContratGraphique
                  data={tauxContratData}
                  selectedContrats={selectedContrats}
                  selectedAnnee={selectedAnnee}
                  chartContainerClass={styles.chartContainer}
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
          <Badge variant="filled" size="lg" className={styles.topBadgeMain}>
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
          <Lightbulb size={20} weight="fill" color="var(--mantine-color-yellow-5)" />
          <span>
            <strong>{data.summary.nouvellesFormations}</strong> nouvelles formations ajoutees ces 30 derniers jours
          </span>
        </div>
      </motion.footer>
    </div>
  )
}
