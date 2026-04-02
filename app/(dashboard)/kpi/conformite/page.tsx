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
  Accordion
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
import styles from './conformite.module.css'

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
      className={styles.kpiCard}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
    >
      <div className={styles.kpiCardInner}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiTitle}>{title}</span>
          <div className={styles.kpiIcon} data-color={color}>
            {icon}
          </div>
        </div>
        <div className={styles.kpiValue}>
          <span className={styles.kpiNumber}>{value.toLocaleString('fr-FR')}</span>
          {suffix && <span className={styles.kpiSuffix}>{suffix}</span>}
        </div>
        {subtitle && <div className={styles.kpiSubtitle}>{subtitle}</div>}
      </div>
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
    const allManagerIds = byManagerData.departements.flatMap(d => d.managers.map(m => m.id))
    if (selectedManagers.length === allManagerIds.length) {
      setSelectedManagers([])
    } else {
      setSelectedManagers(allManagerIds)
    }
  }

  const getSelectedManagersList = () => {
    if (!byManagerData) return []
    return byManagerData.departements.flatMap(d =>
      d.managers.filter(m => selectedManagers.includes(m.id))
    )
  }

  const departementOptions = byManagerData?.departements.map(d => ({
    value: d.id.toString(),
    label: `${d.nom} (${d.totalNonFormes})`
  })) || []

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

  const getCoverageClass = (taux: number) => {
    if (taux >= 80) return styles.coverageHigh
    if (taux >= 50) return styles.coverageMedium
    return styles.coverageLow
  }

  const getCategoryBadgeClass = (categorie: string) => {
    if (categorie.includes('Autres Collaborateurs')) return styles.badgeCollaborateur
    if (categorie.includes('B2B')) return styles.badgeB2B
    if (categorie.includes('B2C')) return styles.badgeB2C
    if (categorie.includes('Manager')) return styles.badgeManager
    if (categorie.includes('Directeur')) return styles.badgeDirecteur
    return styles.badgeCrossCategory
  }

  // ===== Loading State =====

  if (mandatoryLoading && !mandatoryData) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.content}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <span className={styles.loadingText}>Chargement des donnees de conformite...</span>
          </div>
        </div>
      </div>
    )
  }

  // ===== Render =====

  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>

        {/* ===== HEADER ===== */}
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>Conformite & Formations Obligatoires</h1>
              <p className={styles.subtitle}>
                Suivi de la conformite reglementaire et des formations obligatoires
              </p>
            </div>
            <div className={styles.liveTag}>
              <span className={styles.liveDot} />
              Temps reel
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: '1rem' }}
          >
            <PeriodSelector
              periode={periode}
              date={date}
              dateDebut={dateDebut}
              dateFin={dateFin}
              onChange={(p, d) => { setPeriode(p); setDate(d) }}
              onDateRangeChange={(debut, fin) => { setDateDebut(debut); setDateFin(fin) }}
            />
          </motion.div>
        </motion.div>

        {/* ===== SECTION 1: SCOPE DES FORMATIONS ===== */}
        <motion.div
          className={styles.scopeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className={styles.scopeTitle}>
            <ShieldCheck size={20} weight="bold" className={styles.iconColorTeal} />
            Formations obligatoires ({selectedFormationIds.length}/{availableFormations.length} selectionnees)
          </h3>
          <div className={styles.formationSelectionHeader}>
            <button
              className={styles.formationSelectAllBtn}
              onClick={() => setSelectedFormationIds(availableFormations.map(f => f.id))}
              disabled={selectedFormationIds.length === availableFormations.length}
            >
              Tout selectionner
            </button>
            <button
              className={styles.formationDeselectAllBtn}
              onClick={() => setSelectedFormationIds([])}
              disabled={selectedFormationIds.length === 0}
            >
              Tout deselectionner
            </button>
            <button
              className={styles.formationAddBtn}
              onClick={() => {
                setShowSearch(!showSearch)
                setTimeout(() => searchInputRef.current?.focus(), 100)
              }}
            >
              <Plus size={14} weight="bold" style={{ marginRight: '4px' }} />
              Ajouter une formation
            </button>
          </div>

          {/* Search to add formations */}
          {showSearch && (
            <div className={styles.formationSearchContainer}>
              <div className={styles.formationSearchInputWrapper}>
                <MagnifyingGlass size={16} className={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.formationSearchInput}
                  placeholder="Rechercher une formation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  className={styles.searchCloseBtn}
                  onClick={() => { setShowSearch(false); setSearchQuery('') }}
                >
                  <X size={14} />
                </button>
              </div>
              {searchQuery && filteredSearchResults.length > 0 && (
                <div className={styles.formationSearchResults}>
                  {filteredSearchResults.map(f => (
                    <button
                      key={f.id}
                      className={styles.formationSearchResultItem}
                      onClick={() => addFormationToList(f)}
                    >
                      <Plus size={14} style={{ marginRight: '8px', opacity: 0.6 }} />
                      {f.nom}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && filteredSearchResults.length === 0 && (
                <div className={styles.formationSearchNoResults}>
                  Aucune formation trouvee
                </div>
              )}
            </div>
          )}

          {/* Formation tags */}
          <div className={styles.formationsTagList}>
            {availableFormations.map(f => (
              <div key={f.id} className={styles.formationTagWrapper}>
                <button
                  className={`${styles.formationTag} ${selectedFormationIds.includes(f.id) ? styles.formationSelected : styles.formationUnselected}`}
                  onClick={() => {
                    if (selectedFormationIds.includes(f.id)) {
                      setSelectedFormationIds(prev => prev.filter(id => id !== f.id))
                    } else {
                      setSelectedFormationIds(prev => [...prev, f.id])
                    }
                  }}
                >
                  {selectedFormationIds.includes(f.id) ? (
                    <CheckCircle size={14} weight="fill" style={{ marginRight: '4px' }} />
                  ) : (
                    <XCircle size={14} weight="regular" style={{ marginRight: '4px', opacity: 0.5 }} />
                  )}
                  {f.nom}
                </button>
                <button
                  className={styles.formationRemoveBtn}
                  onClick={() => removeFormationFromList(f.id)}
                  title="Retirer de la liste"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {selectedFormationIds.length === 0 && availableFormations.length === 0 && (
            <div className={styles.noSelectionMessage}>
              <Warning size={16} style={{ marginRight: '8px' }} />
              Aucune formation obligatoire trouvee - Utilisez "Ajouter une formation" pour en ajouter
            </div>
          )}
        </motion.div>

        {/* ===== SECTION 2: STATS GLOBALES (KPI CARDS) ===== */}
        {mandatoryData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className={styles.kpiGrid}>
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
            </div>
          </motion.div>
        )}

        {/* ===== SECTION 3: DETAIL PAR FORMATION (TABLE) ===== */}
        {mandatoryData && mandatoryData.formations.length > 0 && (
          <motion.div
            className={styles.tableSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className={styles.sectionTitle}>Detail par formation</h3>
            <p className={styles.sectionSubtitle}>Taux de conformite pour chaque formation obligatoire</p>

            <table className={styles.detailTable}>
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--mantine-color-dimmed)' }}>{formation.codeFormation}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant="light" color="gray" size="sm">{formation.categorie}</Badge>
                    </td>
                    <td style={{ color: 'var(--mantine-color-green-6)', fontWeight: 600 }}>{formation.collaborateursFormes}</td>
                    <td style={{ color: 'var(--mantine-color-red-6)', fontWeight: 600 }}>{formation.collaborateursNonFormes}</td>
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
        )}

        {/* ===== SECTION 4: PAR DEPARTEMENT ===== */}
        {mandatoryData && mandatoryData.parDepartement.length > 0 && (
          <motion.div
            className={styles.deptSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className={styles.sectionTitle}>
              <Buildings size={24} weight="bold" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Conformite par departement
            </h3>
            <p className={styles.sectionSubtitle}>
              Pourcentage de collaborateurs ayant complete toutes les formations obligatoires
            </p>

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
        )}

        {/* ===== SECTION 5: CATEGORIES A RISQUE ===== */}
        {complianceLoading ? (
          <motion.div
            className={styles.globalStatsSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
              <span className={styles.loadingText}>Chargement des KPIs Conformite...</span>
            </div>
          </motion.div>
        ) : complianceData ? (
          <>
            {/* Divider */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <div className={styles.dividerContent}>
                <Scales size={18} weight="bold" className={styles.dividerIcon} />
                <span className={styles.dividerText}>Analyse par categorie</span>
                {complianceData.periode?.libelle && (
                  <span className={styles.yearBadge}>{complianceData.periode.libelle}</span>
                )}
              </div>
              <div className={styles.dividerLine} />
            </div>

            {/* Global compliance stats */}
            <motion.div
              className={styles.globalStatsSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h3 className={styles.globalStatsTitle}>
                Statistiques Globales
                {complianceData.periode?.libelle && (
                  <span className={styles.yearBadge}>{complianceData.periode.libelle}</span>
                )}
              </h3>
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
                  <span className={styles.complianceGlobalStatLabel}>Formes</span>
                </div>
                <div className={styles.complianceGlobalStat}>
                  <span className={`${styles.complianceGlobalStatValue} ${styles.statValueRed}`}>
                    {complianceData.comparatifGlobal.nonFormes}
                  </span>
                  <span className={styles.complianceGlobalStatLabel}>Non formes</span>
                </div>
                <div className={styles.complianceGlobalStat}>
                  <span className={`${styles.complianceGlobalStatValue} ${styles.statValueBlue}`}>
                    {complianceData.comparatifGlobal.totalEmployesRisque}
                  </span>
                  <span className={styles.complianceGlobalStatLabel}>Employes a risque</span>
                </div>
              </div>
            </motion.div>

            {/* Risk categories grid */}
            {complianceData.parCategorieCroisee.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h3 className={styles.globalStatsTitle}>
                  Categories a Risque
                  {complianceData.periode?.libelle && (
                    <span className={styles.yearBadge}>{complianceData.periode.libelle}</span>
                  )}
                </h3>
                <div className={styles.riskCategoriesGrid}>
                  {complianceData.parCategorieCroisee.map((cat) => (
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
                          <span>Formes</span>
                          <span className={`${styles.riskCategoryStatValue} ${styles.textFormes}`}>
                            {cat.formes}
                          </span>
                        </div>
                        <div className={styles.riskCategoryStat}>
                          <span>Non formes</span>
                          <span className={`${styles.riskCategoryStatValue} ${styles.textNonFormes}`}>
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
          </>
        ) : null}

        {/* ===== SECTION 6: VUE PAR MANAGER ===== */}
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
            />
          </div>

          {/* Grouped actions */}
          <div className={styles.managerActions}>
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
              {/* Summary stats bar */}
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

              {/* Department accordion */}
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
                        <Buildings size={20} weight="bold" style={{ color: 'var(--mantine-primary-color-filled)' }} />
                        <Text fw={600}>{dept.nom}</Text>
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
                            whileHover={{ scale: 1.005 }}
                          >
                            <Checkbox
                              checked={selectedManagers.includes(manager.id)}
                              onChange={() => toggleManager(manager.id)}
                              styles={{ root: { alignSelf: 'flex-start', marginTop: 4 } }}
                            />
                            <div className={styles.managerInfo}>
                              <div className={styles.managerHeader}>
                                <Text fw={600} size="sm">{manager.nomComplet}</Text>
                                <Badge variant="light" size="xs">
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

              {/* Collaborateurs without manager */}
              {byManagerData.sansManager.length > 0 && (
                <div className={styles.sansManagerSection}>
                  <h4 className={styles.sansManagerTitle}>
                    <WarningCircle size={18} weight="bold" style={{ marginRight: 6 }} />
                    Collaborateurs sans manager ({byManagerData.sansManager.length})
                  </h4>
                  <div className={styles.sansManagerList}>
                    {byManagerData.sansManager.map(collab => (
                      <div key={collab.id} className={styles.sansManagerItem}>
                        <Text size="sm">{collab.nomComplet}</Text>
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

        {/* ===== REMINDER MODAL ===== */}
        <Modal
          opened={showReminderModal}
          onClose={() => !sendingReminders && setShowReminderModal(false)}
          title="Envoyer des rappels aux managers"
          size="lg"
          centered
          closeOnClickOutside={!sendingReminders}
          closeOnEscape={!sendingReminders}
          styles={{ title: { fontWeight: 700 } }}
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
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {getSelectedManagersList().map(m => (
                      <Group key={m.id} justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                        <Text size="sm">{m.nomComplet}</Text>
                        <Badge size="sm">{m.collaborateursNonFormes.length} a former</Badge>
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
                        <Text size="lg" fw={600}>Tous les collaborateurs sont formes !</Text>
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
                        <div className={styles.modalEmptyIcon} style={{ background: 'var(--mantine-color-red-light)' }}>
                          <WarningCircle size={32} weight="duotone" color="var(--mantine-color-red-6)" />
                        </div>
                        <Text size="lg" fw={600}>Aucun collaborateur forme</Text>
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
    </div>
  )
}
