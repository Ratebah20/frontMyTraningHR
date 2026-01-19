'use client'

import { useState, useEffect, useRef } from 'react'
import { Text, Badge, RingProgress, Tooltip, useMantineColorScheme, MultiSelect, Chip, Switch, SegmentedControl } from '@mantine/core'
import { Clock, Users, BookOpen, ChartBar, Lightbulb, TrendUp, Fire, Funnel, UsersFour, ChartLine, ListBullets, UserMinus, WarningCircle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, LabelList, Cell } from 'recharts'
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
function useAnimatedCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current || end === 0) return
    startedRef.current = true

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)
      setCount(Math.floor(easeOutExpo * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  return count
}

// Hero KPI Card - Large featured metric
function HeroKPICard({
  title,
  value,
  suffix = '',
  subtitle,
  icon,
  gradient
}: {
  title: string
  value: number
  suffix?: string
  subtitle?: string
  icon: React.ReactNode
  gradient: string
}) {
  const animatedValue = useAnimatedCounter(value)

  return (
    <motion.div
      className={styles.heroCard}
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -8 }}
      style={{ background: gradient }}
    >
      <div className={styles.heroGlow} />
      <div className={styles.heroContent}>
        <div className={styles.heroIcon}>{icon}</div>
        <motion.div className={styles.heroValue} variants={numberVariants}>
          <span className={styles.heroNumber}>{animatedValue.toLocaleString('fr-FR')}</span>
          {suffix && <span className={styles.heroSuffix}>{suffix}</span>}
        </motion.div>
        <div className={styles.heroLabel}>
          <span className={styles.heroTitle}>{title}</span>
          {subtitle && <span className={styles.heroSubtitle}>{subtitle}</span>}
        </div>
      </div>
      <div className={styles.heroPattern} />
    </motion.div>
  )
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

// Category item with color indicator
function CategoryRow({
  category,
  index
}: {
  category: FormationsKPIs['repartitionCategories'][0]
  index: number
}) {
  const colors = ['orange', 'cyan', 'violet', 'pink', 'teal', 'yellow']
  const color = colors[index % colors.length]

  return (
    <motion.div
      className={styles.categoryRow}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className={styles.categoryIndicator} data-color={color} />
      <div className={styles.categoryInfo}>
        <span className={styles.categoryName}>{category.nom}</span>
        <span className={styles.categoryCount}>{category.formations} formations</span>
      </div>
      <div className={styles.categoryValue}>{category.pourcentage}%</div>
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

export default function FormationsKPIsPage() {
  const [data, setData] = useState<FormationsKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const { colorScheme } = useMantineColorScheme()

  // États pour le taux de formation par contrat
  const [tauxContratData, setTauxContratData] = useState<TauxFormationContrat | null>(null)
  const [tauxContratLoading, setTauxContratLoading] = useState(true)
  const [selectedContrats, setSelectedContrats] = useState<string[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | 'all'>('all')
  const [includeInactifs, setIncludeInactifs] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list')

  useEffect(() => {
    fetchData()
  }, [])

  // Recharger les données quand includeInactifs change
  useEffect(() => {
    fetchTauxContratData()
  }, [includeInactifs])

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
  const totalParticipants = data.catalogue.reduce((sum: number, f) => sum + f.participants, 0)
  const totalHeures = data.catalogue.reduce((sum: number, f) => sum + f.heuresTotal, 0)
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
      </motion.header>

      {/* Hero Section - Main KPIs */}
      <motion.section
        className={styles.heroSection}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <HeroKPICard
          title="Heures de formation"
          value={totalHeures}
          suffix="h"
          subtitle="Temps total investi"
          icon={<Clock size={32} weight="bold" />}
          gradient="linear-gradient(135deg, #ff7900 0%, #ff9a44 50%, #ffb366 100%)"
        />
        <HeroKPICard
          title="Participants"
          value={totalParticipants}
          subtitle="Collaborateurs formes"
          icon={<Users size={32} weight="bold" />}
          gradient="linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)"
        />
      </motion.section>

      {/* Secondary KPIs */}
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

        {/* Categories */}
        <motion.div
          className={styles.categoriesCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className={styles.sectionTitle}>Categories</h3>
          <p className={styles.sectionSubtitle}>Distribution du catalogue</p>

          <div className={styles.categoryList}>
            {data.repartitionCategories.slice(0, 5).map((category, index) => (
              <CategoryRow key={category.nom} category={category} index={index} />
            ))}
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
    </div>
  )
}
