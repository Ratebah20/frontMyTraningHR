'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users,
  UserCircle,
  Briefcase,
  Trophy,
  GenderMale,
  GenderFemale,
  ChartBar,
  UsersFour,
  Warning,
  Crown,
  Handshake,
  Clock,
  Buildings,
  UserSwitch,
  ToggleLeft,
  ToggleRight,
  Scales,
  ShieldCheck,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { statsService } from '@/lib/services'
import { DetailedKPIsResponse, ComplianceEthicsKPIsResponse } from '@/lib/types'
import { PeriodSelector } from '@/components/PeriodSelector'
import styles from './collaborateurs.module.css'

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

// Hook pour animation des compteurs
function useAnimatedCounter(endValue: number, duration: number = 1500) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (endValue === 0) {
      setCount(0)
      return
    }

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentCount = Math.floor(easeOut * endValue)

      if (currentCount !== countRef.current) {
        countRef.current = currentCount
        setCount(currentCount)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(endValue)
      }
    }

    startTimeRef.current = null
    requestAnimationFrame(animate)
  }, [endValue, duration])

  return count
}

// Composant Hero Card
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
  const variantClass = {
    blue: styles.heroCardBlue,
    pink: styles.heroCardPink,
    violet: styles.heroCardViolet,
    orange: styles.heroCardOrange,
    teal: styles.heroCardTeal
  }[variant]

  return (
    <motion.div
      className={`${styles.heroCard} ${variantClass}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.heroCardGlow} />
      <div className={styles.heroCardContent}>
        <div className={styles.heroCardLabel}>
          <Icon size={18} weight="bold" />
          {label}
        </div>
        <div className={styles.heroCardValue}>
          {animatedValue}
          {suffix && <span className={styles.heroCardSuffix}>{suffix}</span>}
        </div>
        <div className={styles.heroCardMeta}>{meta}</div>
      </div>
      <Icon size={80} weight="fill" className={styles.heroCardIcon} />
    </motion.div>
  )
}

// Composant Glass Card
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
  const iconClass = {
    blue: styles.iconBlue,
    pink: styles.iconPink,
    violet: styles.iconViolet,
    teal: styles.iconTeal,
    orange: styles.iconOrange,
    gray: styles.iconGray
  }[iconVariant]

  return (
    <motion.div
      className={styles.glassCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.glassCardHeader}>
        <span className={styles.glassCardLabel}>{label}</span>
        <div className={`${styles.glassCardIconWrapper} ${iconClass}`}>
          <Icon size={20} weight="bold" />
        </div>
      </div>
      <div className={styles.glassCardValue}>
        {animatedValue}
        {suffix && <span style={{ fontSize: '1rem', opacity: 0.6 }}>{suffix}</span>}
      </div>
      <div className={styles.glassCardMeta}>{meta}</div>
    </motion.div>
  )
}

export default function CollaborateursKPIsPage() {
  const [data, setData] = useState<CollaborateursKPIs | null>(null)
  const [detailedData, setDetailedData] = useState<DetailedKPIsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailedLoading, setDetailedLoading] = useState(false)

  // Filtres temporels - comme dans le dashboard
  const [periode, setPeriode] = useState<'annee' | 'mois' | 'plage'>('annee')
  const [date, setDate] = useState(new Date().getFullYear().toString())
  const [dateDebut, setDateDebut] = useState<Date | null>(null)
  const [dateFin, setDateFin] = useState<Date | null>(null)

  // Nouveau : inclure collaborateurs inactifs
  const [includeInactifs, setIncludeInactifs] = useState(false)

  // État pour les KPIs Compliance/Éthique
  const [complianceData, setComplianceData] = useState<ComplianceEthicsKPIsResponse | null>(null)
  const [complianceLoading, setComplianceLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchDetailedData()
  }, [periode, date, dateDebut, dateFin, includeInactifs])

  useEffect(() => {
    fetchComplianceData()
  }, [periode, date, dateDebut, dateFin, includeInactifs])

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
    // En mode plage, attendre que les deux dates soient sélectionnées
    if (periode === 'plage' && (!dateDebut || !dateFin)) {
      return
    }

    setDetailedLoading(true)
    try {
      // Convertir les dates en ISO string de manière sécurisée
      const startDate = dateDebut instanceof Date ? dateDebut.toISOString() :
                        dateDebut ? new Date(dateDebut).toISOString() : undefined
      const endDate = dateFin instanceof Date ? dateFin.toISOString() :
                      dateFin ? new Date(dateFin).toISOString() : undefined
      const response = await statsService.getCollaborateursDetailedKpis(periode, date, startDate, endDate, includeInactifs)
      setDetailedData(response)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs détaillés:', error)
    } finally {
      setDetailedLoading(false)
    }
  }

  const fetchComplianceData = async () => {
    if (periode === 'plage' && (!dateDebut || !dateFin)) {
      return
    }

    setComplianceLoading(true)
    try {
      const startDate = dateDebut instanceof Date ? dateDebut.toISOString() :
                        dateDebut ? new Date(dateDebut).toISOString() : undefined
      const endDate = dateFin instanceof Date ? dateFin.toISOString() :
                      dateFin ? new Date(dateFin).toISOString() : undefined
      const response = await statsService.getComplianceEthicsKpis(periode, date, startDate, endDate, includeInactifs)
      setComplianceData(response)
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs compliance:', error)
    } finally {
      setComplianceLoading(false)
    }
  }

  // Helper pour déterminer la classe CSS du taux de couverture
  const getCoverageClass = (taux: number) => {
    if (taux >= 80) return styles.coverageHigh
    if (taux >= 50) return styles.coverageMedium
    return styles.coverageLow
  }

  // Helper pour obtenir le badge de catégorie
  const getCategoryBadgeClass = (categorie: string) => {
    if (categorie.includes('B2B')) return styles.badgeB2B
    if (categorie.includes('B2C')) return styles.badgeB2C
    if (categorie.includes('Manager')) return styles.badgeManager
    if (categorie.includes('Directeur')) return styles.badgeDirecteur
    return styles.badgeCrossCategory
  }

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.backgroundOrbs}>
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          <div className={`${styles.orb} ${styles.orb3}`} />
        </div>
        <div className={styles.content}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <span className={styles.loadingText}>Chargement des données...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.backgroundOrbs}>
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          <div className={`${styles.orb} ${styles.orb3}`} />
        </div>
        <div className={styles.content}>
          <div className={styles.errorContainer}>
            <span className={styles.errorText}>Erreur lors du chargement des données</span>
          </div>
        </div>
      </div>
    )
  }

  const getRankClass = (index: number) => {
    if (index === 0) return styles.rankGold
    if (index === 1) return styles.rankSilver
    if (index === 2) return styles.rankBronze
    return styles.rankDefault
  }

  const getTrophyColor = (index: number) => {
    if (index === 0) return '#FFD43B'
    if (index === 1) return '#ADB5BD'
    if (index === 2) return '#CD7F32'
    return undefined
  }

  return (
    <div className={styles.pageContainer}>
      {/* Background animé */}
      <div className={styles.backgroundOrbs}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>

      <div className={styles.content}>
        {/* Header */}
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.pageTitle}>KPIs Collaborateurs</h1>
          <p className={styles.pageSubtitle}>Statistiques détaillées par catégorie</p>
        </motion.div>

        {/* Filtres temporels */}
        <motion.div
          className={styles.filterCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
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
          <div className={styles.filterOptions}>
            <button
              className={`${styles.toggleButton} ${includeInactifs ? styles.toggleActive : ''}`}
              onClick={() => setIncludeInactifs(!includeInactifs)}
            >
              {includeInactifs ? <ToggleRight size={20} weight="fill" /> : <ToggleLeft size={20} />}
              <span>Inclure inactifs</span>
              {detailedData?.collaborateurs && (
                <span className={styles.toggleBadge}>
                  {includeInactifs
                    ? `${detailedData.collaborateurs.formes} formés`
                    : `${detailedData.collaborateurs.formesActifs} actifs`}
                </span>
              )}
            </button>
          </div>
          {detailedData && (
            <span className={styles.periodBadge}>
              {detailedData.periode.libelle}
            </span>
          )}
        </motion.div>

        {/* Section KPIs Détaillés par Genre/Rôle */}
        {detailedLoading ? (
          <motion.div
            className={styles.glassCard}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.loadingContainer} style={{ minHeight: '200px' }}>
              <div className={styles.loadingSpinner} />
              <span className={styles.loadingText}>Chargement des statistiques détaillées...</span>
            </div>
          </motion.div>
        ) : detailedData ? (
          <>
            {/* ===== NOUVEAUX KPIs : Heures de formation ===== */}
            {detailedData.heuresFormation && (
              <motion.div
                className={styles.hoursSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <h3 className={styles.sectionTitle}>
                  <Clock size={20} weight="bold" style={{ color: '#4DABF7' }} />
                  Heures de formation
                </h3>
                <div className={styles.hoursGrid}>
                  <div className={styles.hourCard}>
                    <div className={styles.hourLabel}>Heures dispensées</div>
                    <div className={styles.hourValue}>{detailedData.heuresFormation.heuresDispensees.toLocaleString('fr-FR')}h</div>
                    <div className={styles.hourMeta}>Sessions comptées 1 fois</div>
                  </div>
                  <div className={styles.hourCard}>
                    <div className={styles.hourLabel}>Heures cumulées</div>
                    <div className={styles.hourValue}>{detailedData.heuresFormation.heuresCumulees.toLocaleString('fr-FR')}h</div>
                    <div className={styles.hourMeta}>Par participant (×N pour collectives)</div>
                  </div>
                </div>
                <div className={styles.hoursDetails}>
                  <span>Individuelles: {detailedData.heuresFormation.heuresIndividuelles.toLocaleString('fr-FR')}h</span>
                  <span>Collectives dispensées: {detailedData.heuresFormation.heuresCollectivesDispensees.toLocaleString('fr-FR')}h</span>
                  <span>Collectives cumulées: {detailedData.heuresFormation.heuresCollectivesCumulees.toLocaleString('fr-FR')}h</span>
                </div>
              </motion.div>
            )}

            {/* ===== NOUVEAUX KPIs : Heures par organisme ===== */}
            {detailedData.heuresParOrganisme && detailedData.heuresParOrganisme.length > 0 && (
              <motion.div
                className={styles.organismeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h3 className={styles.sectionTitle}>
                  <Buildings size={20} weight="bold" style={{ color: '#38D9A9' }} />
                  Heures par organisme
                </h3>
                <div className={styles.organismeList}>
                  {detailedData.heuresParOrganisme.slice(0, 5).map((org, index) => (
                    <div key={index} className={styles.organismeItem}>
                      <div className={styles.organismeRank}>#{index + 1}</div>
                      <div className={styles.organismeName}>{org.organisme}</div>
                      <div className={styles.organismeHours}>{org.heuresDispensees.toLocaleString('fr-FR')}h</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ===== NOUVEAUX KPIs : Collaborateurs formés / non formés ===== */}
            {detailedData.collaborateurs && (
              <motion.div
                className={styles.collabSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <h3 className={styles.sectionTitle}>
                  <UserSwitch size={20} weight="bold" style={{ color: '#9775FA' }} />
                  Statut de formation des collaborateurs
                </h3>
                <div className={styles.collabTable}>
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        <th className={styles.collabTableHeaderFormes}>Formés</th>
                        <th className={styles.collabTableHeaderNonFormes}>Non formés</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={styles.collabTableRowLabel}>Actifs</td>
                        <td className={styles.collabTableValueFormes}>{detailedData.collaborateurs.formesActifs}</td>
                        <td className={styles.collabTableValueNonFormes}>{detailedData.collaborateurs.nonFormesActifs}</td>
                        <td className={styles.collabTableValueTotal}>{detailedData.collaborateurs.formesActifs + detailedData.collaborateurs.nonFormesActifs}</td>
                      </tr>
                      {includeInactifs && (
                        <tr>
                          <td className={styles.collabTableRowLabel}>Inactifs</td>
                          <td className={styles.collabTableValueFormes}>{detailedData.collaborateurs.formesInactifs}</td>
                          <td className={styles.collabTableValueNonFormes}>{detailedData.collaborateurs.nonFormesInactifs}</td>
                          <td className={styles.collabTableValueTotal}>{detailedData.collaborateurs.formesInactifs + detailedData.collaborateurs.nonFormesInactifs}</td>
                        </tr>
                      )}
                      <tr className={styles.collabTableRowTotal}>
                        <td className={styles.collabTableRowLabel}>Total</td>
                        <td className={styles.collabTableValueFormes}>{includeInactifs ? detailedData.collaborateurs.formes : detailedData.collaborateurs.formesActifs}</td>
                        <td className={styles.collabTableValueNonFormes}>{includeInactifs ? detailedData.collaborateurs.nonFormes : detailedData.collaborateurs.nonFormesActifs}</td>
                        <td className={styles.collabTableValueTotal}>{includeInactifs ? detailedData.collaborateurs.total : (detailedData.collaborateurs.formesActifs + detailedData.collaborateurs.nonFormesActifs)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Hero Cards - Par Genre */}
            <div className={styles.heroGrid}>
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
            </div>

            {/* Stats Cards - Par Rôle */}
            <div className={styles.statsGrid}>
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
            </div>

            {/* Tableaux comparatifs */}
            <div className={styles.tablesGrid}>
              {/* Par Genre */}
              <motion.div
                className={styles.tableCard}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <h3 className={styles.tableTitle}>
                  <GenderMale size={20} weight="bold" style={{ color: '#4DABF7' }} />
                  <GenderFemale size={20} weight="bold" style={{ color: '#F06595' }} />
                  Par genre
                </h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Catégorie</th>
                        <th>Collab.</th>
                        <th>Formations</th>
                        <th>Heures</th>
                        <th>Moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className={styles.badgeBlue}>Homme</span></td>
                        <td>{detailedData.parGenre.homme.nombre}</td>
                        <td>{detailedData.parGenre.homme.formations}</td>
                        <td>{detailedData.parGenre.homme.heures}h</td>
                        <td className={styles.tableValue}>{detailedData.parGenre.homme.moyenne}h</td>
                      </tr>
                      <tr>
                        <td><span className={styles.badgePink}>Femme</span></td>
                        <td>{detailedData.parGenre.femme.nombre}</td>
                        <td>{detailedData.parGenre.femme.formations}</td>
                        <td>{detailedData.parGenre.femme.heures}h</td>
                        <td className={styles.tableValue}>{detailedData.parGenre.femme.moyenne}h</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Par Rôle */}
              <motion.div
                className={styles.tableCard}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <h3 className={styles.tableTitle}>
                  <UserCircle size={20} weight="bold" style={{ color: '#9775FA' }} />
                  Par rôle
                </h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Catégorie</th>
                        <th>Collab.</th>
                        <th>Formations</th>
                        <th>Heures</th>
                        <th>Moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className={styles.badgeViolet}>Directeur</span></td>
                        <td>{detailedData.parRole.directeur.nombre}</td>
                        <td>{detailedData.parRole.directeur.formations}</td>
                        <td>{detailedData.parRole.directeur.heures}h</td>
                        <td className={styles.tableValue}>{detailedData.parRole.directeur.moyenne}h</td>
                      </tr>
                      <tr>
                        <td><span className={styles.badgeTeal}>Manager</span></td>
                        <td>{detailedData.parRole.manager.nombre}</td>
                        <td>{detailedData.parRole.manager.formations}</td>
                        <td>{detailedData.parRole.manager.heures}h</td>
                        <td className={styles.tableValue}>{detailedData.parRole.manager.moyenne}h</td>
                      </tr>
                      <tr>
                        <td><span className={styles.badgeGray}>Non-manager</span></td>
                        <td>{detailedData.parRole.nonManager.nombre}</td>
                        <td>{detailedData.parRole.nonManager.formations}</td>
                        <td>{detailedData.parRole.nonManager.heures}h</td>
                        <td className={styles.tableValue}>{detailedData.parRole.nonManager.moyenne}h</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            {/* Tableau Croisé Rôle × Genre */}
            {detailedData.parRoleGenre && (
              <motion.div
                className={styles.crossTableCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <h3 className={styles.tableTitle}>
                  <Users size={20} weight="bold" style={{ color: '#845EF7' }} />
                  Répartition Rôle × Genre
                </h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.crossTable}>
                    <thead>
                      <tr>
                        <th rowSpan={2}>Rôle</th>
                        <th colSpan={3} className={styles.headerMale}>
                          <GenderMale size={16} weight="bold" /> Hommes
                        </th>
                        <th colSpan={3} className={styles.headerFemale}>
                          <GenderFemale size={16} weight="bold" /> Femmes
                        </th>
                      </tr>
                      <tr>
                        <th>Nb</th>
                        <th>Form.</th>
                        <th>Heures</th>
                        <th>Nb</th>
                        <th>Form.</th>
                        <th>Heures</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className={styles.badgeViolet}>Directeur</span></td>
                        <td>{detailedData.parRoleGenre.directeur.homme.nombre}</td>
                        <td>{detailedData.parRoleGenre.directeur.homme.formations}</td>
                        <td>{detailedData.parRoleGenre.directeur.homme.heures}h</td>
                        <td>{detailedData.parRoleGenre.directeur.femme.nombre}</td>
                        <td>{detailedData.parRoleGenre.directeur.femme.formations}</td>
                        <td>{detailedData.parRoleGenre.directeur.femme.heures}h</td>
                      </tr>
                      <tr>
                        <td><span className={styles.badgeTeal}>Manager</span></td>
                        <td>{detailedData.parRoleGenre.manager.homme.nombre}</td>
                        <td>{detailedData.parRoleGenre.manager.homme.formations}</td>
                        <td>{detailedData.parRoleGenre.manager.homme.heures}h</td>
                        <td>{detailedData.parRoleGenre.manager.femme.nombre}</td>
                        <td>{detailedData.parRoleGenre.manager.femme.formations}</td>
                        <td>{detailedData.parRoleGenre.manager.femme.heures}h</td>
                      </tr>
                      <tr>
                        <td><span className={styles.badgeGray}>Non-manager</span></td>
                        <td>{detailedData.parRoleGenre.nonManager.homme.nombre}</td>
                        <td>{detailedData.parRoleGenre.nonManager.homme.formations}</td>
                        <td>{detailedData.parRoleGenre.nonManager.homme.heures}h</td>
                        <td>{detailedData.parRoleGenre.nonManager.femme.nombre}</td>
                        <td>{detailedData.parRoleGenre.nonManager.femme.formations}</td>
                        <td>{detailedData.parRoleGenre.nonManager.femme.heures}h</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Stats par Département */}
            {detailedData.parDepartement && detailedData.parDepartement.length > 0 && (
              <motion.div
                className={styles.departementCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <h3 className={styles.tableTitle}>
                  <Buildings size={20} weight="bold" style={{ color: '#20C997' }} />
                  Par département
                </h3>
                <div className={styles.departementList}>
                  {detailedData.parDepartement.map((dept) => (
                    <div key={dept.id} className={styles.departementItem}>
                      <div className={styles.departementHeader}>
                        <span className={styles.departementName}>{dept.nom}</span>
                        <div className={styles.departementStats}>
                          <span>{dept.stats.nombre} pers.</span>
                          <span>{dept.stats.formations} form.</span>
                          <span className={styles.departementHeures}>{dept.stats.heures}h</span>
                        </div>
                      </div>
                      {dept.sousEquipes && dept.sousEquipes.length > 0 && (
                        <div className={styles.sousEquipes}>
                          {dept.sousEquipes.map((sub) => (
                            <div key={sub.id} className={styles.sousEquipeItem}>
                              <span className={styles.sousEquipeName}>↳ {sub.nom}</span>
                              <div className={styles.sousEquipeStats}>
                                <span>{sub.stats.nombre} pers.</span>
                                <span>{sub.stats.formations} form.</span>
                                <span>{sub.stats.heures}h</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Stats par Catégorie de Formation */}
            {detailedData.parCategorie && detailedData.parCategorie.length > 0 && (
              <motion.div
                className={styles.categorieCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
              >
                <h3 className={styles.tableTitle}>
                  <ChartBar size={20} weight="bold" style={{ color: '#F59F00' }} />
                  Par catégorie de formation
                </h3>
                <div className={styles.categorieList}>
                  {detailedData.parCategorie.map((cat, index) => (
                    <div key={cat.id} className={styles.categorieItem}>
                      <div className={styles.categorieHeader}>
                        <span className={styles.categorieName}>{cat.nom}</span>
                        <span className={styles.categoriePourcentage}>{cat.stats.pourcentage}%</span>
                      </div>
                      <div className={styles.categorieBar}>
                        <div
                          className={styles.categorieProgress}
                          style={{
                            width: `${cat.stats.pourcentage}%`,
                            backgroundColor: `hsl(${(index * 45) % 360}, 70%, 55%)`
                          }}
                        />
                      </div>
                      <div className={styles.categorieDetails}>
                        <span>{cat.stats.nombre} collaborateurs</span>
                        <span>{cat.stats.formations} formations</span>
                        <span className={styles.categorieHeures}>{cat.stats.heures}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        ) : null}

        {/* ===== SECTION CONFORMITÉ/ÉTHIQUE ===== */}
        {complianceLoading ? (
          <motion.div
            className={styles.complianceSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
              <span className={styles.loadingText}>Chargement des KPIs Conformité...</span>
            </div>
          </motion.div>
        ) : complianceData && complianceData.formationsEthique.nombreFormations > 0 ? (
          <>
            {/* Divider Section Éthique */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <div className={styles.dividerContent}>
                <Scales size={18} weight="bold" className={styles.dividerIcon} />
                <span className={styles.dividerText}>Conformité & Éthique</span>
              </div>
              <div className={styles.dividerLine} />
            </div>

            {/* Formations éthique identifiées */}
            <motion.div
              className={styles.complianceSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className={styles.tableTitle}>
                <ShieldCheck size={20} weight="bold" style={{ color: '#38D9A9' }} />
                Formations Éthique Identifiées ({complianceData.formationsEthique.nombreFormations})
              </h3>
              <div className={styles.formationsEthiqueList}>
                {complianceData.formationsEthique.liste.map(f => (
                  <span key={f.id} className={styles.formationEthiqueTag}>{f.nom}</span>
                ))}
              </div>
            </motion.div>

            {/* Stats globales compliance */}
            <motion.div
              className={styles.complianceSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className={styles.complianceGlobalStats}>
                <div className={styles.complianceGlobalStat}>
                  <span className={styles.complianceGlobalStatValue}>
                    {complianceData.comparatifGlobal.tauxCouverture}%
                  </span>
                  <span className={styles.complianceGlobalStatLabel}>Taux couverture</span>
                </div>
                <div className={styles.complianceGlobalStat}>
                  <span className={styles.complianceGlobalStatValue}>
                    {complianceData.comparatifGlobal.formes}
                  </span>
                  <span className={styles.complianceGlobalStatLabel}>Formés</span>
                </div>
                <div className={styles.complianceGlobalStat}>
                  <span className={styles.complianceGlobalStatValue} style={{ color: '#FA5252' }}>
                    {complianceData.comparatifGlobal.nonFormes}
                  </span>
                  <span className={styles.complianceGlobalStatLabel}>Non formés</span>
                </div>
                <div className={styles.complianceGlobalStat}>
                  <span className={styles.complianceGlobalStatValue} style={{ color: '#4DABF7' }}>
                    {complianceData.comparatifGlobal.totalEmployesRisque}
                  </span>
                  <span className={styles.complianceGlobalStatLabel}>Employés à risque</span>
                </div>
              </div>
            </motion.div>

            {/* Cards par catégorie croisée */}
            {complianceData.parCategorieCroisee.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className={styles.riskCategoriesGrid}>
                  {complianceData.parCategorieCroisee.map((cat, index) => (
                    <div key={cat.categorie} className={styles.riskCategoryCard}>
                      <div className={styles.riskCategoryHeader}>
                        <span className={styles.riskCategoryLabel}>{cat.categorie}</span>
                        <span className={`${styles.riskCategoryBadge} ${getCategoryBadgeClass(cat.categorie)}`}>
                          {cat.tauxCouverture}%
                        </span>
                      </div>
                      <div className={styles.riskCategoryStats}>
                        <div className={styles.riskCategoryStat}>
                          <span>Effectif</span>
                          <span className={styles.riskCategoryStatValue}>{cat.total}</span>
                        </div>
                        <div className={styles.riskCategoryStat}>
                          <span>Formés</span>
                          <span className={styles.riskCategoryStatValue} style={{ color: '#38D9A9' }}>
                            {cat.formes}
                          </span>
                        </div>
                        <div className={styles.riskCategoryStat}>
                          <span>Non formés</span>
                          <span className={styles.riskCategoryStatValue} style={{ color: '#FA5252' }}>
                            {cat.nonFormes}
                          </span>
                        </div>
                        <div className={styles.riskCategoryStat}>
                          <span>Heures</span>
                          <span className={styles.riskCategoryStatValue}>{cat.heures}h</span>
                        </div>
                      </div>
                      <div className={styles.coverageIndicator}>
                        <div className={styles.coverageBar}>
                          <div
                            className={`${styles.coverageProgress} ${getCoverageClass(cat.tauxCouverture)}`}
                            style={{ width: `${cat.tauxCouverture}%` }}
                          />
                        </div>
                        <span className={styles.coveragePercent}>{cat.tauxCouverture}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tableau comparatif Formés vs Non-Formés */}
            <motion.div
              className={styles.comparisonTableCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h3 className={styles.tableTitle}>
                <CheckCircle size={20} weight="bold" style={{ color: '#38D9A9' }} />
                Comparatif Formés vs Non-Formés par Catégorie
              </h3>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th>Total</th>
                    <th>Formés</th>
                    <th>Non formés</th>
                    <th>Heures</th>
                    <th>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Catégories simples */}
                  <tr>
                    <td><span className={styles.badgeB2B}>B2B</span></td>
                    <td>{complianceData.parCategorieSimple.b2b.total}</td>
                    <td style={{ color: '#38D9A9' }}>{complianceData.parCategorieSimple.b2b.formes}</td>
                    <td style={{ color: '#FA5252' }}>{complianceData.parCategorieSimple.b2b.nonFormes}</td>
                    <td>{complianceData.parCategorieSimple.b2b.heures}h</td>
                    <td>
                      <strong style={{ color: complianceData.parCategorieSimple.b2b.tauxCouverture >= 80 ? '#38D9A9' : '#FA5252' }}>
                        {complianceData.parCategorieSimple.b2b.tauxCouverture}%
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td><span className={styles.badgeB2C}>B2C</span></td>
                    <td>{complianceData.parCategorieSimple.b2c.total}</td>
                    <td style={{ color: '#38D9A9' }}>{complianceData.parCategorieSimple.b2c.formes}</td>
                    <td style={{ color: '#FA5252' }}>{complianceData.parCategorieSimple.b2c.nonFormes}</td>
                    <td>{complianceData.parCategorieSimple.b2c.heures}h</td>
                    <td>
                      <strong style={{ color: complianceData.parCategorieSimple.b2c.tauxCouverture >= 80 ? '#38D9A9' : '#FA5252' }}>
                        {complianceData.parCategorieSimple.b2c.tauxCouverture}%
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td><span className={styles.badgeManager}>Managers</span></td>
                    <td>{complianceData.parCategorieSimple.managers.total}</td>
                    <td style={{ color: '#38D9A9' }}>{complianceData.parCategorieSimple.managers.formes}</td>
                    <td style={{ color: '#FA5252' }}>{complianceData.parCategorieSimple.managers.nonFormes}</td>
                    <td>{complianceData.parCategorieSimple.managers.heures}h</td>
                    <td>
                      <strong style={{ color: complianceData.parCategorieSimple.managers.tauxCouverture >= 80 ? '#38D9A9' : '#FA5252' }}>
                        {complianceData.parCategorieSimple.managers.tauxCouverture}%
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td><span className={styles.badgeDirecteur}>Directeurs</span></td>
                    <td>{complianceData.parCategorieSimple.directeurs.total}</td>
                    <td style={{ color: '#38D9A9' }}>{complianceData.parCategorieSimple.directeurs.formes}</td>
                    <td style={{ color: '#FA5252' }}>{complianceData.parCategorieSimple.directeurs.nonFormes}</td>
                    <td>{complianceData.parCategorieSimple.directeurs.heures}h</td>
                    <td>
                      <strong style={{ color: complianceData.parCategorieSimple.directeurs.tauxCouverture >= 80 ? '#38D9A9' : '#FA5252' }}>
                        {complianceData.parCategorieSimple.directeurs.tauxCouverture}%
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </motion.div>

            {/* Répartition par genre dans les catégories croisées */}
            {complianceData.parCategorieCroisee.length > 0 && (
              <motion.div
                className={styles.comparisonTableCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h3 className={styles.tableTitle}>
                  <GenderMale size={20} weight="bold" style={{ color: '#4DABF7' }} />
                  <GenderFemale size={20} weight="bold" style={{ color: '#F06595', marginLeft: '-8px' }} />
                  Répartition par Genre (employés formés)
                </h3>
                <table className={styles.comparisonTable}>
                  <thead>
                    <tr>
                      <th>Catégorie</th>
                      <th>Hommes</th>
                      <th>Heures H</th>
                      <th>Femmes</th>
                      <th>Heures F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceData.parCategorieCroisee.map(cat => (
                      <tr key={cat.categorie}>
                        <td><span className={getCategoryBadgeClass(cat.categorie)}>{cat.categorie}</span></td>
                        <td style={{ color: '#4DABF7' }}>{cat.parGenre.homme.nombre}</td>
                        <td>{cat.parGenre.homme.heures}h</td>
                        <td style={{ color: '#F06595' }}>{cat.parGenre.femme.nombre}</td>
                        <td>{cat.parGenre.femme.heures}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {/* Détail par formation */}
            {complianceData.parFormation.length > 0 && (
              <motion.div
                className={styles.comparisonTableCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <h3 className={styles.tableTitle}>
                  <ShieldCheck size={20} weight="bold" style={{ color: '#38D9A9' }} />
                  Participation par Formation Éthique
                </h3>
                <table className={styles.comparisonTable}>
                  <thead>
                    <tr>
                      <th>Formation</th>
                      <th>Total</th>
                      <th>B2B</th>
                      <th>B2C</th>
                      <th>Managers</th>
                      <th>Directeurs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceData.parFormation.map(f => (
                      <tr key={f.formationId}>
                        <td>{f.nomFormation}</td>
                        <td><strong>{f.participants.total}</strong></td>
                        <td>{f.participants.b2b}</td>
                        <td>{f.participants.b2c}</td>
                        <td>{f.participants.managers}</td>
                        <td>{f.participants.directeurs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </>
        ) : null}

        {/* Divider */}
        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <div className={styles.dividerContent}>
            <ChartBar size={18} weight="bold" className={styles.dividerIcon} />
            <span className={styles.dividerText}>Vue d'ensemble générale</span>
          </div>
          <div className={styles.dividerLine} />
        </div>

        {/* Overview Cards */}
        <div className={styles.overviewGrid}>
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
        </div>

        {/* Types de contrat */}
        <motion.div
          className={styles.contractCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
        >
          <h3 className={styles.tableTitle}>
            <Briefcase size={20} weight="bold" style={{ color: '#38D9A9' }} />
            Types de contrat
          </h3>
          {data.repartitionContrat.map((item, index) => (
            <motion.div
              key={index}
              className={styles.contractItem}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
            >
              <div className={styles.contractHeader}>
                <div className={styles.contractLabel}>
                  <Handshake size={16} className={styles.contractIcon} />
                  {item.type}
                </div>
                <span className={styles.contractCount}>{item.nombre}</span>
              </div>
              <div className={styles.contractProgress}>
                <motion.div
                  className={styles.contractProgressBar}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pourcentage}%` }}
                  transition={{ duration: 0.8, delay: 1.1 + index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Top 10 Participants */}
        <motion.div
          className={styles.topParticipantsCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          <h3 className={styles.topParticipantsTitle}>
            <Trophy size={24} weight="fill" className={styles.trophyIcon} />
            Top 10 des participants
          </h3>

          {data.topParticipants.map((participant, index) => (
            <motion.div
              key={participant.id}
              className={styles.participantRow}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 1.3 + index * 0.05 }}
            >
              <div className={`${styles.participantRank} ${getRankClass(index)}`}>
                #{index + 1}
              </div>
              <div className={styles.participantName}>
                {index < 3 && (
                  <Trophy
                    size={18}
                    weight="fill"
                    color={getTrophyColor(index)}
                    className={styles.participantTrophySmall}
                  />
                )}
                <span className={styles.participantNameText}>{participant.nom}</span>
              </div>
              <div className={styles.participantDepartment}>
                {participant.departement}
              </div>
              <div className={styles.participantFormations}>
                <span className={styles.participantFormationsValue}>{participant.nombreFormations}</span> formations
              </div>
              <div className={styles.participantHours}>
                {participant.heuresTotal}h
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
