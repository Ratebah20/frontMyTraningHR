'use client'

import { useState, useEffect, useRef } from 'react'
import { Text, Badge, RingProgress, Tooltip, useMantineColorScheme } from '@mantine/core'
import { Clock, Users, BookOpen, ChartBar, Lightbulb, TrendUp, Fire } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import axios from 'axios'
import styles from './formations.module.css'

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

export default function FormationsKPIsPage() {
  const [data, setData] = useState<FormationsKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const { colorScheme } = useMantineColorScheme()

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
