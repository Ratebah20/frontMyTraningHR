'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
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
  SegmentedControl,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye'
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight'
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown'
import { X } from '@phosphor-icons/react/dist/ssr/X'
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass'
import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple'
import { Info } from '@phosphor-icons/react/dist/ssr/Info'
import { UserList } from '@phosphor-icons/react/dist/ssr/UserList'
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple'
import { useSearchParams } from 'next/navigation'
import { PeriodSelector } from '@/components/PeriodSelector'
import { motion, AnimatePresence } from 'framer-motion'
import {
  statsService,
  formationsService,
  notificationsService,
  exportsService,
  departementsService,
} from '@/lib/services'

// ===== Interfaces =====

/**
 * Périmètre d'obligation suivi par la page.
 * - 'annuelle'  : obligatoires à repasser (tout l'effectif)
 * - 'onboarding': parcours des nouveaux arrivants de la période
 * - 'securite'  : formations de sécurité au travail (SST), périmètre distinct
 *   piloté par `Formation.estSecurite`
 */
type MandatoryType = 'annuelle' | 'onboarding' | 'securite'

interface MandatoryTrainingsKPIs {
  periode: { annee: number; mois?: number; libelle: string }
  stats: {
    totalFormations: number
    totalCollaborateursAFormer: number
    totalFormes: number
    totalNonFormes: number
    /**
     * Collaborateurs en congé longue durée, EXCLUS de
     * `totalCollaborateursAFormer`. Optionnel : une API antérieure ne le
     * renvoie pas, on traite alors l'absence comme 0.
     */
    collaborateursEnConge?: number
    tauxConformiteGlobal: number | null
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
    // Enrichissements backend (optionnels : tolère une réponse d'une version
    // antérieure de l'API, auquel cas la relance directeur est simplement
    // désactivée pour la ligne)
    directeur?: { id: number; nomComplet: string; email: string | null } | null
    peutEtreRelance?: boolean
  }>
}

/** Ligne aplatie de la vue « Par équipe » (tous départements confondus) */
interface OrgManagerRow {
  id: number
  nomComplet: string
  departementId: number
  departement: string
  collaborateursNonFormes: Array<{
    id: number
    nomComplet: string
    formationsManquantes: Array<{ id: number; nomFormation: string }>
  }>
}

/**
 * Cible de la modale de rappels. UNE SEULE voie de relance par cible :
 * - 'directeurs' : vue par organisation / onglet département → directeurs
 * - 'managers'   : vue par organisation / onglet équipe → managers
 *
 * L'ancienne cible 'equipes' (relance des managers depuis la matrice de
 * conformité) a été supprimée avec la matrice : elle faisait doublon avec
 * 'managers' et partait d'une sélection par NOM de département.
 */
type ReminderTarget = 'directeurs' | 'managers'

/**
 * Ligne du détail par formation affiché au dépliage d'un département.
 * Le taux porté ici est un taux PAR FORMATION (« a suivi cette formation »),
 * à ne pas confondre avec le taux de conformité du département, qui exige
 * TOUTES les formations du périmètre.
 */
interface DetailFormationDepartement {
  formation: MandatoryTrainingsKPIs['formations'][0]
  formes: number
  nonFormes: number
  total: number
  taux: number
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
      /** Certaines réponses exposent `nom` au lieu de `nomComplet` */
      nom?: string
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
    /** null = collaborateur sans département : non relançable */
    departementId?: number | null
    formationsManquantes: Array<{ id: number; nomFormation: string }>
  }>
}

// ===== KPI Card Component =====

function KPICard({
  title,
  value,
  suffix = '',
  subtitle,
  footer,
  icon,
  color = 'cyan',
  delay = 0
}: {
  title: string
  // null = indicateur non défini (population vide) : on affiche "n/a" plutôt
  // qu'un trompeur 100 %
  value: number | null
  suffix?: string
  subtitle?: string
  // Mention complémentaire libre (ex. exclusions du dénominateur)
  footer?: React.ReactNode
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
          <Text size="xl" fw={700}>
            {value === null ? 'n/a' : value.toLocaleString('fr-FR')}
          </Text>
          {suffix && value !== null && <Text size="md" fw={600} c="dimmed">{suffix}</Text>}
        </Group>
        {subtitle && <Text size="xs" c="dimmed" mt={4}>{subtitle}</Text>}
        {footer && <Box mt={6}>{footer}</Box>}
      </Card>
    </motion.div>
  )
}

// ===== Période transmise par l'URL =====
//
// Le tableau de bord peut renvoyer ici en conservant la période affichée. Les
// noms et formats sont EXACTEMENT ceux envoyés à l'API par cette page :
//   ?periode=annee&date=2026
//   ?periode=mois&date=2026-03
//   ?periode=plage&startDate=2026-01-01&endDate=2026-03-31
// Toute valeur absente ou aberrante est ignorée silencieusement : on retombe
// alors sur le comportement historique (année en cours).

type PeriodeEtat = {
  periode: 'annee' | 'mois' | 'plage'
  date: string
  dateDebut: Date | null
  dateFin: Date | null
}

const FORMAT_ANNEE = /^\d{4}$/
const FORMAT_MOIS = /^\d{4}-(0[1-9]|1[0-2])$/
const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/

const periodeParDefaut = (): PeriodeEtat => ({
  periode: 'annee',
  date: new Date().getFullYear().toString(),
  dateDebut: null,
  dateFin: null,
})

/**
 * `YYYY-MM-DD` -> Date en UTC minuit. L'heure UTC est indispensable : la page
 * resérialise ces dates avec `toISOString().split('T')[0]`, et un minuit LOCAL
 * (UTC+1/+2) reviendrait la veille — la période reçue ne serait pas celle
 * renvoyée au backend.
 */
const parseJourUtc = (valeur: string | null): Date | null => {
  if (!valeur || !FORMAT_JOUR.test(valeur)) return null
  const date = new Date(`${valeur}T00:00:00Z`)
  return isNaN(date.getTime()) ? null : date
}

const lirePeriodeDepuisUrl = (params: { get: (cle: string) => string | null }): PeriodeEtat => {
  const defaut = periodeParDefaut()
  const periode = params.get('periode')

  if (periode === 'annee') {
    const date = params.get('date')
    return date && FORMAT_ANNEE.test(date) ? { ...defaut, date } : defaut
  }

  if (periode === 'mois') {
    const date = params.get('date')
    return date && FORMAT_MOIS.test(date)
      ? { periode: 'mois', date, dateDebut: null, dateFin: null }
      : defaut
  }

  if (periode === 'plage') {
    const debut = parseJourUtc(params.get('startDate'))
    const fin = parseJourUtc(params.get('endDate'))
    // Les DEUX bornes sont exigées : le chargement ignore une plage incomplète,
    // la page resterait désespérément vide.
    if (!debut || !fin || debut.getTime() > fin.getTime()) return defaut
    return { periode: 'plage', date: defaut.date, dateDebut: debut, dateFin: fin }
  }

  return defaut
}

// ===== Main Page Component =====

export default function ConformitePage() {
  const searchParams = useSearchParams()

  // Initialisation AU MONTAGE uniquement (initialiseurs paresseux) : la page
  // n'est pas pilotée par l'URL, l'utilisateur reprend la main avec le
  // PeriodSelector et rien ne réécrit la barre d'adresse (aucune boucle de
  // navigation possible).
  const [periodeInitiale] = useState<PeriodeEtat>(() => lirePeriodeDepuisUrl(searchParams))

  // Period selector state
  const [periode, setPeriode] = useState<'annee' | 'mois' | 'plage'>(periodeInitiale.periode)
  const [date, setDate] = useState<string>(periodeInitiale.date)
  const [dateDebut, setDateDebut] = useState<Date | null>(periodeInitiale.dateDebut)
  const [dateFin, setDateFin] = useState<Date | null>(periodeInitiale.dateFin)

  // Type d'obligation affiché (annuelle par défaut)
  const [mandatoryType, setMandatoryType] = useState<MandatoryType>('annuelle')

  // Mandatory trainings data
  const [mandatoryData, setMandatoryData] = useState<MandatoryTrainingsKPIs | null>(null)
  const [mandatoryLoading, setMandatoryLoading] = useState(true)

  // Compliance / risk category data

  // Formation scope selection
  const [selectedFormationIds, setSelectedFormationIds] = useState<number[]>([])
  const [availableFormations, setAvailableFormations] = useState<{ id: number; nom: string }[]>([])
  const [allFormations, setAllFormations] = useState<{ id: number; nom: string }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Formation detail modal.
  // La même modale sert au tableau « Détail par formation » (vue globale) et au
  // dépliage d'un département (`selectedFormationDept` renseigné) : c'est la
  // liste nominative unique de la page, l'ancienne modale de la matrice ayant
  // été supprimée.
  const [selectedFormation, setSelectedFormation] = useState<MandatoryTrainingsKPIs['formations'][0] | null>(null)
  const [selectedFormationDept, setSelectedFormationDept] = useState<string | null>(null)
  const [modalTab, setModalTab] = useState<'formes' | 'nonFormes'>('nonFormes')

  // Manager view
  const [byManagerData, setByManagerData] = useState<MandatoryByManagerResponse | null>(null)
  const [byManagerLoading, setByManagerLoading] = useState(false)
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [selectedManagers, setSelectedManagers] = useState<number[]>([])

  // Vue par organisation (département / équipe)
  const [orgView, setOrgView] = useState<'departement' | 'equipe'>('departement')
  // Départements sélectionnés pour une relance de leur DIRECTEUR
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([])
  // Départements dépliés : révèlent le détail par formation de la ligne
  const [expandedDeptIds, setExpandedDeptIds] = useState<number[]>([])
  // Détail nominatif des non formés d'un manager
  const [managerDetail, setManagerDetail] = useState<OrgManagerRow | null>(null)

  // Rattachement de chaque libellé d'organisation à son DÉPARTEMENT parent.
  // Indispensable : `parDepartement` est agrégé au niveau département (rollup
  // des équipes côté backend) alors que `formations[].formes/nonFormes`
  // portent le libellé BRUT du rattachement du collaborateur (souvent une
  // équipe). Sans ce rollup, le détail dépliable d'un département afficherait
  // 0 collaborateur dès que l'effectif est rattaché à des équipes.
  const [rollupDepartements, setRollupDepartements] = useState<Map<string, string>>(new Map())

  // Reminder modal
  const [reminderTarget, setReminderTarget] = useState<ReminderTarget>('directeurs')
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [smtpLoading, setSmtpLoading] = useState(false)

  // Email status
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; connectionValid: boolean; message: string } | null>(null)

  // ===== Initial Load =====

  useEffect(() => {
    fetchAllFormations()
    checkEmailStatusOnMount()
    fetchRollupDepartements()
  }, [])

  // Load data when period or mandatory type changes.
  // Ce chargement est NON filtré : il sert à la fois à afficher les chiffres et
  // à (re)construire la liste des formations du périmètre.
  useEffect(() => {
    fetchMandatoryData({ reinitialiserPerimetre: true })
  }, [periode, date, dateDebut, dateFin, mandatoryType])

  // Recharger quand la SÉLECTION de formations change.
  // C'est ce câblage qui manquait : la carte "Scope" ne pilotait rien, cocher
  // ou décocher une formation ne pouvait pas modifier les chiffres.
  //
  // La signature évite un double chargement : le fetch non filtré réinitialise
  // `selectedFormationIds` avec un NOUVEAU tableau, ce qui relancerait cet
  // effet alors que les données affichées sont déjà les bonnes.
  const derniereSelectionServie = useRef<string | null>(null)

  // Jeton de requête : une réponse plus ancienne ne doit jamais écraser une
  // plus récente (typiquement, cocher une formation pendant qu'un rechargement
  // de périmètre est encore en vol).
  const requeteEnCours = useRef(0)

  const signatureSelection = (ids: number[]) =>
    [...ids].sort((a, b) => a - b).join(',')

  useEffect(() => {
    if (!hasInitialized) return
    if (derniereSelectionServie.current === signatureSelection(selectedFormationIds)) return
    fetchMandatoryData({ reinitialiserPerimetre: false })
  }, [selectedFormationIds, hasInitialized])

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

  /**
   * Reconstruit côté client le rattachement « équipe → département parent »
   * appliqué par le backend sur `parDepartement`. Les départements INACTIFS
   * sont inclus : un collaborateur peut rester rattaché à une équipe
   * désactivée, et l'omettre casserait son rattachement.
   * En cas d'échec, on reste sur une identité (libellé = lui-même) : le détail
   * dépliable reste juste pour les organisations sans équipe, et la page ne
   * doit pas être bloquée par cet appel accessoire.
   */
  const fetchRollupDepartements = async () => {
    try {
      const departements = await departementsService.getAll({ includeInactive: true })
      // `as const` : sans lui, TypeScript infère `(number | Departement)[]`
      // pour l'entrée du Map au lieu d'un tuple [clé, valeur].
      const parId = new Map(departements.map((d) => [d.id, d] as const))
      const estDepartement = (d: { type?: string | null }) =>
        (d.type || 'DEPARTEMENT').toUpperCase() === 'DEPARTEMENT'

      const rollup = new Map<string, string>()
      for (const depart of departements) {
        let rattachement = depart
        if (!estDepartement(depart)) {
          let courant = depart
          let profondeur = 0
          const visites = new Set<number>([depart.id])
          // Garde-fou identique au backend : hiérarchie profonde ou circulaire
          while (courant.parentId != null && profondeur < 10) {
            const parent = parId.get(courant.parentId)
            if (!parent || visites.has(parent.id)) break
            visites.add(parent.id)
            courant = parent
            profondeur++
            if (estDepartement(courant)) {
              rattachement = courant
              break
            }
          }
        }
        rollup.set(depart.nomDepartement, rattachement.nomDepartement)
      }
      setRollupDepartements(rollup)
    } catch (error) {
      console.error('Erreur lors du chargement de la hierarchie des departements:', error)
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

  const fetchMandatoryData = async (
    options: { reinitialiserPerimetre: boolean } = { reinitialiserPerimetre: true }
  ) => {
    if (periode === 'plage' && (!dateDebut || !dateFin)) return

    const requeteId = ++requeteEnCours.current
    setMandatoryLoading(true)
    setByManagerLoading(true)
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined

      // Quand on (re)construit le périmètre, on interroge TOUTES les formations
      // obligatoires. Sinon on n'interroge que la sélection en cours.
      const idsDemandes = options.reinitialiserPerimetre ? undefined : selectedFormationIds

      // Sélection vide : rien à calculer, on évite un appel inutile
      if (!options.reinitialiserPerimetre && selectedFormationIds.length === 0) {
        setMandatoryData(null)
        // Sinon la vue « Par équipe » continuerait d'afficher les managers du
        // scope précédent alors que plus aucune formation n'est sélectionnée.
        setByManagerData(null)
        setMandatoryLoading(false)
        setByManagerLoading(false)
        return
      }

      // Les deux appels partent réellement en parallèle (avant : séquentiels,
      // ce qui doublait le temps d'affichage à chaque changement de période)
      const mandatoryPromise = statsService.getMandatoryTrainingsKPIs(
        periode, date, startDateStr, endDateStr, mandatoryType, idsDemandes
      )
      const byManagerPromise = statsService.getMandatoryTrainingsByManager(
        periode, date, startDateStr, endDateStr,
        selectedDept ? parseInt(selectedDept) : undefined,
        mandatoryType,
        idsDemandes
      ).catch((managerError: unknown) => {
        console.error('Erreur lors du chargement des donnees par manager:', managerError)
        return null
      })

      const mandatoryResponse = await mandatoryPromise

      // Réponse périmée : une requête plus récente a été lancée entre-temps
      if (requeteId !== requeteEnCours.current) return

      setMandatoryData(mandatoryResponse)
      // Marqué "servi" seulement après succès : en cas d'échec, la sélection
      // pourra être retentée.
      derniereSelectionServie.current = signatureSelection(
        idsDemandes ?? selectedFormationIds
      )

      // (Re)construire le périmètre à chaque changement de période ou de type.
      // Avant, un verrou `hasInitialized` figeait la liste au tout premier
      // chargement : changer d'année laissait les puces de l'année précédente,
      // qui pouvaient contredire le tableau affiché en dessous.
      if (options.reinitialiserPerimetre) {
        const mandatoryFormationsList = mandatoryResponse.formations.map(
          (f: { id: number; nomFormation: string }) => ({ id: f.id, nom: f.nomFormation })
        )
        const ids = mandatoryFormationsList.map((f: { id: number }) => f.id)
        setAvailableFormations(mandatoryFormationsList)
        setSelectedFormationIds(ids)
        // Les données affichées correspondent déjà à cette sélection complète :
        // inutile de relancer un appel quand l'effet de sélection se déclenchera.
        derniereSelectionServie.current = signatureSelection(ids)
        setHasInitialized(true)
      }

      setMandatoryLoading(false)

      setByManagerData(await byManagerPromise)
    } catch (error) {
      console.error('Erreur lors du chargement des formations obligatoires:', error)
    } finally {
      if (requeteId === requeteEnCours.current) {
        setMandatoryLoading(false)
        setByManagerLoading(false)
      }
    }
  }

  const fetchByManagerData = async () => {
    setByManagerLoading(true)
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined

      const response = await statsService.getMandatoryTrainingsByManager(
        periode, date, startDateStr, endDateStr,
        selectedDept ? parseInt(selectedDept) : undefined,
        mandatoryType,
        selectedFormationIds.length > 0 ? selectedFormationIds : undefined
      )
      setByManagerData(response)
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

  // ===== Vue par organisation : données dérivées =====

  // Réutilise le statut email déjà chargé au montage (pas d'appel supplémentaire)
  const emailConfigured = !!emailStatus?.configured

  // Départements triés du moins conforme au plus conforme (les pires en haut).
  // Dérivé de `mandatoryData` : se met à jour tout seul avec la période, le
  // type d'obligation et le scope des formations.
  const departementRows = [...(mandatoryData?.parDepartement ?? [])].sort(
    (a, b) => a.tauxConformite - b.tauxConformite
  )

  // Le pseudo-département « Non défini » (id 0) et les départements sans
  // directeur joignable ne sont pas relançables.
  const isDeptRelancable = (row: MandatoryTrainingsKPIs['parDepartement'][0]) =>
    row.departementId !== 0 && row.peutEtreRelance === true && !!row.directeur

  const relancableDeptRows = departementRows.filter(isDeptRelancable)

  // ===== Rattachement des collaborateurs à leur département =====

  /**
   * Libellé du département de rattachement d'un collaborateur.
   * `formations[].formes/nonFormes[].departement` porte le libellé BRUT (une
   * équipe le cas échéant) : on le remonte au département parent pour rester
   * aligné sur les lignes de `parDepartement`.
   */
  const departementDeRattachement = (libelle?: string | null): string => {
    if (!libelle) return 'Non défini'
    return rollupDepartements.get(libelle) ?? libelle
  }

  /**
   * Détail par formation pour UN département : combien de ses collaborateurs
   * ont suivi chaque formation du périmètre. C'est la valeur qu'apportait
   * l'ancienne matrice, désormais rattachée à la ligne sur laquelle la RH
   * travaille déjà. Calculé seulement pour les lignes dépliées.
   */
  const detailParFormationDuDepartement = (
    departement: string
  ): DetailFormationDepartement[] =>
    (mandatoryData?.formations ?? []).map((formation) => {
      const formes = formation.formes.filter(
        (c) => departementDeRattachement(c.departement) === departement
      ).length
      const nonFormes = formation.nonFormes.filter(
        (c) => departementDeRattachement(c.departement) === departement
      ).length
      const total = formes + nonFormes
      return {
        formation,
        formes,
        nonFormes,
        total,
        taux: total > 0 ? Math.round((formes / total) * 1000) / 10 : 0,
      }
    })

  const toggleExpandedDept = (departementId: number) => {
    setExpandedDeptIds((prev) =>
      prev.includes(departementId)
        ? prev.filter((id) => id !== departementId)
        : [...prev, departementId]
    )
  }

  // Ouvre la liste nominative d'une formation, éventuellement restreinte à un
  // département (dépliage d'une ligne). `null` = toute la population cible.
  const openFormationDetail = (
    formation: MandatoryTrainingsKPIs['formations'][0],
    departement: string | null = null
  ) => {
    setSelectedFormation(formation)
    setSelectedFormationDept(departement)
    setModalTab('nonFormes')
  }

  const closeFormationDetail = () => {
    setSelectedFormation(null)
    setSelectedFormationDept(null)
  }

  // Listes nominatives affichées dans la modale, filtrées sur le département
  // quand la modale a été ouverte depuis le dépliage d'une ligne.
  const formationModalFormes = selectedFormation
    ? selectedFormationDept
      ? selectedFormation.formes.filter(
          (c) => departementDeRattachement(c.departement) === selectedFormationDept
        )
      : selectedFormation.formes
    : []

  const formationModalNonFormes = selectedFormation
    ? selectedFormationDept
      ? selectedFormation.nonFormes.filter(
          (c) => departementDeRattachement(c.departement) === selectedFormationDept
        )
      : selectedFormation.nonFormes
    : []

  // Managers de tous les départements, dédoublonnés, triés par nombre de
  // collaborateurs non formés décroissant.
  const managerRows: OrgManagerRow[] = (() => {
    const seen = new Set<number>()
    const rows: OrgManagerRow[] = []
    ;(byManagerData?.departements ?? []).forEach((d) => {
      ;(d.managers ?? []).forEach((m) => {
        if (seen.has(m.id)) return
        seen.add(m.id)
        rows.push({
          id: m.id,
          nomComplet: m.nomComplet || m.nom || `Manager #${m.id}`,
          departementId: d.id,
          departement: d.nom,
          collaborateursNonFormes: m.collaborateursNonFormes ?? [],
        })
      })
    })
    return rows.sort(
      (a, b) => b.collaborateursNonFormes.length - a.collaborateursNonFormes.length
    )
  })()

  const sansManagerRows = byManagerData?.sansManager ?? []

  // Les sélections ne sont jamais purgées lors d'un rechargement : on les
  // intersecte systématiquement avec les données courantes, ce qui neutralise
  // tout id devenu obsolète (changement de période / type / scope).
  const effectiveDeptIds = relancableDeptRows
    .filter((d) => selectedDeptIds.includes(d.departementId))
    .map((d) => d.departementId)

  const effectiveManagerIds = managerRows
    .filter((m) => selectedManagers.includes(m.id))
    .map((m) => m.id)

  const toggleDeptId = (departementId: number) => {
    setSelectedDeptIds((prev) =>
      prev.includes(departementId)
        ? prev.filter((id) => id !== departementId)
        : [...prev, departementId]
    )
  }

  const toggleSelectAllDeptIds = () => {
    if (effectiveDeptIds.length === relancableDeptRows.length) {
      setSelectedDeptIds([])
    } else {
      setSelectedDeptIds(relancableDeptRows.map((d) => d.departementId))
    }
  }

  const toggleSelectAllManagerRows = () => {
    if (effectiveManagerIds.length === managerRows.length) {
      setSelectedManagers([])
    } else {
      setSelectedManagers(managerRows.map((m) => m.id))
    }
  }

  const openReminderModal = (target: ReminderTarget) => {
    setReminderTarget(target)
    setShowReminderModal(true)
  }

  // Destinataires affichés dans la modale de confirmation, selon la cible
  const reminderRecipients: Array<{
    key: string
    nom: string
    sousTitre?: string
    count: number
  }> = (() => {
    if (reminderTarget === 'directeurs') {
      return relancableDeptRows
        .filter((d) => effectiveDeptIds.includes(d.departementId))
        .map((d) => ({
          key: `dept-${d.departementId}`,
          nom: d.directeur?.nomComplet ?? 'Directeur',
          sousTitre: d.departement,
          count: d.nonFormes,
        }))
    }
    return managerRows
      .filter((m) => effectiveManagerIds.includes(m.id))
      .map((m) => ({
        key: `mgr-${m.id}`,
        nom: m.nomComplet,
        sousTitre: m.departement,
        count: m.collaborateursNonFormes.length,
      }))
  })()

  const reminderRoleLabel = reminderTarget === 'directeurs' ? 'directeur' : 'manager'

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

  // Export Excel du suivi (liste à relancer, une feuille par formation, synthèse)
  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const annee = periode === 'annee'
        ? parseInt(date, 10)
        : periode === 'mois'
          ? parseInt(date.split('-')[0], 10)
          : (dateDebut ?? new Date()).getFullYear()
      const anneeExport = isNaN(annee) ? new Date().getFullYear() : annee
      // Le backend accepte 'securite' sur cet export ; la signature du service
      // reste à élargir (fichier hors périmètre de cette refonte).
      const blob = await exportsService.exportFormationsObligatoires(
        anneeExport,
        mandatoryType as 'annuelle' | 'onboarding'
      )
      exportsService.downloadBlob(blob, `formations-obligatoires_${anneeExport}_${mandatoryType}.xlsx`)
      notifications.show({
        title: 'Export généré',
        message: 'Le fichier Excel de suivi a été téléchargé',
        color: 'green',
        icon: <CheckCircle size={20} weight="fill" />,
      })
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error)
      notifications.show({
        title: 'Erreur',
        message: "Impossible de générer l'export Excel",
        color: 'red',
        icon: <WarningCircle size={20} weight="fill" />,
      })
    } finally {
      setExporting(false)
    }
  }

  const handleSendReminders = async () => {
    // Destinataires selon la cible ouverte. Le backend renvoie un 400 si les
    // deux listes sont vides : on garde-fou côté client.
    const managerIds = reminderTarget === 'managers' ? effectiveManagerIds : undefined
    const departementIds = reminderTarget === 'directeurs' ? effectiveDeptIds : undefined

    if ((managerIds?.length ?? 0) === 0 && (departementIds?.length ?? 0) === 0) {
      notifications.show({
        title: 'Aucun destinataire',
        message: 'Selectionnez au moins un destinataire avant d\'envoyer les rappels.',
        color: 'orange',
        icon: <WarningCircle size={20} weight="fill" />,
      })
      return
    }

    setSendingReminders(true)
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined

      const result = await notificationsService.sendMandatoryTrainingReminders({
        managerIds,
        departementIds,
        periode,
        date,
        startDate: startDateStr,
        endDate: endDateStr,
        // Sans ce paramètre, les rappels étaient TOUJOURS calculés sur les
        // obligatoires annuelles : en onglet Onboarding, le contenu des emails
        // ne correspondait pas à ce qui est affiché à l'écran.
        // Le backend accepte aussi 'securite' ; la signature du service reste
        // à élargir (fichier hors périmètre de cette refonte).
        type: mandatoryType as 'annuelle' | 'onboarding',
      })

      setShowReminderModal(false)

      const totalCible =
        result.totalDestinataires ??
        (managerIds?.length ?? 0) + (departementIds?.length ?? 0)
      const echecs = (result.details ?? []).filter((d) => !d.success)

      // Detail des echecs, reutilise pour le succes partiel comme pour l'echec global
      const detailEchecs = (
        <>
          {echecs.slice(0, 5).map((d, i) => (
            <Text key={`${d.managerId}-${i}`} size="xs" c="red">
              {d.departementNom ? `${d.departementNom} — ` : ''}
              {d.managerNom || 'Destinataire inconnu'} : {d.error || 'echec inconnu'}
            </Text>
          ))}
          {echecs.length > 5 && (
            <Text size="xs" c="dimmed">et {echecs.length - 5} autre(s) echec(s)...</Text>
          )}
        </>
      )

      if (result.success) {
        notifications.show({
          title: result.erreurs > 0 ? 'Rappels partiellement envoyes' : 'Rappels envoyes',
          message: (
            <Stack gap={4}>
              <Text size="sm">
                {result.envoyesAvecSucces}/{totalCible} rappel(s) envoye(s) avec succes.
                {result.erreurs > 0 ? ` ${result.erreurs} erreur(s).` : ''}
              </Text>
              {detailEchecs}
            </Stack>
          ),
          color: result.erreurs > 0 ? 'orange' : 'green',
          icon: <CheckCircle size={20} weight="fill" />,
          autoClose: result.erreurs > 0 ? false : 5000,
        })

        // Envoi réussi : on vide la sélection concernée
        if (reminderTarget === 'directeurs') setSelectedDeptIds([])
        else setSelectedManagers([])
      } else {
        notifications.show({
          title: 'Erreur',
          message: (
            <Stack gap={4}>
              <Text size="sm">{result.message}</Text>
              {detailEchecs}
            </Stack>
          ),
          color: 'red',
          icon: <WarningCircle size={20} weight="fill" />,
          autoClose: false,
        })
      }
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

  // ===== Libellés dépendant du périmètre suivi =====
  // Un seul endroit pour les trois modes : annuelle / onboarding / sécurité.

  const estOnboarding = mandatoryType === 'onboarding'
  const estSecurite = mandatoryType === 'securite'

  // « Formations obligatoires » / « Formations onboarding » / « Formations de securite (SST) »
  const titrePerimetre = estOnboarding
    ? 'Formations onboarding'
    : estSecurite
      ? 'Formations de securite (SST)'
      : 'Formations obligatoires'

  // Même chose en minuscules, pour les phrases
  const libellePerimetre = estOnboarding
    ? 'formations onboarding'
    : estSecurite
      ? 'formations de securite au travail (SST)'
      : 'formations obligatoires'

  // Population concernée par le suivi
  const libellePopulation = estOnboarding
    ? 'Nouveaux arrivants de la periode'
    : 'Tout l\'effectif actif'

  // Nombre de collaborateurs sortis du dénominateur (congé longue durée).
  // Absent des réponses d'une API antérieure : traité comme 0.
  const collaborateursEnConge = mandatoryData?.stats?.collaborateursEnConge ?? 0

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
                <Title order={1}>Conformite des formations</Title>
                <Text c="dimmed">
                  Suivi des {libellePerimetre}
                </Text>
              </Stack>
              <Group gap="sm">
                <Button
                  leftSection={<DownloadSimple size={18} />}
                  variant="light"
                  onClick={handleExportExcel}
                  loading={exporting}
                >
                  Exporter (Excel)
                </Button>
                <Badge color="green" variant="light" size="lg">Temps reel</Badge>
              </Group>
            </Group>
            <PeriodSelector
              periode={periode}
              date={date}
              dateDebut={dateDebut}
              dateFin={dateFin}
              onChange={(p, d) => { setPeriode(p); setDate(d) }}
              onDateRangeChange={(debut, fin) => { setDateDebut(debut); setDateFin(fin) }}
            />
            <Group>
              <SegmentedControl
                value={mandatoryType}
                onChange={(value) => {
                  setMandatoryType(value as MandatoryType)
                  // Réinitialiser le scope : les trois périmètres (annuelles,
                  // onboarding, sécurité) sont des listes de formations distinctes
                  setHasInitialized(false)
                  setAvailableFormations([])
                  setSelectedFormationIds([])
                  // Les lignes dépliées portaient sur l'ancien périmètre
                  setExpandedDeptIds([])
                }}
                data={[
                  { label: 'Obligatoires annuelles (tout l\'effectif)', value: 'annuelle' },
                  { label: 'Onboarding (nouveaux arrivants)', value: 'onboarding' },
                  { label: 'Securite au travail (SST)', value: 'securite' },
                ]}
              />
            </Group>
            {estOnboarding && (
              <Alert color="blue" variant="light" icon={<Info size={18} />}>
                <Text size="sm">
                  Le suivi <strong>Onboarding</strong> est distinct des obligatoires annuelles :
                  il porte uniquement sur les <strong>collaborateurs arrivés durant la période
                  sélectionnée</strong> (date d&apos;embauche de la fiche, à défaut date de création)
                  et sur les formations marquées « Onboarding ».
                </Text>
                {mandatoryData?.stats?.totalFormations === 0 && (
                  <Text size="sm" mt="xs">
                    <strong>Aucune formation n&apos;est marquée « Onboarding » pour l&apos;instant.</strong>{' '}
                    Pour en ajouter : Formations → ouvrir la formation → Modifier →
                    cocher « Formation obligatoire » puis Type d&apos;obligation = <strong>Onboarding</strong>.
                    La date d&apos;embauche se renseigne sur la fiche du collaborateur (Modifier).
                  </Text>
                )}
              </Alert>
            )}
            {estSecurite && (
              <Alert color="blue" variant="light" icon={<Info size={18} />}>
                <Text size="sm">
                  Le suivi <strong>Sécurité au travail (SST)</strong> est un périmètre
                  distinct des obligatoires annuelles : il porte sur les formations
                  marquées « Formation sécurité (SST) » (premiers secours, travail en
                  hauteur, EPI, incendie) et concerne <strong>tout l&apos;effectif actif</strong>.
                </Text>
                {mandatoryData?.stats?.totalFormations === 0 && (
                  <Text size="sm" mt="xs">
                    <strong>Aucune formation n&apos;est marquée « Sécurité (SST) » pour l&apos;instant.</strong>{' '}
                    Pour en ajouter : Formations → ouvrir la formation → Modifier →
                    activer <strong>« Formation sécurité (SST) »</strong>. Ce réglage est
                    indépendant de « Formation obligatoire ».
                  </Text>
                )}
              </Alert>
            )}
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
                  {titrePerimetre} ({selectedFormationIds.length}/{availableFormations.length} selectionnees)
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
                  Aucune formation dans le perimetre « {titrePerimetre} » - Utilisez
                  "Ajouter une formation" pour en ajouter
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
                title={titrePerimetre}
                value={mandatoryData.stats.totalFormations}
                subtitle={
                  estOnboarding
                    ? 'Parcours nouveaux arrivants'
                    : estSecurite
                      ? 'Securite au travail, a suivre par tous'
                      : 'A suivre par tous'
                }
                icon={<ShieldCheck size={22} weight="bold" />}
                color="violet"
                delay={0.1}
              />
              <KPICard
                title="Taux de conformite"
                value={mandatoryData.stats.tauxConformiteGlobal}
                suffix="%"
                subtitle={`${libellePopulation} ayant complete TOUTES les formations du perimetre`}
                footer={
                  collaborateursEnConge > 0 ? (
                    <Tooltip
                      multiline
                      w={280}
                      label="Les collaborateurs en conge longue duree ne peuvent pas suivre les formations sur la periode : ils sont exclus du perimetre suivi, donc du denominateur de ce taux, et ne sont pas relances."
                    >
                      <Text size="xs" c="dimmed" style={{ cursor: 'help' }}>
                        <Info size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {collaborateursEnConge} collaborateur(s) en conge longue duree exclu(s)
                      </Text>
                    </Tooltip>
                  ) : undefined
                }
                icon={<CheckCircle size={22} weight="bold" />}
                color={
                  mandatoryData.stats.tauxConformiteGlobal === null
                    ? 'gray'
                    : mandatoryData.stats.tauxConformiteGlobal >= 80
                      ? 'green'
                      : mandatoryData.stats.tauxConformiteGlobal >= 50
                        ? 'cyan'
                        : 'pink'
                }
                delay={0.15}
              />
              <KPICard
                title={estOnboarding ? 'Arrivants conformes' : 'Collaborateurs conformes'}
                value={mandatoryData.stats.totalFormes}
                subtitle={`sur ${mandatoryData.stats.totalCollaborateursAFormer}${estOnboarding ? ' arrivants' : ''}`}
                icon={<Users size={22} weight="bold" />}
                color="green"
                delay={0.2}
              />
              <KPICard
                title={estOnboarding ? 'Arrivants non conformes' : 'Collaborateurs non conformes'}
                value={mandatoryData.stats.totalNonFormes}
                subtitle="A former"
                icon={<WarningCircle size={22} weight="bold" />}
                color="pink"
                delay={0.25}
              />
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
                  <Text size="sm" c="dimmed">
                    Part de la population suivie ayant complete <strong>chaque</strong> formation
                    prise separement. A ne pas confondre avec le taux de conformite, qui exige
                    d&apos;avoir complete TOUTES les formations du perimetre.
                  </Text>
                </Stack>

                <Table striped withTableBorder highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Formation</Table.Th>
                      <Table.Th>Categorie</Table.Th>
                      <Table.Th>Formes</Table.Th>
                      <Table.Th>Non formes</Table.Th>
                      <Table.Th>
                        <Tooltip
                          label="Part de la population suivie ayant complete CETTE formation"
                          multiline
                          w={240}
                        >
                          <Text size="sm" fw={700} style={{ cursor: 'help' }}>
                            Taux par formation
                          </Text>
                        </Tooltip>
                      </Table.Th>
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
                            onClick={() => openFormationDetail(formation)}
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

        {/* ===== SECTION 4: VUE PAR ORGANISATION (DEPARTEMENT / EQUIPE) ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card shadow="sm" withBorder radius="md" padding="lg">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Group gap="xs" align="flex-start">
                  <ThemeIcon variant="light" color="grape" size="md" radius="md">
                    <UserList size={18} weight="bold" />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Title order={3}>Vue par organisation</Title>
                    <Text size="sm" c="dimmed">
                      Relancez le directeur d&apos;un departement ou le manager d&apos;une equipe.
                      Depliez une ligne pour voir le detail formation par formation.
                    </Text>
                  </Stack>
                </Group>
                <SegmentedControl
                  value={orgView}
                  onChange={(value) => setOrgView(value as 'departement' | 'equipe')}
                  data={[
                    { label: 'Par departement', value: 'departement' },
                    { label: 'Par equipe', value: 'equipe' },
                  ]}
                />
              </Group>

              {emailStatus && !emailStatus.configured && (
                <Alert color="orange" variant="light" icon={<Warning size={18} weight="bold" />}>
                  L&apos;envoi d&apos;emails n&apos;est pas configure : les relances sont
                  desactivees. {emailStatus?.message}
                </Alert>
              )}

              <AnimatePresence mode="wait">
                {/* ---------- ONGLET PAR DEPARTEMENT ---------- */}
                {orgView === 'departement' && (
                  <motion.div
                    key="org-departement"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Stack gap="md">
                      {mandatoryLoading ? (
                        <Center py="xl"><Loader size="sm" /></Center>
                      ) : departementRows.length === 0 ? (
                        <Text size="sm" c="dimmed" ta="center" py="md">
                          Aucun departement a afficher pour cette periode.
                        </Text>
                      ) : (
                        <>
                          <Group justify="space-between">
                            <Checkbox
                              size="xs"
                              label="Tout selectionner"
                              disabled={relancableDeptRows.length === 0}
                              checked={
                                relancableDeptRows.length > 0 &&
                                effectiveDeptIds.length === relancableDeptRows.length
                              }
                              indeterminate={
                                effectiveDeptIds.length > 0 &&
                                effectiveDeptIds.length < relancableDeptRows.length
                              }
                              onChange={toggleSelectAllDeptIds}
                            />
                            <Button
                              size="sm"
                              leftSection={<EnvelopeSimple size={18} weight="bold" />}
                              disabled={effectiveDeptIds.length === 0 || !emailConfigured}
                              onClick={() => openReminderModal('directeurs')}
                            >
                              Relancer les directeurs selectionnes ({effectiveDeptIds.length})
                            </Button>
                          </Group>

                          <Table.ScrollContainer minWidth={800}>
                            <Table striped highlightOnHover withTableBorder>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th style={{ width: 40 }}></Table.Th>
                                  <Table.Th style={{ width: 40 }}></Table.Th>
                                  <Table.Th style={{ minWidth: 160 }}>Departement</Table.Th>
                                  <Table.Th style={{ minWidth: 160 }}>Directeur</Table.Th>
                                  <Table.Th style={{ textAlign: 'center' }}>Collaborateurs</Table.Th>
                                  <Table.Th style={{ textAlign: 'center' }}>Conformes</Table.Th>
                                  <Table.Th style={{ textAlign: 'center' }}>Non conformes</Table.Th>
                                  <Table.Th style={{ minWidth: 160 }}>
                                    <Tooltip
                                      label="Part des collaborateurs du departement ayant complete TOUTES les formations du perimetre"
                                      multiline
                                      w={260}
                                    >
                                      <Text size="sm" fw={700} style={{ cursor: 'help' }}>
                                        Taux de conformite
                                      </Text>
                                    </Tooltip>
                                  </Table.Th>
                                  <Table.Th style={{ minWidth: 170 }}>Actions</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {departementRows.map((row) => {
                                  const relancable = isDeptRelancable(row)
                                  const raisonBlocage =
                                    row.departementId === 0
                                      ? 'Collaborateurs sans departement : aucun directeur a relancer'
                                      : !row.directeur
                                        ? 'Aucun directeur identifie pour ce departement'
                                        : "Le directeur n'a pas d'adresse email renseignee"
                                  const couleurTaux = getCoverageColor(row.tauxConformite)
                                  const deplie = expandedDeptIds.includes(row.departementId)
                                  return (
                                    <Fragment key={row.departementId || `dept-${row.departement}`}>
                                    <Table.Tr>
                                      <Table.Td>
                                        {relancable ? (
                                          <Checkbox
                                            size="xs"
                                            checked={effectiveDeptIds.includes(row.departementId)}
                                            onChange={() => toggleDeptId(row.departementId)}
                                          />
                                        ) : (
                                          <Tooltip label={raisonBlocage} multiline w={240}>
                                            <Box>
                                              <Checkbox size="xs" checked={false} disabled readOnly />
                                            </Box>
                                          </Tooltip>
                                        )}
                                      </Table.Td>
                                      <Table.Td>
                                        <Tooltip
                                          label={
                                            deplie
                                              ? 'Masquer le detail par formation'
                                              : 'Voir le detail par formation'
                                          }
                                        >
                                          <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            size="sm"
                                            aria-label={
                                              deplie
                                                ? `Masquer le detail de ${row.departement}`
                                                : `Voir le detail de ${row.departement}`
                                            }
                                            onClick={() => toggleExpandedDept(row.departementId)}
                                          >
                                            {deplie ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
                                          </ActionIcon>
                                        </Tooltip>
                                      </Table.Td>
                                      <Table.Td>
                                        <Text size="sm" fw={600}>{row.departement}</Text>
                                      </Table.Td>
                                      <Table.Td>
                                        {!row.directeur ? (
                                          <Badge color="gray" variant="light" size="sm">
                                            Aucun directeur
                                          </Badge>
                                        ) : (
                                          <Stack gap={2}>
                                            <Text size="sm">{row.directeur.nomComplet}</Text>
                                            {!row.directeur.email && (
                                              <Badge color="orange" variant="light" size="sm">
                                                Email manquant
                                              </Badge>
                                            )}
                                          </Stack>
                                        )}
                                      </Table.Td>
                                      <Table.Td style={{ textAlign: 'center' }}>
                                        <Text size="sm">{row.totalCollaborateurs}</Text>
                                      </Table.Td>
                                      <Table.Td style={{ textAlign: 'center' }}>
                                        <Text size="sm" c="green" fw={600}>{row.formes}</Text>
                                      </Table.Td>
                                      <Table.Td style={{ textAlign: 'center' }}>
                                        <Text size="sm" c="red" fw={600}>{row.nonFormes}</Text>
                                      </Table.Td>
                                      <Table.Td>
                                        <Group gap="xs" wrap="nowrap">
                                          <Progress
                                            value={row.tauxConformite}
                                            color={couleurTaux}
                                            size="sm"
                                            radius="md"
                                            style={{ flex: 1, minWidth: 70 }}
                                          />
                                          <Text size="sm" fw={700} c={couleurTaux === 'yellow' ? 'yellow.7' : couleurTaux}>
                                            {row.tauxConformite}%
                                          </Text>
                                        </Group>
                                      </Table.Td>
                                      <Table.Td>
                                        <Tooltip
                                          label={
                                            !relancable
                                              ? raisonBlocage
                                              : !emailConfigured
                                                ? "L'envoi d'emails n'est pas configure"
                                                : `Relancer ${row.directeur?.nomComplet}`
                                          }
                                          multiline
                                          w={240}
                                        >
                                          <Box>
                                            <Button
                                              variant="light"
                                              size="xs"
                                              leftSection={<EnvelopeSimple size={14} weight="bold" />}
                                              disabled={!relancable || !emailConfigured}
                                              onClick={() => {
                                                setSelectedDeptIds([row.departementId])
                                                openReminderModal('directeurs')
                                              }}
                                            >
                                              Relancer le directeur
                                            </Button>
                                          </Box>
                                        </Tooltip>
                                      </Table.Td>
                                    </Table.Tr>

                                    {/* Detail par formation du departement : remplace
                                        l'ancienne « Matrice de conformite », rattache a
                                        la ligne sur laquelle la RH travaille deja. */}
                                    {deplie && (
                                      <Table.Tr>
                                        <Table.Td colSpan={9} style={{ padding: 0 }}>
                                          <Box p="md" bg="var(--mantine-color-gray-light)">
                                            {(() => {
                                              const detail = detailParFormationDuDepartement(row.departement)
                                              if (detail.length === 0) {
                                                return (
                                                  <Text size="sm" c="dimmed" ta="center" py="sm">
                                                    Aucune formation dans le perimetre selectionne.
                                                  </Text>
                                                )
                                              }
                                              // Chaque formation couvre TOUTE la population
                                              // cible (formes + non formes) : l'effectif
                                              // rattache doit donc etre identique d'une ligne
                                              // a l'autre et egal au total du departement.
                                              // Un ecart signale un rattachement incomplet
                                              // (hierarchie des departements non chargee).
                                              const effectifRattache = detail[0].total
                                              return (
                                                <Stack gap="xs">
                                                  <Text size="xs" c="dimmed">
                                                    Detail de <strong>{row.departement}</strong> formation par
                                                    formation. Le taux ci-dessous est un{' '}
                                                    <strong>taux par formation</strong> (a suivi CETTE formation) :
                                                    il differe du taux de conformite de la ligne, qui exige
                                                    TOUTES les formations du perimetre.
                                                  </Text>
                                                  {effectifRattache !== row.totalCollaborateurs && (
                                                    <Alert
                                                      color="orange"
                                                      variant="light"
                                                      icon={<Warning size={16} weight="bold" />}
                                                    >
                                                      <Text size="xs">
                                                        Rattachement partiel : {effectifRattache} collaborateur(s)
                                                        identifie(s) ici sur {row.totalCollaborateurs} comptes dans
                                                        la ligne. Le detail ci-dessous peut etre incomplet
                                                        (hierarchie des departements non chargee) ; les compteurs
                                                        de la ligne restent la reference.
                                                      </Text>
                                                    </Alert>
                                                  )}
                                                  <Table withTableBorder highlightOnHover>
                                                    <Table.Thead>
                                                      <Table.Tr>
                                                        <Table.Th style={{ minWidth: 200 }}>Formation</Table.Th>
                                                        <Table.Th style={{ textAlign: 'center' }}>Formes</Table.Th>
                                                        <Table.Th style={{ textAlign: 'center' }}>A former</Table.Th>
                                                        <Table.Th style={{ minWidth: 150 }}>
                                                          Taux par formation
                                                        </Table.Th>
                                                        <Table.Th style={{ minWidth: 170 }}>Actions</Table.Th>
                                                      </Table.Tr>
                                                    </Table.Thead>
                                                    <Table.Tbody>
                                                      {detail.map((ligne) => {
                                                        const couleurLigne = getCoverageColor(ligne.taux)
                                                        return (
                                                          <Table.Tr key={ligne.formation.id}>
                                                            <Table.Td>
                                                              <Stack gap={2}>
                                                                <Text size="sm" fw={500}>
                                                                  {ligne.formation.nomFormation}
                                                                </Text>
                                                                <Text size="xs" c="dimmed">
                                                                  {ligne.formation.codeFormation}
                                                                </Text>
                                                              </Stack>
                                                            </Table.Td>
                                                            <Table.Td style={{ textAlign: 'center' }}>
                                                              <Text size="sm" c="green" fw={600}>
                                                                {ligne.formes}
                                                              </Text>
                                                            </Table.Td>
                                                            <Table.Td style={{ textAlign: 'center' }}>
                                                              <Text size="sm" c="red" fw={600}>
                                                                {ligne.nonFormes}
                                                              </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                              {ligne.total === 0 ? (
                                                                <Text size="xs" c="dimmed">
                                                                  Aucun collaborateur
                                                                </Text>
                                                              ) : (
                                                                <Group gap="xs" wrap="nowrap">
                                                                  <Progress
                                                                    value={ligne.taux}
                                                                    color={couleurLigne}
                                                                    size="sm"
                                                                    radius="md"
                                                                    style={{ flex: 1, minWidth: 60 }}
                                                                  />
                                                                  <Text
                                                                    size="sm"
                                                                    fw={700}
                                                                    c={couleurLigne === 'yellow' ? 'yellow.7' : couleurLigne}
                                                                  >
                                                                    {ligne.taux}%
                                                                  </Text>
                                                                </Group>
                                                              )}
                                                            </Table.Td>
                                                            <Table.Td>
                                                              <Button
                                                                variant="subtle"
                                                                size="xs"
                                                                leftSection={<Eye size={14} weight="bold" />}
                                                                disabled={ligne.total === 0}
                                                                onClick={() =>
                                                                  openFormationDetail(ligne.formation, row.departement)
                                                                }
                                                              >
                                                                Voir les non formes
                                                              </Button>
                                                            </Table.Td>
                                                          </Table.Tr>
                                                        )
                                                      })}
                                                    </Table.Tbody>
                                                  </Table>
                                                </Stack>
                                              )
                                            })()}
                                          </Box>
                                        </Table.Td>
                                      </Table.Tr>
                                    )}
                                    </Fragment>
                                  )
                                })}
                              </Table.Tbody>
                            </Table>
                          </Table.ScrollContainer>
                        </>
                      )}
                    </Stack>
                  </motion.div>
                )}

                {/* ---------- ONGLET PAR EQUIPE ---------- */}
                {orgView === 'equipe' && (
                  <motion.div
                    key="org-equipe"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Stack gap="md">
                      {byManagerLoading ? (
                        <Center py="xl"><Loader size="sm" /></Center>
                      ) : !byManagerData ? (
                        selectedFormationIds.length === 0 ? (
                          <Text size="sm" c="dimmed" ta="center" py="md">
                            Aucune formation selectionnee dans le scope ci-dessus.
                          </Text>
                        ) : (
                          <Alert color="red" variant="light" icon={<WarningCircle size={18} weight="bold" />}>
                            Impossible de charger la repartition par equipe. Reessayez en changeant
                            de periode ou rechargez la page.
                          </Alert>
                        )
                      ) : (
                        <>
                          {managerRows.length === 0 ? (
                            <Text size="sm" c="dimmed" ta="center" py="md">
                              Aucun manager avec des collaborateurs non formes sur cette periode.
                            </Text>
                          ) : (
                            <>
                              <Group justify="space-between">
                                <Checkbox
                                  size="xs"
                                  label="Tout selectionner"
                                  checked={
                                    managerRows.length > 0 &&
                                    effectiveManagerIds.length === managerRows.length
                                  }
                                  indeterminate={
                                    effectiveManagerIds.length > 0 &&
                                    effectiveManagerIds.length < managerRows.length
                                  }
                                  onChange={toggleSelectAllManagerRows}
                                />
                                <Button
                                  size="sm"
                                  leftSection={<EnvelopeSimple size={18} weight="bold" />}
                                  disabled={effectiveManagerIds.length === 0 || !emailConfigured}
                                  onClick={() => openReminderModal('managers')}
                                >
                                  Relancer les managers selectionnes ({effectiveManagerIds.length})
                                </Button>
                              </Group>

                              <Table.ScrollContainer minWidth={700}>
                                <Table striped highlightOnHover withTableBorder>
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th style={{ width: 40 }}></Table.Th>
                                      <Table.Th style={{ minWidth: 180 }}>Manager</Table.Th>
                                      <Table.Th style={{ minWidth: 160 }}>Departement</Table.Th>
                                      <Table.Th style={{ textAlign: 'center' }}>Non formes</Table.Th>
                                      <Table.Th style={{ minWidth: 220 }}>Actions</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {managerRows.map((row) => (
                                      <Table.Tr key={row.id}>
                                        <Table.Td>
                                          <Checkbox
                                            size="xs"
                                            checked={effectiveManagerIds.includes(row.id)}
                                            onChange={() => toggleManager(row.id)}
                                          />
                                        </Table.Td>
                                        <Table.Td>
                                          <Text size="sm" fw={600}>{row.nomComplet}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                          <Text size="sm" c="dimmed">{row.departement}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                          <Badge
                                            variant="light"
                                            color={row.collaborateursNonFormes.length > 0 ? 'red' : 'green'}
                                            size="sm"
                                          >
                                            {row.collaborateursNonFormes.length}
                                          </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                          <Group gap="xs" wrap="nowrap">
                                            <Button
                                              variant="subtle"
                                              size="xs"
                                              leftSection={<Eye size={14} weight="bold" />}
                                              disabled={row.collaborateursNonFormes.length === 0}
                                              onClick={() => setManagerDetail(row)}
                                            >
                                              Details
                                            </Button>
                                            <Tooltip
                                              label={
                                                emailConfigured
                                                  ? `Relancer ${row.nomComplet}`
                                                  : "L'envoi d'emails n'est pas configure"
                                              }
                                            >
                                              <Box>
                                                <Button
                                                  variant="light"
                                                  size="xs"
                                                  leftSection={<EnvelopeSimple size={14} weight="bold" />}
                                                  disabled={!emailConfigured}
                                                  onClick={() => {
                                                    setSelectedManagers([row.id])
                                                    openReminderModal('managers')
                                                  }}
                                                >
                                                  Relancer le manager
                                                </Button>
                                              </Box>
                                            </Tooltip>
                                          </Group>
                                        </Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Table.ScrollContainer>
                            </>
                          )}

                          {/* Collaborateurs non formés sans manager identifié */}
                          {sansManagerRows.length > 0 && (
                            <Alert
                              color="orange"
                              variant="light"
                              icon={<Warning size={18} weight="bold" />}
                              title={`${sansManagerRows.length} collaborateur(s) non forme(s) sans manager identifie`}
                            >
                              <Stack gap="xs">
                                <Text size="sm">
                                  Ces collaborateurs ne sont pas rattaches a un manager : ils ne
                                  peuvent etre relances que via le <strong>directeur de leur
                                  departement</strong> (onglet « Par departement »).
                                </Text>
                                <Accordion variant="contained">
                                  <Accordion.Item value="sans-manager">
                                    <Accordion.Control>
                                      <Text size="sm">Voir le detail</Text>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                      <Box style={{ maxHeight: 260, overflowY: 'auto' }}>
                                        <Stack gap="xs">
                                          {sansManagerRows.map((collab) => (
                                            <Paper key={collab.id} withBorder p="sm" radius="md">
                                              <Group justify="space-between" align="flex-start">
                                                <Stack gap={2}>
                                                  <Text size="sm" fw={500}>{collab.nomComplet}</Text>
                                                  <Text size="xs" c="dimmed">
                                                    {collab.departement || 'Departement non defini'}
                                                  </Text>
                                                </Stack>
                                                <Group gap={4} justify="flex-end" style={{ maxWidth: '60%' }}>
                                                  {(collab.formationsManquantes ?? []).map((f) => (
                                                    <Badge key={f.id} size="xs" variant="light" color="red">
                                                      {f.nomFormation}
                                                    </Badge>
                                                  ))}
                                                </Group>
                                              </Group>
                                            </Paper>
                                          ))}
                                        </Stack>
                                      </Box>
                                    </Accordion.Panel>
                                  </Accordion.Item>
                                </Accordion>
                              </Stack>
                            </Alert>
                          )}
                        </>
                      )}
                    </Stack>
                  </motion.div>
                )}
              </AnimatePresence>
            </Stack>
          </Card>
        </motion.div>

        {/* ===== MANAGER DETAIL MODAL (vue par equipe) ===== */}
        <Modal
          opened={!!managerDetail}
          onClose={() => setManagerDetail(null)}
          title={
            managerDetail && (
              <Stack gap={2}>
                <Title order={4}>{managerDetail.nomComplet}</Title>
                <Text size="xs" c="dimmed">
                  {managerDetail.departement} — {managerDetail.collaborateursNonFormes.length} collaborateur(s) non forme(s)
                </Text>
              </Stack>
            )
          }
          size="lg"
          centered
        >
          {managerDetail && (
            managerDetail.collaborateursNonFormes.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <ThemeIcon variant="light" color="green" size={56} radius="xl">
                    <CheckCircle size={32} weight="duotone" />
                  </ThemeIcon>
                  <Text fw={600}>Toute l&apos;equipe est formee !</Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap="xs" style={{ maxHeight: 420, overflowY: 'auto' }}>
                {managerDetail.collaborateursNonFormes.map((collab) => (
                  <Paper key={collab.id} withBorder p="sm" radius="md">
                    <Stack gap={6}>
                      <Text size="sm" fw={500}>{collab.nomComplet}</Text>
                      <Group gap={4}>
                        {(collab.formationsManquantes ?? []).length === 0 ? (
                          <Text size="xs" c="dimmed">Aucune formation manquante detaillee</Text>
                        ) : (
                          collab.formationsManquantes.map((f) => (
                            <Badge key={f.id} size="xs" variant="light" color="red">
                              {f.nomFormation}
                            </Badge>
                          ))
                        )}
                      </Group>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )
          )}
        </Modal>

        {/* ===== REMINDER MODAL ===== */}
        <Modal
          opened={showReminderModal}
          onClose={() => !sendingReminders && setShowReminderModal(false)}
          title={
            reminderTarget === 'directeurs'
              ? 'Envoyer des rappels aux directeurs'
              : 'Envoyer des rappels aux managers'
          }
          size="lg"
          centered
          closeOnClickOutside={!sendingReminders}
          closeOnEscape={!sendingReminders}
        >
          <Stack>
            <Alert color="blue" icon={<Info size={20} weight="bold" />} variant="light">
              Les rappels seront envoyes par email aux {reminderRoleLabel}s selectionnes.
              Assurez-vous que la configuration SMTP est en place.
            </Alert>

            <Text fw={500}>
              Vous allez envoyer un rappel a {reminderRecipients.length} {reminderRoleLabel}(s)
            </Text>

            {/* Message preview */}
            <Paper withBorder p="md">
              <Text size="sm" fw={600} c="dimmed" mb="xs">Apercu du message :</Text>
              <Divider my="xs" />
              {reminderTarget === 'directeurs' ? (
                <Text size="sm" style={{ lineHeight: 1.6 }}>
                  Bonjour [Nom du directeur],<br /><br />
                  Certains collaborateurs de votre departement n'ont pas encore complete
                  les {libellePerimetre} suivantes :<br />
                  - [Liste des formations par collaborateur]<br /><br />
                  Merci de vous assurer, avec les managers concernes, qu'ils completent
                  ces formations dans les meilleurs delais.<br /><br />
                  Cordialement,<br />
                  L'equipe Formation
                </Text>
              ) : (
                <Text size="sm" style={{ lineHeight: 1.6 }}>
                  Bonjour [Nom du manager],<br /><br />
                  Certains membres de votre equipe n'ont pas encore complete
                  les {libellePerimetre} suivantes :<br />
                  - [Liste des formations par collaborateur]<br /><br />
                  Merci de vous assurer qu'ils completent ces formations
                  dans les meilleurs delais.<br /><br />
                  Cordialement,<br />
                  L'equipe Formation
                </Text>
              )}
            </Paper>

            {/* Recipients list */}
            <Accordion>
              <Accordion.Item value="recipients">
                <Accordion.Control>
                  <Text size="sm">Voir les {reminderRecipients.length} destinataires</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Box style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {reminderRecipients.length === 0 ? (
                      <Text size="sm" c="dimmed" py="xs">Aucun destinataire selectionne</Text>
                    ) : (
                      reminderRecipients.map(r => (
                        <Group key={r.key} justify="space-between" py="xs">
                          <Stack gap={0}>
                            <Text size="sm">{r.nom}</Text>
                            {r.sousTitre && <Text size="xs" c="dimmed">{r.sousTitre}</Text>}
                          </Stack>
                          <Badge size="sm">{r.count} a former</Badge>
                        </Group>
                      ))
                    )}
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
                  disabled={reminderRecipients.length === 0}
                >
                  Envoyer les rappels
                </Button>
              </Group>
            </Group>
          </Stack>
        </Modal>

        {/* ===== FORMATION DETAIL MODAL =====
            Modale nominative UNIQUE de la page : elle sert au tableau « Detail
            par formation » (toute la population) comme au depliage d'un
            departement (`selectedFormationDept` renseigne). */}
        <Modal
          opened={!!selectedFormation}
          onClose={closeFormationDetail}
          title={
            selectedFormation && (
              <Stack gap={2}>
                <Title order={4}>{selectedFormation.nomFormation}</Title>
                <Text size="xs" c="dimmed">
                  {selectedFormation.codeFormation} - {selectedFormation.categorie}
                </Text>
                {selectedFormationDept && (
                  <Badge variant="light" color="grape" size="sm">
                    {selectedFormationDept}
                  </Badge>
                )}
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
                  Non formes ({formationModalNonFormes.length})
                </Tabs.Tab>
                <Tabs.Tab
                  value="formes"
                  leftSection={<CheckCircle size={16} weight="bold" />}
                >
                  Formes ({formationModalFormes.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="nonFormes" pt="md">
                {formationModalNonFormes.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="sm">
                      <ThemeIcon variant="light" color="green" size={56} radius="xl">
                        <CheckCircle size={32} weight="duotone" />
                      </ThemeIcon>
                      <Text size="lg" fw={600}>Tous les collaborateurs sont formes !</Text>
                      <Text size="sm" c="dimmed">
                        Aucun collaborateur {selectedFormationDept ? 'de ce departement ' : ''}
                        n'est en attente de cette formation.
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="xs" style={{ maxHeight: 420, overflowY: 'auto' }}>
                    {formationModalNonFormes.map((collab) => (
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
                {formationModalFormes.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="sm">
                      <ThemeIcon variant="light" color="red" size={56} radius="xl">
                        <WarningCircle size={32} weight="duotone" />
                      </ThemeIcon>
                      <Text size="lg" fw={600}>Aucun collaborateur forme</Text>
                      <Text size="sm" c="dimmed">
                        Personne {selectedFormationDept ? 'de ce departement ' : ''}
                        n'a encore suivi cette formation sur la periode.
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="xs" style={{ maxHeight: 420, overflowY: 'auto' }}>
                    {formationModalFormes.map((collab) => (
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
