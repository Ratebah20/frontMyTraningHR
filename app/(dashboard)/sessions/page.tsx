'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  SimpleGrid,
  Center,
  Stack,
  Flex,
  ActionIcon,
  Menu,
  Select,
  MultiSelect,
  TextInput,
  Pagination,
  Loader,
  Alert,
  Box,
  Paper,
  Grid,
  Tooltip,
  Badge,
  Timeline,
  Avatar,
  ThemeIcon,
  Progress,
  Divider,
  Modal,
  Table,
  Checkbox,
  SegmentedControl,
} from '@mantine/core';
// import { DatePickerInput } from '@mantine/dates'; // Module non installé
import { notifications } from '@mantine/notifications';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr/FunnelSimple';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Certificate } from '@phosphor-icons/react/dist/ssr/Certificate';
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck';
import { CalendarX } from '@phosphor-icons/react/dist/ssr/CalendarX';
import { UserCheck } from '@phosphor-icons/react/dist/ssr/UserCheck';
import { Building } from '@phosphor-icons/react/dist/ssr/Building';
import { Hourglass } from '@phosphor-icons/react/dist/ssr/Hourglass';
import { List } from '@phosphor-icons/react/dist/ssr/List';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { SortAscending } from '@phosphor-icons/react/dist/ssr/SortAscending';
import { SortDescending } from '@phosphor-icons/react/dist/ssr/SortDescending';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { useRouter, useSearchParams } from 'next/navigation';
import { sessionsService, formationsService, collaborateursService } from '@/lib/services';
import { SessionsUnifiedService } from '@/lib/services/sessions-unified.service';
import { evaluationsService } from '@/lib/services/evaluations.service';
import { getQuestionnaires } from '@/lib/services/questionnaires.service';
import { StatutUtils } from '@/lib/utils/statut.utils';
import { formatDuration } from '@/lib/utils/duration.utils';
import {
  SessionFormationResponse,
  SessionFilters,
  GroupedSession,
  UnifiedSession,
  Questionnaire,
  EvaluationMoment,
  PreviewGroupEvaluationsResponse,
} from '@/lib/types';
import { useDebounce } from '@/hooks/useApi';
import { SessionTypeBadge } from '@/components/sessions/SessionTypeBadge';



// Couleurs par statut
const statusColors: Record<string, string> = {
  'inscrit': 'blue',
  'INSCRIT': 'blue',
  'en_cours': 'yellow',
  'EN_COURS': 'yellow',
  'complete': 'green',
  'TERMINE': 'green',
  'COMPLETE': 'green',
  'Terminé': 'green',
  'terminé': 'green',
  'annule': 'red',
  'ANNULE': 'red',
  'Annulé': 'red',
  'annulé': 'red',
};

// Labels des statuts
const statusLabels: Record<string, string> = {
  'inscrit': 'Inscrit',
  'INSCRIT': 'Inscrit',
  'en_cours': 'En cours',
  'EN_COURS': 'En cours',
  'complete': 'Terminé',
  'TERMINE': 'Terminé',
  'COMPLETE': 'Terminé',
  'Terminé': 'Terminé',
  'terminé': 'Terminé',
  'annule': 'Annulé',
  'ANNULE': 'Annulé',
  'Annulé': 'Annulé',
  'annulé': 'Annulé',
};

/**
 * Une borne de période d'enregistrement n'est acceptée qu'au format
 * `YYYY-MM-DD` (celui produit par le tableau de bord). Toute autre valeur est
 * ignorée silencieusement plutôt que transmise telle quelle au backend.
 */
const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

const lireBorneJour = (valeur: string | null): string =>
  valeur && FORMAT_JOUR.test(valeur) ? valeur : '';

/** `2026-03-31` -> `31/03/2026` (affichage bannière) */
const formaterJour = (valeur: string): string => {
  const date = new Date(`${valeur}T00:00:00`);
  return isNaN(date.getTime()) ? valeur : date.toLocaleDateString('fr-FR');
};

// Icônes par statut
const statusIcons: Record<string, any> = {
  'inscrit': CalendarCheck,
  'INSCRIT': CalendarCheck,
  'en_cours': Hourglass,
  'EN_COURS': Hourglass,
  'complete': Certificate,
  'TERMINE': Certificate,
  'COMPLETE': Certificate,
  'Terminé': Certificate,
  'terminé': Certificate,
  'annule': CalendarX,
  'ANNULE': CalendarX,
  'Annulé': CalendarX,
  'annulé': CalendarX,
};

export default function SessionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // États
  const [sessions, setSessions] = useState<any[]>([]); // Can be GroupedSession[] or UnifiedSession[]
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    // Récupérer le mode de vue depuis localStorage au chargement
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessions-view-mode');
      return saved === 'list' ? 'list' : 'cards';
    }
    return 'cards';
  });

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map(s =>
        s.type === 'collective' ? `collective-${s.id}` : `grouped-${s.groupKey}`
      )));
    }
  };

  const getSelectedSessionIds = (): number[] => {
    const ids: number[] = [];
    sessions.forEach(session => {
      const key = session.type === 'collective' ? `collective-${session.id}` : `grouped-${session.groupKey}`;
      if (selectedIds.has(key)) {
        if (session.type === 'collective') {
          ids.push(session.id);
        } else if (session.participants) {
          session.participants.forEach((p: any) => {
            if (p.sessionId) ids.push(p.sessionId);
          });
        }
      }
    });
    return ids;
  };

  const handleBatchDelete = async () => {
    const ids = getSelectedSessionIds();
    if (ids.length === 0) return;

    setIsBatchDeleting(true);
    try {
      const result = await sessionsService.batchDelete(ids);
      notifications.show({
        title: 'Suppression en lot',
        message: result.message,
        color: 'green',
        icon: <CheckCircle size={16} />,
      });
      setSelectedIds(new Set());
      setBatchDeleteModalOpen(false);
      loadSessions();
      loadGlobalStats();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la suppression en lot',
        color: 'red',
        icon: <Warning size={16} />,
      });
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // ---- Demander une évaluation sur un GROUPE de sessions individuelles ----
  //
  // ⚠️ Les DTO de sessions groupées FABRIQUENT des adresses email
  // (`nom@company.com`, « Généré car chiffré » côté backend). On ne s'en sert
  // JAMAIS pour dire qui recevra un mail : la seule vérité est la
  // prévisualisation renvoyée par le backend, qui lit les vraies colonnes.
  const [evalGroup, setEvalGroup] = useState<any | null>(null);
  const [evalType, setEvalType] = useState<EvaluationMoment>('chaud');
  const [evalTemplates, setEvalTemplates] = useState<Questionnaire[]>([]);
  const [evalTemplatesLoading, setEvalTemplatesLoading] = useState(false);
  const [evalQuestionnaireId, setEvalQuestionnaireId] = useState<string | null>(null);
  const [evalPreview, setEvalPreview] = useState<PreviewGroupEvaluationsResponse | null>(null);
  const [evalPreviewLoading, setEvalPreviewLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [isSendingEval, setIsSendingEval] = useState(false);

  const openEvaluationModal = (session: any) => {
    setEvalGroup(session);
    setEvalType('chaud');
    setEvalQuestionnaireId(null);
    setEvalPreview(null);
    setEvalError(null);
    setIsSendingEval(false);
  };

  const closeEvaluationModal = () => {
    if (isSendingEval) return;
    setEvalGroup(null);
    setEvalPreview(null);
    setEvalError(null);
  };

  // Prévisualisation (lecture seule) : rejouée à chaque changement de type
  useEffect(() => {
    const groupKey = evalGroup?.groupKey;
    if (!groupKey) return;

    let annule = false;
    setEvalPreviewLoading(true);
    setEvalError(null);
    setEvalPreview(null);

    evaluationsService
      .previewGroupEvaluations(groupKey, evalType)
      .then((preview) => {
        if (!annule) setEvalPreview(preview);
      })
      .catch((err: any) => {
        if (annule) return;
        const message = err.response?.data?.message || err.message;
        setEvalError(
          Array.isArray(message)
            ? message.join(' — ')
            : message || 'Impossible de prévisualiser cet envoi',
        );
      })
      .finally(() => {
        if (!annule) setEvalPreviewLoading(false);
      });

    return () => {
      annule = true;
    };
  }, [evalGroup, evalType]);

  // Questionnaires actifs du type sélectionné (même règle que /sessions/new)
  useEffect(() => {
    if (!evalGroup) return;

    let annule = false;
    setEvalQuestionnaireId(null);
    setEvalTemplatesLoading(true);

    getQuestionnaires({ type: evalType })
      .then((list) => {
        if (!annule) setEvalTemplates((list || []).filter((q) => q.actif));
      })
      .catch(() => {
        if (!annule) setEvalTemplates([]);
      })
      .finally(() => {
        if (!annule) setEvalTemplatesLoading(false);
      });

    return () => {
      annule = true;
    };
  }, [evalGroup, evalType]);

  const handleSendGroupEvaluations = async () => {
    if (!evalGroup?.groupKey || !evalQuestionnaireId) return;

    setIsSendingEval(true);
    try {
      const result = await evaluationsService.sendGroupEvaluations({
        groupKey: evalGroup.groupKey,
        evaluationType: evalType,
        questionnaireTemplateId: parseInt(evalQuestionnaireId, 10),
      });

      const details = [
        `${result.envoyes} envoyée(s)`,
        result.dejaEnvoyees > 0 ? `${result.dejaEnvoyees} déjà envoyée(s)` : null,
        result.sansEmail > 0 ? `${result.sansEmail} sans adresse email` : null,
        result.erreurs > 0 ? `${result.erreurs} en erreur` : null,
      ]
        .filter(Boolean)
        .join(' • ');

      notifications.show({
        title:
          result.envoyes > 0
            ? 'Demande d\'évaluation envoyée'
            : 'Aucun nouvel envoi',
        message: `${result.totalParticipants} participant(s) sur ${result.totalSessions} session(s) — ${details}`,
        color: result.erreurs > 0 ? 'orange' : result.envoyes > 0 ? 'green' : 'blue',
        icon: result.erreurs > 0 ? <Warning size={16} /> : <CheckCircle size={16} />,
        autoClose: 8000,
      });

      setEvalGroup(null);
      setEvalPreview(null);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      notifications.show({
        title: 'Erreur lors de l\'envoi',
        message: Array.isArray(message)
          ? message.join(' — ')
          : message || 'Les évaluations n\'ont pas pu être envoyées',
        color: 'red',
        icon: <Warning size={16} />,
      });
    } finally {
      setIsSendingEval(false);
    }
  };

  // Statistiques globales
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    inscrites: 0,
    enCours: 0,
    terminees: 0,
    sessionsGroupees: 0,
  });

  // Filtres et pagination - lecture depuis l'URL (source unique de vérité)
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const typeFilter = searchParams.get('type') || '';
  const dateDebut = searchParams.get('dateDebut') || '';
  const dateFin = searchParams.get('dateFin') || '';
  // Période d'ENREGISTREMENT (date d'import pour les sessions individuelles,
  // date de création pour les collectives). À ne pas confondre avec les dates
  // de session ci-dessus : le tableau de bord compte les « nouvelles
  // inscriptions » sur cette date-là, d'où ces paramètres dédiés.
  const dateImportDebut = lireBorneJour(searchParams.get('dateImportDebut'));
  const dateImportFin = lireBorneJour(searchParams.get('dateImportFin'));
  const formationFilter = searchParams.get('formation') || '';
  const departmentFilter = searchParams.get('department') || '';
  const organismeFilter = searchParams.get('organisme') || '';
  // Filtre « informations manquantes » : CSV dans l'URL, tableau dans l'UI.
  const missingFieldsParam = searchParams.get('missingFields') || '';
  const missingFieldsFilter = missingFieldsParam ? missingFieldsParam.split(',') : [];
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'dateDebut';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  // Fonction pour mettre à jour l'URL avec les nouveaux paramètres.
  //
  // On repart de window.location.search et NON de searchParams : le hook
  // useSearchParams n'est rafraîchi qu'à la fin de la navigation App Router.
  // Deux mises à jour rapprochées (typique : la recherche debouncée qui tombe
  // pendant qu'on choisit un statut) partaient donc toutes deux d'un état
  // périmé, et la seconde effaçait le filtre posé par la première.
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : searchParams.toString()
    );

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || (key === 'page' && value === '1')) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Réinitialiser la page à 1 si on change un filtre (sauf si on change la page elle-même)
    if (!('page' in updates) && params.get('page')) {
      params.delete('page');
    }

    const newUrl = params.toString() ? `/sessions?${params.toString()}` : '/sessions';
    router.push(newUrl, { scroll: false });
  };

  // Setters pour les filtres (mettent à jour l'URL)
  const setSearch = (value: string) => updateUrlParams({ search: value });
  const setStatusFilter = (value: string) => updateUrlParams({ status: value });
  const setTypeFilter = (value: string) => updateUrlParams({ type: value });
  const setDateDebut = (value: string) => updateUrlParams({ dateDebut: value });
  const setDateFin = (value: string) => updateUrlParams({ dateFin: value });
  const setFormationFilter = (value: string) => updateUrlParams({ formation: value });
  const setDepartmentFilter = (value: string) => updateUrlParams({ department: value });
  const setOrganismeFilter = (value: string) => updateUrlParams({ organisme: value });
  const setMissingFieldsFilter = (values: string[]) =>
    updateUrlParams({ missingFields: values.length > 0 ? values.join(',') : null });
  const setSortBy = (value: string) => updateUrlParams({ sortBy: value });
  const setSortOrder = (value: 'asc' | 'desc') => updateUrlParams({ sortOrder: value });

  // Liste des organismes pour le filtre
  const [organismes, setOrganismes] = useState<{ value: string; label: string }[]>([]);
  const [loadingOrganismes, setLoadingOrganismes] = useState(false);

  // Debounce pour la recherche - état local temporaire
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearchInput = useDebounce(searchInput, 500);

  // Dernière valeur de recherche que NOUS avons poussée dans l'URL.
  //
  // Sans cette référence, la frappe et l'URL se renvoyaient la balle : la
  // navigation App Router étant asynchrone, l'URL arrivait avec du retard et
  // réécrivait le champ avec une valeur déjà périmée (« Dup » alors que la RH
  // avait fini de taper « Dupont »). Pire, l'input revenait alors exactement à
  // la valeur de l'URL : la comparaison du debounce suivant ne voyait plus de
  // différence et PLUS AUCUNE requête n'était relancée — la liste restait
  // figée. On ne resynchronise donc le champ que si le changement d'URL vient
  // réellement de l'extérieur (arrivée sur la page, retour navigateur, lien
  // entrant avec ?search=), pas quand l'URL ne fait que refléter notre push.
  const lastPushedSearchRef = useRef(search);

  // Synchroniser le debounced search avec l'URL
  useEffect(() => {
    if (debouncedSearchInput !== lastPushedSearchRef.current) {
      // Mémorisé AVANT la navigation : elle est asynchrone, l'effet de
      // resynchronisation ci-dessous se déclenchera bien après.
      lastPushedSearchRef.current = debouncedSearchInput;
      setSearch(debouncedSearchInput);
    }
  }, [debouncedSearchInput]);

  // Synchroniser l'input avec l'URL quand le changement vient de l'extérieur
  useEffect(() => {
    // L'URL ne fait que refléter notre propre push : ne pas toucher au champ,
    // l'utilisateur a peut-être continué à taper entre-temps.
    if (search === lastPushedSearchRef.current) return;

    // Changement externe : on aligne le champ ET la référence, sinon le
    // prochain debounce repousserait inutilement la même valeur.
    lastPushedSearchRef.current = search;
    setSearchInput(search);
  }, [search]);

  // Charger les statistiques globales
  const loadGlobalStats = async () => {
    try {
      const stats = await sessionsService.getGlobalStats();

      // Récupérer le nombre de sessions groupées (groupes de 2+ sessions)
      const groupedCount = await sessionsService.getGroupedSessionsCount();

      setGlobalStats({
        total: stats.total,
        inscrites: stats.inscrites,
        enCours: stats.enCours,
        terminees: stats.terminees,
        sessionsGroupees: groupedCount.count,
      });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  // Charger les organismes pour le filtre
  const loadOrganismes = async () => {
    setLoadingOrganismes(true);
    try {
      const response = await sessionsService.getOrganismes();
      const organismesData = response.map((org: any) => ({
        value: org.id.toString(),
        label: org.nomOrganisme,
      }));
      setOrganismes(organismesData);
    } catch (err) {
      console.error('Erreur lors du chargement des organismes:', err);
    } finally {
      setLoadingOrganismes(false);
    }
  };

  // Jeton de requête : chaque appel incrémente le compteur et ne publie son
  // résultat que s'il est toujours le plus récent. Sans ça, deux changements
  // de filtre rapprochés lancent deux requêtes et la plus lente écrase la plus
  // récente : la liste affichée ne correspond plus aux filtres actifs.
  const requestIdRef = useRef(0);

  // Charger les sessions
  const loadSessions = async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      // Les deux champs de date decrivent une PERIODE, et le backend filtre par
      // chevauchement. Avec une seule borne, la periode restait ouverte de
      // l'autre cote : « date debut = 7 juin » renvoyait TOUTES les sessions non
      // terminees au 7 juin, et le tri par date decroissante remontait les plus
      // recentes en tete. La liste semblait ignorer le filtre alors que les
      // sessions du 7 juin etaient reléguées en derniere page.
      // Une seule date saisie vaut donc desormais « les sessions de ce jour ».
      const periodeDebut = dateDebut || dateFin || undefined;
      const periodeFin = dateFin || dateDebut || undefined;

      const filters: any = {
        search: search,
        statut: statusFilter || undefined,
        type: typeFilter || 'all', // 'individuelle', 'collective', or 'all'
        dateDebut: periodeDebut,
        dateFin: periodeFin,
        // Période d'enregistrement : transmise telle quelle, sans le
        // « miroir » appliqué ci-dessus aux dates de session. Les deux services
        // (individuelles et collectives) relaient ces clés au backend.
        dateImportDebut: dateImportDebut || undefined,
        dateImportFin: dateImportFin || undefined,
        formationId: formationFilter ? parseInt(formationFilter) : undefined,
        departementId: departmentFilter ? parseInt(departmentFilter) : undefined,
        organismeId: organismeFilter ? parseInt(organismeFilter) : undefined,
        missingFields: missingFieldsParam || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      };

      // Toujours passer par le service unifié, y compris pour les sessions
      // individuelles seules : l'appel direct à getGroupedSessions renvoyait des
      // objets NON normalisés (organisme en string, champ `type` absent), ce qui
      // vidait la colonne Organisme et faisait disparaître le badge de type.
      const response = await SessionsUnifiedService.findAll(filters);

      // Une réponse plus ancienne ne doit jamais écraser une plus récente
      if (requestId !== requestIdRef.current) return;

      // Le backend retourne toujours un objet avec data et meta
      if (response && response.data) {
        setSessions(response.data);
        setTotal(response.meta?.totalItems || 0);
        setTotalPages(response.meta?.totalPages || 1);
      } else {
        setSessions([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      console.error('Erreur lors du chargement des sessions:', err);
      setError(err.message || 'Erreur lors du chargement des sessions');
      setSessions([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Sauvegarder le mode de vue dans localStorage
  useEffect(() => {
    localStorage.setItem('sessions-view-mode', viewMode);
  }, [viewMode]);

  // Fonction pour changer de page
  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage.toString() });
  };

  // Charger les données au montage
  useEffect(() => {
    loadGlobalStats();
    loadOrganismes();
  }, []);

  // Charger les sessions au montage et quand les filtres changent
  useEffect(() => {
    loadSessions();
    // La sélection porte sur des lignes qui viennent de disparaître : on la vide
    // à chaque changement de filtre ou de page.
    setSelectedIds(new Set());
  }, [search, statusFilter, typeFilter, dateDebut, dateFin, dateImportDebut, dateImportFin, formationFilter, departmentFilter, organismeFilter, missingFieldsParam, page, sortBy, sortOrder]);

  const handleViewDetails = (session: any) => {
    // Validation: vérifier que les champs nécessaires existent
    if (!session) {
      console.error('Session invalide:', session);
      return;
    }

    // Si c'est une session collective, utiliser l'ID avec le paramètre type
    if (session.type === 'collective') {
      if (!session.id || session.id <= 0) {
        console.error('ID de session collective invalide:', session.id);
        return;
      }
      router.push(`/sessions/${session.id}?type=collective`);
    } else {
      // Session individuelle
      // Si c'est une session solo (un seul participant), aller directement à la page détail
      if (session.stats?.total === 1 && session.participants?.[0]?.sessionId) {
        router.push(`/sessions/${session.participants[0].sessionId}`);
      } else if (session.groupKey) {
        // Sinon, c'est une session groupée avec plusieurs participants
        router.push(`/sessions/grouped/${encodeURIComponent(session.groupKey)}`);
      } else {
        console.error('GroupKey manquant pour session individuelle:', session);
      }
    }
  };

  const handleViewFormation = (formationId: number) => {
    router.push(`/formations/${formationId}`);
  };

  const handleEditSession = (session: any) => {
    // Gérer les sessions collectives
    if (session.type === 'collective') {
      router.push(`/sessions/${session.id}/edit?type=collective`);
      return;
    }

    // Gérer les sessions individuelles groupées
    if (session.participants && session.participants.length === 1) {
      // Si une seule session, éditer directement
      const participant = session.participants[0] as GroupedSessionParticipant;
      if (participant.sessionId) {
        router.push(`/sessions/${participant.sessionId}/edit`);
      }
    } else if (session.groupKey) {
      // Sinon, aller à la vue groupée pour choisir quelle session éditer
      router.push(`/sessions/grouped/${encodeURIComponent(session.groupKey)}`);
    }
  };

  const handleRefresh = () => {
    loadSessions();
    loadGlobalStats();
  };

  // Synchroniser les statuts des sessions passées
  const handleSyncPastStatus = async () => {
    setIsSyncing(true);
    try {
      // Appeler les deux endpoints de synchronisation
      const [indivResult, collectResult] = await Promise.all([
        sessionsService.syncPastStatus(),
        sessionsService.syncPastCollectiveStatus(),
      ]);

      const totalUpdated = (indivResult?.updated || 0) + (collectResult?.updated || 0);

      if (totalUpdated > 0) {
        notifications.show({
          title: 'Synchronisation réussie',
          message: `${totalUpdated} session(s) mise(s) à jour en "terminé"`,
          color: 'green',
          icon: <CheckCircle size={16} />,
        });
        // Rafraîchir les données
        loadSessions();
        loadGlobalStats();
      } else {
        notifications.show({
          title: 'Aucune mise à jour',
          message: 'Toutes les sessions passées sont déjà marquées comme terminées',
          color: 'blue',
          icon: <CheckCircle size={16} />,
        });
      }
    } catch (err: any) {
      console.error('Erreur lors de la synchronisation:', err);
      notifications.show({
        title: 'Erreur de synchronisation',
        message: err.message || 'Une erreur est survenue',
        color: 'red',
        icon: <Warning size={16} />,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Fonction pour obtenir le statut dominant d'une session groupée
  const getDominantStatus = (stats: any) => {
    // Si pas de stats (session collective ou autre), retourner un statut par défaut
    if (!stats || !stats.total) {
      return { color: 'blue', label: 'Session active', icon: CalendarCheck };
    }

    if (stats.complete > stats.total / 2) return { color: 'green', label: 'Majoritairement terminé', icon: Certificate };
    if (stats.enCours > 0) return { color: 'yellow', label: 'En cours', icon: Hourglass };
    if (stats.inscrit > 0) return { color: 'blue', label: 'Inscriptions ouvertes', icon: CalendarCheck };
    if (stats.annule === stats.total) return { color: 'red', label: 'Annulée', icon: CalendarX };
    return { color: 'gray', label: 'Non défini', icon: CalendarCheck };
  };

  // L'envoi de groupe ne s'applique qu'aux sessions INDIVIDUELLES groupées :
  // c'est la forme des sessions importées d'OLU, identifiées par leur groupKey.
  const peutDemanderEvaluation = (session: any): boolean =>
    session?.type !== 'collective' && Boolean(session?.groupKey);

  // Fonction pour obtenir le nombre de participants de manière standardisée
  const getParticipantCount = (session: any): number => {
    // Pour les sessions collectives, utiliser nombreParticipants
    if (session.type === 'collective') {
      return session.nombreParticipants ?? 0;
    }
    // Pour les sessions individuelles groupées, utiliser stats.total
    return session.stats?.total ?? 0;
  };

  // Fonction pour formater l'affichage du nombre de participants
  const formatParticipantCount = (session: any): string => {
    const count = getParticipantCount(session);
    return `${count} participant${count > 1 ? 's' : ''}`;
  };

  // Aperçu nominatif des participants.
  // Individuelle : le nom de la personne. Collective : les 2 premiers inscrits
  // (le backend n'en renvoie que 2 pour limiter le coût de déchiffrement).
  // Les deux formes de participants sont structurellement différentes :
  // `p.nom` pour les groupées, `p.collaborateur.nom` pour les collectives.
  const getParticipantsPreview = (session: any): string[] => {
    const participants = session.participants ?? [];
    if (!Array.isArray(participants) || participants.length === 0) return [];

    const source =
      session.type === 'collective'
        ? participants.map((p: any) => p.collaborateur)
        : participants;

    return source
      .slice(0, 2)
      .map((p: any) => `${p?.prenom ?? ''} ${p?.nom ?? ''}`.trim())
      .filter((nom: string) => nom.length > 0);
  };

  // Rend l'aperçu sous forme de texte : "Marie Dupont, Jean Martin +3"
  const formatParticipantsPreview = (session: any): string | null => {
    const noms = getParticipantsPreview(session);
    if (noms.length === 0) return null;

    const total = getParticipantCount(session);
    const reste = total - noms.length;
    return reste > 0 ? `${noms.join(', ')} +${reste}` : noms.join(', ');
  };

  // Période d'enregistrement active (venue du tableau de bord ou d'un lien)
  const aPeriodeImport = Boolean(dateImportDebut || dateImportFin);
  const libellePeriodeImport =
    dateImportDebut && dateImportFin
      ? `du ${formaterJour(dateImportDebut)} au ${formaterJour(dateImportFin)}`
      : dateImportDebut
        ? `à partir du ${formaterJour(dateImportDebut)}`
        : `jusqu'au ${formaterJour(dateImportFin)}`;

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <div>
            <Group align="center" gap="sm">
              <Calendar size={32} color="#228BE6" />
              <Title order={1}>Gestion des Sessions</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Vue d'ensemble de toutes les sessions de formation
            </Text>
          </div>
          <Group>
            <Tooltip label="Basculer l'affichage">
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
              >
                {viewMode === 'cards' ? <List size={20} /> : <CalendarBlank size={20} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Rafraîchir">
              <ActionIcon variant="light" size="lg" onClick={handleRefresh}>
                <ArrowsClockwise size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Mettre à jour automatiquement les sessions passées en 'terminé'">
              <Button
                variant="light"
                color="green"
                leftSection={isSyncing ? <Loader size={16} /> : <CheckCircle size={16} />}
                onClick={handleSyncPastStatus}
                loading={isSyncing}
                size="md"
              >
                Sync. statuts
              </Button>
            </Tooltip>
            {selectedIds.size > 0 && (
              <Button
                variant="light"
                color="red"
                leftSection={<Trash size={16} />}
                onClick={() => setBatchDeleteModalOpen(true)}
                size="md"
              >
                Supprimer ({selectedIds.size})
              </Button>
            )}
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => router.push('/sessions/new')}
              size="md"
            >
              Nouvelle inscription
            </Button>
          </Group>
        </Flex>

        {/* Statistiques globales (de toute la base de données) */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Inscrites
                  </Text>
                  <Text size="xl" fw={700} c="blue">{globalStats.inscrites}</Text>
                  <Text size="xs" c="dimmed">
                    sur {globalStats.total} sessions
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <CalendarCheck size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    En cours
                  </Text>
                  <Text size="xl" fw={700} c="yellow">{globalStats.enCours}</Text>
                  <Text size="xs" c="dimmed">
                    formations actives
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                  <Hourglass size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Terminées
                  </Text>
                  <Text size="xl" fw={700} c="green">{globalStats.terminees}</Text>
                  <Progress 
                    value={(globalStats.terminees / (globalStats.total || 1)) * 100} 
                    size="xs" 
                    radius="xl" 
                    mt={4}
                    color="green"
                  />
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <Certificate size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Groupées
                  </Text>
                  <Text size="xl" fw={700} c="violet">{globalStats.sessionsGroupees}</Text>
                  <Text size="xs" c="dimmed">
                    sessions groupées
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <Users size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Filtres */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group align="center" mb="md">
          <FunnelSimple size={20} />
          <Text fw={600}>Filtres et Recherche</Text>
        </Group>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              placeholder="Rechercher un collaborateur ou une formation..."
              leftSection={<MagnifyingGlass size={16} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              placeholder="Type"
              data={[
                { value: '', label: 'Tous les types' },
                { value: 'individuelle', label: 'Individuelle' },
                { value: 'collective', label: 'Collective' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              placeholder="Statut"
              data={[
                { value: '', label: 'Tous les statuts' },
                { value: 'inscrit', label: 'Inscrit' },
                { value: 'en_cours', label: 'En cours' },
                { value: 'complete', label: 'Terminé' },
                { value: 'annule', label: 'Annulé' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              placeholder={loadingOrganismes ? "Chargement..." : "Organisme"}
              data={organismes}
              value={organismeFilter}
              onChange={(value) => setOrganismeFilter(value || '')}
              clearable
              disabled={loadingOrganismes}
              searchable
              nothingFoundMessage="Aucun organisme trouvé"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Group grow>
              <TextInput
                type="date"
                title="Début de la période"
                aria-label="Début de la période"
                placeholder="Date début"
                value={dateDebut}
                onChange={(event) => setDateDebut(event.currentTarget.value)}
              />
              <TextInput
                type="date"
                title="Fin de la période"
                aria-label="Fin de la période"
                placeholder="Date fin"
                value={dateFin}
                onChange={(event) => setDateFin(event.currentTarget.value)}
              />
            </Group>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <MultiSelect
              placeholder="Infos manquantes..."
              aria-label="Filtrer les sessions auxquelles il manque des informations"
              leftSection={<Warning size={16} />}
              data={[
                { value: 'duree', label: 'Durée' },
                { value: 'organisme', label: 'Organisme' },
                { value: 'type', label: 'Type' },
                { value: 'dateFin', label: 'Date de fin' },
                { value: 'categorie', label: 'Catégorie' },
              ]}
              value={missingFieldsFilter}
              onChange={setMissingFieldsFilter}
              clearable
              searchable={false}
            />
          </Grid.Col>
        </Grid>

        <Text size="xs" c="dimmed" mt="xs">
          Dates : période « du / au ». Une seule date renseignée affiche les sessions de ce jour-là.
          {missingFieldsFilter.length > 0 &&
            " • Infos manquantes : une session remonte dès qu'il lui manque l'un des champs cochés."}
        </Text>

        {/* Tri */}
        <Group mt="md" gap="sm">
          <Group gap="xs">
            {sortOrder === 'desc' ? <SortDescending size={18} /> : <SortAscending size={18} />}
            <Text size="sm" fw={500}>Trier par :</Text>
          </Group>
          <Select
            size="sm"
            w={180}
            data={[
              { value: 'dateDebut', label: 'Date de début' },
              { value: 'dateFin', label: 'Date de fin' },
              { value: 'formationNom', label: 'Nom de formation' },
              { value: 'dureeHeures', label: 'Durée' },
              { value: 'coutTotal', label: 'Coût' },
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value || 'dateDebut')}
          />
          <ActionIcon
            variant="light"
            size="lg"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
          >
            {sortOrder === 'desc' ? <SortDescending size={18} /> : <SortAscending size={18} />}
          </ActionIcon>
        </Group>
        <Text size="sm" c="dimmed" mt="md">
          Affichage : {sessions.length} résultats sur cette page • {total} session(s) correspondant aux filtres (référence : {globalStats.total} sessions individuelles en base)
        </Text>
      </Paper>

      {/* Période d'enregistrement (date d'import / de création).
          Ce filtre n'a pas de champ dans le bloc ci-dessus : il arrive par
          l'URL (lien du tableau de bord). Sans ce rappel, la RH ne pourrait pas
          comprendre pourquoi la liste est plus courte que d'habitude. */}
      {aPeriodeImport && (
        <Alert
          icon={<Clock size={16} />}
          color="violet"
          variant="light"
          mb="xl"
          withCloseButton
          onClose={() => updateUrlParams({ dateImportDebut: null, dateImportFin: null })}
        >
          <Text fw={500} size="sm">
            Liste restreinte aux sessions enregistrées {libellePeriodeImport}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Date d&apos;import pour les sessions individuelles, date de création pour les
            sessions collectives — indépendante des dates de session. Fermez cette bannière
            pour lever la restriction.
          </Text>
        </Alert>
      )}

      {/* Liste des sessions */}
      {isLoading ? (
        <Center h={300}>
          <Loader size="lg" variant="bars" />
        </Center>
      ) : error ? (
        <Alert icon={<Warning size={16} />} color="red" variant="light">
          {error}
        </Alert>
      ) : sessions.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
              {sessions.map((session) => {
                const statusInfo = getDominantStatus(session.stats);
                const StatusIcon = statusInfo.icon;

                return (
                  <Paper
                    key={session.type === 'collective' ? `collective-${session.id}` : `grouped-${session.groupKey}`}
                    radius="md"
                    withBorder
                    p="lg"
                    style={{
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    onClick={() => handleViewDetails(session)}
                  >
                    {/* Header */}
                    <Group justify="space-between" mb="md">
                      <Group gap="xs">
                        {session.type && <SessionTypeBadge type={session.type} />}
                        {session.sourceImport === 'OLU' && (
                          <Badge color="violet" variant="light" size="sm">OL</Badge>
                        )}
                        <Badge
                          leftSection={<StatusIcon size={14} />}
                          color={statusInfo.color}
                          variant="light"
                        >
                          {statusInfo.label}
                        </Badge>
                      </Group>
                      <Menu withinPortal position="bottom-end" shadow="sm">
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DotsThreeVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<Eye size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(session);
                            }}
                          >
                            Voir les participants
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<BookOpen size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewFormation(session.formationId);
                            }}
                          >
                            Voir la formation
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<PencilSimple size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSession(session);
                            }}
                            color="blue"
                          >
                            Modifier{session.participants && session.participants.length > 1 ? ' les sessions' : ' la session'}
                          </Menu.Item>
                          {peutDemanderEvaluation(session) && (
                            <Menu.Item
                              leftSection={<PaperPlaneTilt size={14} />}
                              color="teal"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEvaluationModal(session);
                              }}
                            >
                              Demander une évaluation
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    {/* Nom de la formation */}
                    <Stack gap="xs" mb="md">
                      <Group gap="xs">
                        <BookOpen size={20} color="#228BE6" />
                        <Text size="md" fw={600} lineClamp={2}>
                          {session.formationNom}
                        </Text>
                      </Group>
                      {session.categorie && (
                        <Badge variant="dot" color="gray" size="sm">
                          {session.categorie}
                        </Badge>
                      )}
                    </Stack>

                    <Divider my="sm" />

                    {/* Participants */}
                    <Group gap="xs" mb="md">
                      <Users size={18} color="#868E96" />
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                          {formatParticipantCount(session)}
                        </Text>
                        {formatParticipantsPreview(session) && (
                          <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                            {formatParticipantsPreview(session)}
                          </Text>
                        )}
                        {session.stats && (
                          <Group gap="xs" mt={2}>
                            {session.stats.inscrit > 0 && (
                              <Badge size="xs" color="blue" variant="light">
                                {session.stats.inscrit} inscrit{session.stats.inscrit > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {session.stats.enCours > 0 && (
                              <Badge size="xs" color="yellow" variant="light">
                                {session.stats.enCours} en cours
                              </Badge>
                            )}
                            {session.stats.complete > 0 && (
                              <Badge size="xs" color="green" variant="light">
                                {session.stats.complete} terminé{session.stats.complete > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </Group>
                        )}
                      </div>
                    </Group>

                    {/* Info collective session */}
                    {session.type === 'collective' && (
                      <>
                        {session.titre && (
                          <Group gap="xs" mb="xs">
                            <Text size="xs" c="dimmed">Titre : {session.titre}</Text>
                          </Group>
                        )}
                        {session.modalite && (
                          <Group gap="xs" mb="xs">
                            <Badge size="sm" variant="light" color="grape">
                              {session.modalite === 'presentiel' ? 'Présentiel' :
                               session.modalite === 'distanciel' ? 'Distanciel' : 'Hybride'}
                            </Badge>
                          </Group>
                        )}
                        {session.lieu && (
                          <Group gap="xs" mb="xs">
                            <MapPin size={14} color="#868E96" />
                            <Text size="xs" c="dimmed">{session.lieu}</Text>
                          </Group>
                        )}
                      </>
                    )}

                    {/* Dates */}
                    {(session.dateDebut || session.dateFin) && (
                      <Stack gap="xs" mb="md">
                        <Group gap="xs">
                          <Calendar size={16} color="#868E96" />
                          <Text size="xs" c="dimmed">
                            {session.dateDebut
                              ? `Du ${new Date(session.dateDebut).toLocaleDateString('fr-FR')}`
                              : 'Date non définie'}
                            {session.dateFin && ` au ${new Date(session.dateFin).toLocaleDateString('fr-FR')}`}
                          </Text>
                        </Group>
                      </Stack>
                    )}

                    {/* Durée */}
                    {session.dureeHeures && (
                      <Group gap="xs" mb="md">
                        <Clock size={16} color="#868E96" />
                        <Text size="xs" c="dimmed">
                          {formatDuration(session.dureeHeures)}
                        </Text>
                      </Group>
                    )}

                    {/* Organisme */}
                    {session.organisme && (
                      <Group gap="xs" mb="md">
                        <Building size={16} color="#868E96" />
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {typeof session.organisme === 'string' ? session.organisme : session.organisme.nomOrganisme}
                        </Text>
                      </Group>
                    )}

                    {/* Coût */}
                    {session.coutTotal && (
                      <Box mt="md" pt="md" style={{ borderTop: '1px solid #E9ECEF' }}>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">Coût total estimé</Text>
                          <Text size="sm" fw={600} c="blue">
                            {Number(session.coutTotal).toLocaleString('fr-FR')} €
                          </Text>
                        </Group>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </SimpleGrid>
          ) : (
            // Vue liste
            <Paper shadow="xs" p="md" radius="md" mb="xl">
              <Table highlightOnHover verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 40 }}>
                      <Checkbox
                        checked={sessions.length > 0 && selectedIds.size === sessions.length}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < sessions.length}
                        onChange={toggleSelectAll}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Table.Th>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Organisme</Table.Th>
                    <Table.Th>Dates</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Participants</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Statuts</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Durée</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Coût</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sessions.map((session) => {
                    const statusInfo = getDominantStatus(session.stats);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <Table.Tr
                        key={session.type === 'collective' ? `collective-${session.id}` : `grouped-${session.groupKey}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleViewDetails(session)}
                      >
                        <Table.Td>
                          <Checkbox
                            checked={selectedIds.has(session.type === 'collective' ? `collective-${session.id}` : `grouped-${session.groupKey}`)}
                            onChange={() => toggleSelection(session.type === 'collective' ? `collective-${session.id}` : `grouped-${session.groupKey}`)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Group gap="xs" mb={4}>
                              <BookOpen size={16} color="#228BE6" />
                              <Text size="sm" fw={600} lineClamp={1}>
                                {session.formationNom || session.formation?.nomFormation}
                              </Text>
                            </Group>
                            <Group gap="xs" mt={4}>
                              {session.type && <SessionTypeBadge type={session.type} size="xs" />}
                              {session.sourceImport === 'OLU' && (
                                <Badge color="violet" variant="light" size="xs">OL</Badge>
                              )}
                              {session.categorie && (
                                <Badge variant="dot" color="gray" size="xs">
                                  {session.categorie}
                                </Badge>
                              )}
                              {session.type === 'collective' && session.modalite && (
                                <Badge variant="light" color="grape" size="xs">
                                  {session.modalite === 'presentiel' ? 'Présentiel' :
                                   session.modalite === 'distanciel' ? 'Distanciel' : 'Hybride'}
                                </Badge>
                              )}
                            </Group>
                          </div>
                        </Table.Td>

                        <Table.Td>
                          {session.organismeNom || session.organisme?.nomOrganisme ? (
                            <Text size="sm" c="dimmed">
                              {session.organismeNom || session.organisme?.nomOrganisme}
                            </Text>
                          ) : (
                            <Text size="xs" c="dimmed" fs="italic">
                              Non défini
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td>
                          {session.dateDebut || session.dateFin ? (
                            <div>
                              <Group gap={4}>
                                <Calendar size={14} color="#868E96" />
                                <Text size="xs">
                                  {session.dateDebut
                                    ? new Date(session.dateDebut).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                      })
                                    : '-'}
                                </Text>
                              </Group>
                              {session.dateFin && (
                                <Text size="xs" c="dimmed" mt={2}>
                                  au {new Date(session.dateFin).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </Text>
                              )}
                            </div>
                          ) : (
                            <Text size="xs" c="dimmed">
                              Non planifiée
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td>
                          <Stack gap={4} align="center">
                            <Group gap="xs">
                              <Users size={16} color="#868E96" />
                              <Text size="sm" fw={600}>
                                {getParticipantCount(session)}
                              </Text>
                            </Group>
                            {formatParticipantsPreview(session) && (
                              <Text size="xs" c="dimmed" lineClamp={1} ta="center">
                                {formatParticipantsPreview(session)}
                              </Text>
                            )}
                            {session.lieu && (
                              <Group gap={2}>
                                <MapPin size={12} color="#868E96" />
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {session.lieu}
                                </Text>
                              </Group>
                            )}
                          </Stack>
                        </Table.Td>

                        <Table.Td>
                          <Stack gap={4} align="center">
                            <Badge
                              leftSection={<StatusIcon size={12} />}
                              color={statusInfo.color}
                              variant="light"
                              size="sm"
                            >
                              {statusInfo.label}
                            </Badge>
                            <Group gap={4} justify="center">
                              {session.stats && session.stats.inscrit > 0 && (
                                <Tooltip label={`${session.stats.inscrit} inscrit(s)`}>
                                  <Badge size="xs" color="blue" variant="dot">
                                    {session.stats.inscrit}
                                  </Badge>
                                </Tooltip>
                              )}
                              {session.stats && session.stats.enCours > 0 && (
                                <Tooltip label={`${session.stats.enCours} en cours`}>
                                  <Badge size="xs" color="yellow" variant="dot">
                                    {session.stats.enCours}
                                  </Badge>
                                </Tooltip>
                              )}
                              {session.stats && session.stats.complete > 0 && (
                                <Tooltip label={`${session.stats.complete} terminé(s)`}>
                                  <Badge size="xs" color="green" variant="dot">
                                    {session.stats.complete}
                                  </Badge>
                                </Tooltip>
                              )}
                              {session.stats && session.stats.annule > 0 && (
                                <Tooltip label={`${session.stats.annule} annulé(s)`}>
                                  <Badge size="xs" color="red" variant="dot">
                                    {session.stats.annule}
                                  </Badge>
                                </Tooltip>
                              )}
                            </Group>
                          </Stack>
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'center' }}>
                          {session.dureeHeures ? (
                            <Group gap={4} justify="center">
                              <Clock size={14} color="#868E96" />
                              <Text size="sm">{formatDuration(session.dureeHeures)}</Text>
                            </Group>
                          ) : (
                            <Text size="xs" c="dimmed">
                              -
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          {session.coutTotal ? (
                            <Text size="sm" fw={600} c="blue">
                              {Number(session.coutTotal).toLocaleString('fr-FR')} €
                            </Text>
                          ) : (
                            <Text size="xs" c="dimmed">
                              -
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          <Group gap="xs" justify="flex-end">
                            <Tooltip label="Voir les participants">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(session);
                                }}
                              >
                                <Eye size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Voir la formation">
                              <ActionIcon
                                variant="light"
                                color="gray"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFormation(session.formationId);
                                }}
                              >
                                <BookOpen size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label={session.participants && session.participants.length > 1 ? "Modifier les sessions" : "Modifier la session"}>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSession(session);
                                }}
                              >
                                <PencilSimple size={16} />
                              </ActionIcon>
                            </Tooltip>
                            {peutDemanderEvaluation(session) && (
                              <Tooltip label="Demander une évaluation aux participants">
                                <ActionIcon
                                  variant="light"
                                  color="teal"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEvaluationModal(session);
                                  }}
                                >
                                  <PaperPlaneTilt size={16} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>

              {sessions.length === 0 && (
                <Center h={200}>
                  <Stack align="center">
                    <List size={48} color="#868E96" />
                    <Text size="lg" fw={500} c="dimmed">
                      Aucune session à afficher
                    </Text>
                  </Stack>
                </Center>
              )}
            </Paper>
          )}

          {/* Pagination */}
          <Paper shadow="xs" p="lg" radius="md">
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Page {page} sur {totalPages} • Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} résultats filtrés
              </Text>
              <Pagination
                value={page}
                onChange={handlePageChange}
                total={totalPages}
                siblings={1}
                boundaries={1}
                size="md"
              />
            </Group>
          </Paper>
        </>
      ) : (
        <Paper shadow="xs" p="xl" radius="md">
          <Center py="xl">
            <Stack align="center">
              <Calendar size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucune session trouvée</Text>
              <Text size="sm" c="dimmed">
                Essayez de modifier vos critères de recherche
              </Text>
              <Button
                leftSection={<Plus size={16} />}
                onClick={() => router.push('/sessions/new')}
                mt="md"
              >
                Créer une inscription
              </Button>
            </Stack>
          </Center>
        </Paper>
      )}
      {/* Modal de confirmation suppression en lot */}
      <Modal
        opened={batchDeleteModalOpen}
        onClose={() => setBatchDeleteModalOpen(false)}
        title={<Group gap="xs"><Trash size={20} /> Suppression en lot</Group>}
        centered
      >
        <Stack>
          <Text>
            Vous êtes sur le point de supprimer <strong>{getSelectedSessionIds().length}</strong> session(s).
          </Text>
          <Alert color="red" variant="light" icon={<Warning size={16} />}>
            Cette action est irréversible. Les sessions seront définitivement supprimées.
          </Alert>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setBatchDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button
              color="red"
              onClick={handleBatchDelete}
              loading={isBatchDeleting}
              leftSection={<Trash size={16} />}
            >
              Confirmer la suppression
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Demande d'évaluation sur un groupe de sessions individuelles */}
      <Modal
        opened={Boolean(evalGroup)}
        onClose={closeEvaluationModal}
        title={
          <Group gap="xs">
            <PaperPlaneTilt size={20} />
            <Text fw={600}>Demander une évaluation</Text>
          </Group>
        }
        size="lg"
        centered
        closeOnClickOutside={!isSendingEval}
        closeOnEscape={!isSendingEval}
      >
        <Stack gap="md">
          <div>
            <Text fw={600}>{evalGroup?.formationNom}</Text>
            {(evalGroup?.dateDebut || evalGroup?.dateFin) && (
              <Text size="sm" c="dimmed">
                {evalGroup?.dateDebut
                  ? `Du ${new Date(evalGroup.dateDebut).toLocaleDateString('fr-FR')}`
                  : 'Date non définie'}
                {evalGroup?.dateFin &&
                  ` au ${new Date(evalGroup.dateFin).toLocaleDateString('fr-FR')}`}
              </Text>
            )}
          </div>

          <SegmentedControl
            fullWidth
            value={evalType}
            onChange={(value) => setEvalType(value as EvaluationMoment)}
            disabled={isSendingEval}
            data={[
              { value: 'chaud', label: 'À chaud (au collaborateur)' },
              { value: 'froid', label: 'À froid (au manager)' },
            ]}
          />

          {/* Prévisualisation : seule source de vérité sur les destinataires */}
          {evalPreviewLoading ? (
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Calcul des destinataires...</Text>
            </Group>
          ) : evalError ? (
            <Alert color="red" variant="light" icon={<Warning size={16} />}>
              {evalError}
            </Alert>
          ) : evalPreview ? (
            <Paper withBorder p="md" radius="md">
              <Grid>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Recevront le mail
                  </Text>
                  <Text size="xl" fw={700} c="teal">{evalPreview.destinataires}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Déjà envoyées
                  </Text>
                  <Text size="xl" fw={700} c="blue">{evalPreview.dejaEnvoyees}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Sans email
                  </Text>
                  <Text size="xl" fw={700} c="orange">{evalPreview.sansEmail}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Participants
                  </Text>
                  <Text size="xl" fw={700}>{evalPreview.totalParticipants}</Text>
                </Grid.Col>
              </Grid>
              <Text size="xs" c="dimmed" mt="sm">
                {evalPreview.totalSessions} session(s) individuelle(s) dans ce groupe.
                {evalPreview.sansEmail > 0 &&
                  ` ${evalPreview.sansEmail} personne(s) n'ont pas d'adresse email exploitable et seront ignorées.`}
                {evalPreview.dejaEnvoyees > 0 &&
                  ` ${evalPreview.dejaEnvoyees} évaluation(s) à ${evalType} ont déjà été envoyées : elles ne seront pas renvoyées.`}
              </Text>
            </Paper>
          ) : null}

          {/* Questionnaire : obligatoire, c'est lui qui porte le lien envoyé */}
          {evalTemplatesLoading ? (
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Chargement des questionnaires...</Text>
            </Group>
          ) : evalTemplates.length === 0 ? (
            <Alert color="orange" variant="light" icon={<Warning size={16} />}>
              Aucun questionnaire actif de type « à {evalType} ». Créez-en un depuis
              la page Questionnaires (un lien SharePoint ou Forms suffit) avant de
              lancer la demande.
            </Alert>
          ) : (
            <Select
              label="Questionnaire à envoyer"
              placeholder="Sélectionner un questionnaire"
              required
              searchable
              leftSection={<ClipboardText size={16} />}
              disabled={isSendingEval}
              data={evalTemplates.map((q) => ({
                value: q.id.toString(),
                label: q.nom,
              }))}
              value={evalQuestionnaireId}
              onChange={setEvalQuestionnaireId}
              description={(() => {
                const choisi = evalTemplates.find(
                  (q) => q.id.toString() === evalQuestionnaireId,
                );
                if (!choisi) return `Questionnaires actifs de type « à ${evalType} »`;
                return choisi.lienUrl
                  ? `Lien externe : ${choisi.lienUrl}`
                  : `${choisi.nombreQuestions} question(s) posées dans l'outil`;
              })()}
            />
          )}

          <Alert color="blue" variant="light" icon={<Info size={16} />}>
            Chaque participant reçoit un email personnel. L&apos;envoi n&apos;est pas
            annulable : ne validez qu&apos;une fois.
          </Alert>

          <Group justify="flex-end">
            <Button variant="default" onClick={closeEvaluationModal} disabled={isSendingEval}>
              Annuler
            </Button>
            <Button
              color="teal"
              leftSection={<PaperPlaneTilt size={16} />}
              loading={isSendingEval}
              disabled={
                isSendingEval ||
                evalPreviewLoading ||
                !evalPreview ||
                evalPreview.destinataires === 0 ||
                !evalQuestionnaireId
              }
              onClick={handleSendGroupEvaluations}
            >
              {evalPreviewLoading
                ? 'Vérification en cours...'
                : !evalPreview
                  ? 'Envoi indisponible'
                  : evalPreview.destinataires > 0
                    ? `Envoyer à ${evalPreview.destinataires} personne(s)`
                    : 'Aucun destinataire'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}