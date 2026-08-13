'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  Center,
  Stack,
  Paper,
  Flex,
  Menu,
  Pagination,
  Loader,
  Alert,
  Avatar,
  Select,
  MultiSelect,
  Grid,
  Card,
  Tooltip,
  ThemeIcon,
  Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { Download } from '@phosphor-icons/react/dist/ssr/Download';
import { Upload } from '@phosphor-icons/react/dist/ssr/Upload';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { Building } from '@phosphor-icons/react/dist/ssr/Building';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr/FunnelSimple';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { UserMinus } from '@phosphor-icons/react/dist/ssr/UserMinus';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { UserCheck } from '@phosphor-icons/react/dist/ssr/UserCheck';
import { UserCircleMinus } from '@phosphor-icons/react/dist/ssr/UserCircleMinus';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { DateInput } from '@mantine/dates';
import 'dayjs/locale/fr';
import { useRouter, useSearchParams } from 'next/navigation';
import { collaborateursService, commonService } from '@/lib/services';
import type {
  CollaborateurAvecConge,
  CollaborateursStats,
} from '@/lib/services/collaborateurs.service';
import { Collaborateur, CollaborateurFilters } from '@/lib/types';
import { useDebounce } from '@/hooks/useApi';

/**
 * Une borne de période n'est acceptée qu'au format `YYYY-MM-DD` (celui produit
 * par le tableau de bord). Toute autre valeur est ignorée silencieusement :
 * mieux vaut une liste non bornée qu'une page en erreur.
 */
const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

const lireBorneJour = (valeur: string | null): string =>
  valeur && FORMAT_JOUR.test(valeur) ? valeur : '';

/** `2026-03-31` -> `31/03/2026` (affichage bannière) */
const formaterJour = (valeur: string): string => {
  const date = new Date(`${valeur}T00:00:00`);
  return isNaN(date.getTime()) ? valeur : date.toLocaleDateString('fr-FR');
};

export default function CollaborateursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // États
  const [collaborateurs, setCollaborateurs] = useState<CollaborateurAvecConge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<CollaborateursStats | null>(null);
  const [departements, setDepartements] = useState<{ value: string; label: string }[]>([]);
  const [typesContrats, setTypesContrats] = useState<{ value: string; label: string }[]>([]);

  // Modal de suppression
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [collaborateurToDelete, setCollaborateurToDelete] = useState<Collaborateur | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal de désactivation avec date
  const [deactivateModalOpened, setDeactivateModalOpened] = useState(false);
  const [collaborateurToDeactivate, setCollaborateurToDeactivate] = useState<Collaborateur | null>(null);
  const [dateInactivation, setDateInactivation] = useState<Date | null>(new Date());
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Filtres et pagination
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  // Par défaut, n'afficher que les collaborateurs actifs
  const [statusFilter, setStatusFilter] = useState<string>('actif');
  // Congé longue durée : 'tous' (aucun filtre) | 'enConge' | 'horsConge'
  const [congeFilter, setCongeFilter] = useState<string>('tous');
  const [missingFieldsFilter, setMissingFieldsFilter] = useState<string[]>([]);
  const [contratFilter, setContratFilter] = useState<string>('');
  const [sansFormation, setSansFormation] = useState(searchParams.get('filter') === 'sansFormation');
  // Période transmise par le tableau de bord avec le filtre « sans formation ».
  // Lue une seule fois au montage, comme `filter` : la page n'est pas pilotée
  // par l'URL, l'utilisateur reprend la main ensuite.
  const [periodeDebut, setPeriodeDebut] = useState(() => lireBorneJour(searchParams.get('dateDebut')));
  const [periodeFin, setPeriodeFin] = useState(() => lireBorneJour(searchParams.get('dateFin')));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  
  const debouncedSearch = useDebounce(search, 500);

  // Options pour le filtre des informations manquantes
  const missingFieldsOptions = [
    { value: 'idExterne', label: 'ID Orange Learning' },
    { value: 'matricule', label: 'Matricule RH' },
    { value: 'departement', label: 'Département' },
    { value: 'manager', label: 'Manager' },
    { value: 'genre', label: 'Genre' },
    { value: 'contrat', label: 'Type de contrat' },
  ];

  // Charger les collaborateurs
  const loadCollaborateurs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Construire les filtres en fonction du backend
      const filters: any = {
        page,
        limit,
      };
      
      // Ajouter la recherche seulement si elle n'est pas vide
      if (debouncedSearch && debouncedSearch.trim()) {
        filters.search = debouncedSearch.trim();
      }
      
      // Ajouter le filtre département
      if (departmentFilter) {
        filters.departementId = parseInt(departmentFilter);
      }

      // Ajouter le filtre type de contrat
      if (contratFilter) {
        filters.contratId = parseInt(contratFilter);
      }

      // Gérer le filtre de statut avec le paramètre actif
      // (envoyé comme chaîne pour que axios le transmette correctement)
      if (statusFilter === 'actif') {
        filters.actif = 'true' as any;
      } else if (statusFilter === 'inactif') {
        filters.actif = 'false' as any;
      } else if (statusFilter === 'tous') {
        // 'all' = inclure les inactifs (aucun filtre côté backend)
        filters.actif = 'all' as any;
      }

      // Filtre congé longue durée (omis quand 'tous' pour ne pas discriminer)
      if (congeFilter === 'enConge') {
        filters.enCongeLongueDuree = 'true';
      } else if (congeFilter === 'horsConge') {
        filters.enCongeLongueDuree = 'false';
      }

      // Filtre des informations manquantes
      if (missingFieldsFilter.length > 0) {
        filters.missingFields = missingFieldsFilter.join(',');
      }

      // Filtre sans formation.
      // Les bornes n'accompagnent QUE ce filtre : le backend les interprète
      // comme « aucune formation sur cette période » (sessions individuelles
      // ET participations collectives, sessions sans date incluses). Envoyées
      // seules, elles n'auraient aucun sens sur /collaborateurs.
      if (sansFormation) {
        filters.sansFormation = 'true';
        if (periodeDebut) {
          filters.dateDebut = periodeDebut;
        }
        if (periodeFin) {
          filters.dateFin = periodeFin;
        }
      }

      const response = await collaborateursService.getCollaborateurs(filters);

      if (response.data) {
        setCollaborateurs(response.data);
        const totalCount = response.meta?.total || (response as any).total || 0;
        setTotal(totalCount);
        setTotalPages(response.meta?.totalPages || Math.ceil(totalCount / limit));

        // Stats du backend : elles portent sur le FILTRE COURANT, pas sur
        // l'effectif complet (voir CollaborateursStats). Elles sont remises à
        // null quand le backend n'en renvoie pas, sinon les tuiles resteraient
        // figées sur le résultat du filtre précédent.
        setGlobalStats(response.stats ?? null);
      } else {
        setCollaborateurs([]);
        setTotal(0);
        setTotalPages(0);
        setGlobalStats(null);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des collaborateurs:', err);
      setError(err.message || 'Erreur lors du chargement des collaborateurs');
      setCollaborateurs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les départements et types de contrats au montage
  useEffect(() => {
    const loadDepartements = async () => {
      try {
        const deps = await commonService.getDepartements();
        const departmentsList = deps.map(d => ({
          value: d.id.toString(),
          label: d.nomDepartement,
        }));
        setDepartements([
          { value: '', label: 'Tous les départements' },
          ...departmentsList
        ]);
      } catch (error) {
        console.error('Erreur lors du chargement des départements:', error);
      }
    };

    const loadTypesContrats = async () => {
      try {
        const contrats = await commonService.getTypesContrats();
        const contratsList = contrats.map(c => ({
          value: c.id.toString(),
          label: c.typeContrat,
        }));
        setTypesContrats([
          { value: '', label: 'Tous les contrats' },
          ...contratsList
        ]);
      } catch (error) {
        console.error('Erreur lors du chargement des types de contrats:', error);
      }
    };

    loadDepartements();
    loadTypesContrats();
  }, []);

  // Charger les collaborateurs au montage et quand les filtres changent
  useEffect(() => {
    loadCollaborateurs();
  }, [debouncedSearch, departmentFilter, statusFilter, congeFilter, missingFieldsFilter, contratFilter, sansFormation, periodeDebut, periodeFin, page]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentFilter, statusFilter, congeFilter, missingFieldsFilter, contratFilter, sansFormation, periodeDebut, periodeFin]);

  const handleViewDetails = (id: number) => {
    router.push(`/collaborateurs/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/collaborateurs/${id}/edit`);
  };

  const handleExport = async () => {
    try {
      const blob = await collaborateursService.exportCollaborateurs();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collaborateurs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notifications.show({
        title: 'Succès',
        message: 'Export réussi',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de l\'export',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };

  const handleRefresh = () => {
    loadCollaborateurs();
  };

  // Retire UNIQUEMENT les paramètres demandés de l'URL, en conservant les
  // autres : le filtre « sans formation » et sa période doivent pouvoir être
  // retirés indépendamment l'un de l'autre. On repart de window.location.search
  // (et non de searchParams) pour ne pas travailler sur un état périmé.
  const retirerParamsUrl = (cles: string[]) => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : searchParams.toString()
    );
    cles.forEach((cle) => params.delete(cle));
    const query = params.toString();
    router.replace(query ? `/collaborateurs?${query}` : '/collaborateurs', { scroll: false });
  };

  const retirerFiltreSansFormation = () => {
    setSansFormation(false);
    retirerParamsUrl(['filter']);
  };

  const retirerPeriodeSansFormation = () => {
    setPeriodeDebut('');
    setPeriodeFin('');
    retirerParamsUrl(['dateDebut', 'dateFin']);
  };

  // Libellé de la période effectivement transmise à l'API
  const aPeriodeSansFormation = Boolean(periodeDebut || periodeFin);
  const libellePeriodeSansFormation =
    periodeDebut && periodeFin
      ? `du ${formaterJour(periodeDebut)} au ${formaterJour(periodeFin)}`
      : periodeDebut
        ? `à partir du ${formaterJour(periodeDebut)}`
        : `jusqu'au ${formaterJour(periodeFin)}`;

  // Activer/Désactiver un collaborateur
  const handleToggleActif = async (collaborateur: Collaborateur) => {
    try {
      await collaborateursService.updateCollaborateur(collaborateur.id, {
        actif: !collaborateur.actif,
      });

      notifications.show({
        title: 'Succès',
        message: `Collaborateur ${!collaborateur.actif ? 'activé' : 'désactivé'} avec succès`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      loadCollaborateurs();
    } catch (error: any) {
      console.error('Erreur lors de la modification du statut:', error);
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de la modification du statut',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };

  // Ouvrir la modal de suppression
  const handleOpenDeleteModal = (collaborateur: Collaborateur) => {
    setCollaborateurToDelete(collaborateur);
    setDeleteModalOpened(true);
  };

  // Supprimer un collaborateur
  const handleDelete = async () => {
    if (!collaborateurToDelete) return;

    setIsDeleting(true);
    try {
      const result = await collaborateursService.deleteCollaborateur(collaborateurToDelete.id);

      notifications.show({
        title: 'Succès',
        message: result.message,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      // Afficher les détails de la suppression si pertinent
      if (result.subordonnesReassignes > 0 || result.formationsConservees > 0) {
        const details: string[] = [];
        if (result.subordonnesReassignes > 0) {
          details.push(`${result.subordonnesReassignes} subordonnés réassignés`);
        }
        if (result.formationsConservees > 0) {
          details.push(`${result.formationsConservees} formations conservées`);
        }

        setTimeout(() => {
          notifications.show({
            title: 'Informations',
            message: details.join(' • '),
            color: 'blue',
            autoClose: 5000,
          });
        }, 1000);
      }

      setDeleteModalOpened(false);
      setCollaborateurToDelete(null);
      loadCollaborateurs();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      const message = error.response?.data?.message || error.message || 'Une erreur est survenue';
      notifications.show({
        title: 'Erreur',
        message,
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Ouvrir la modal de désactivation/modification date
  const handleOpenDeactivateModal = (collaborateur: Collaborateur) => {
    setCollaborateurToDeactivate(collaborateur);
    // Si le collaborateur a déjà une date d'inactivation, l'utiliser, sinon date du jour
    setDateInactivation(
      collaborateur.dateInactivation
        ? new Date(collaborateur.dateInactivation)
        : new Date()
    );
    setDeactivateModalOpened(true);
  };

  // Helper pour formater une date en YYYY-MM-DD
  const formatDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Désactiver un collaborateur avec date ou modifier la date d'inactivation
  const handleDeactivateWithDate = async () => {
    if (!collaborateurToDeactivate) return;

    setIsDeactivating(true);
    try {
      const updateData: any = {
        dateInactivation: dateInactivation ? formatDateOnly(dateInactivation) : null,
      };

      // Si le collaborateur est actif, on le désactive
      if (collaborateurToDeactivate.actif) {
        updateData.actif = false;
      }

      await collaborateursService.updateCollaborateur(collaborateurToDeactivate.id, updateData);

      const message = collaborateurToDeactivate.actif
        ? `${collaborateurToDeactivate.nomComplet} a été désactivé avec succès`
        : `Date d'inactivation de ${collaborateurToDeactivate.nomComplet} mise à jour`;

      notifications.show({
        title: 'Succès',
        message,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      setDeactivateModalOpened(false);
      setCollaborateurToDeactivate(null);
      loadCollaborateurs();
    } catch (error: any) {
      console.error('Erreur lors de la désactivation:', error);
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de la désactivation',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  // Fonction pour obtenir les infos manquantes d'un collaborateur
  const getMissingInfo = (collaborateur: Collaborateur): string[] => {
    const missing: string[] = [];
    if (!collaborateur.idExterne) missing.push('ID Orange Learning');
    if (!collaborateur.matricule) missing.push('Matricule RH');
    if (!collaborateur.departementId && !collaborateur.departement) missing.push('Département');
    if (!collaborateur.managerId && !collaborateur.manager) missing.push('Manager');
    if (!collaborateur.genre) missing.push('Genre');
    if (!collaborateur.contratId) missing.push('Type de contrat');
    return missing;
  };

  /**
   * Un filtre « de contenu » est-il actif ?
   *
   * Le statut (actif/inactif) est volontairement EXCLU de ce test : le backend
   * calcule `total`, `totalActifs` et `totalInactifs` hors dimension `actif`,
   * ces trois compteurs ne bougent donc pas quand on change le sélecteur de
   * statut. `totalFiltres`, lui, tient compte de tout, statut compris.
   */
  const filtreActif = Boolean(
    debouncedSearch.trim() ||
    departmentFilter ||
    contratFilter ||
    congeFilter !== 'tous' ||
    missingFieldsFilter.length > 0 ||
    sansFormation
  );

  // Nombre de résultats du filtre courant : c'est le chiffre qui correspond au
  // tableau affiché (`meta.total` en repli si le backend est plus ancien).
  const totalFiltres = globalStats?.totalFiltres ?? total;

  // Utiliser les statistiques globales du backend ou calculer localement
  const stats = globalStats ? {
    total:
      globalStats.total ??
      ((globalStats.totalActifs ?? 0) + (globalStats.totalInactifs ?? 0)),
    actifs: globalStats.totalActifs ?? 0,
    inactifs: globalStats.totalInactifs ?? 0,
    departements: globalStats.totalDepartements ?? 0,
  } : {
    total: total,
    actifs: collaborateurs.filter(c => c.actif).length,
    inactifs: collaborateurs.filter(c => !c.actif).length,
    departements: [...new Set(collaborateurs.map(c => {
      const dept = c.departement;
      return typeof dept === 'string' ? dept : dept?.nomDepartement;
    }).filter(Boolean))].length,
  };

  const rows = collaborateurs.map((collaborateur) => {
    const missingInfo = getMissingInfo(collaborateur);
    return (
    <Table.Tr key={collaborateur.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar size={36} radius="xl" color="blue">
            {collaborateur.nomComplet?.split(' ').map(n => n[0]).join('') || 'NA'}
          </Avatar>
          <div>
            <Group gap="xs">
              <Text size="sm" fw={500}>
                {collaborateur.nomComplet}
              </Text>
              {missingInfo.length > 0 && (
                <Tooltip label={`Informations manquantes : ${missingInfo.join(', ')}`}>
                  <Badge color="red" variant="light" size="xs" leftSection={<Warning size={10} />}>
                    {missingInfo.length} info(s) manquante(s)
                  </Badge>
                </Tooltip>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              {collaborateur.idExterne || collaborateur.matricule || 'Aucun identifiant'}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Building size={14} color="#868E96" />
          <Text size="sm">
            {typeof collaborateur.departement === 'string'
              ? collaborateur.departement
              : collaborateur.departement?.nomDepartement || 'Non assigné'}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{collaborateur.manager?.nomComplet || '-'}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{collaborateur.contrat?.typeContrat || '-'}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <GraduationCap size={14} color="#868E96" />
          <Text size="sm">{collaborateur._count?.sessions || 0}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        {/*
          Le congé longue durée s'ajoute au statut actif (il ne le remplace pas) :
          la personne reste dans l'effectif, elle sort seulement du suivi des
          formations obligatoires.
        */}
        <Group gap={6}>
          <Badge
            color={collaborateur.actif ? 'green' : 'red'}
            variant="light"
            size="sm"
          >
            {collaborateur.actif ? 'Actif' : 'Inactif'}
          </Badge>
          {collaborateur.actif && collaborateur.enCongeLongueDuree && (
            <Tooltip
              multiline
              w={260}
              label="Congé longue durée : reste dans l'effectif, mais exclu du suivi des formations obligatoires."
            >
              <Badge color="blue" variant="light" size="sm">
                En congé
              </Badge>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Voir détails">
            <ActionIcon
              variant="subtle"
              onClick={() => handleViewDetails(collaborateur.id)}
            >
              <Eye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Modifier">
            <ActionIcon
              variant="subtle"
              onClick={() => handleEdit(collaborateur.id)}
            >
              <PencilSimple size={16} />
            </ActionIcon>
          </Tooltip>
          <Menu withinPortal position="bottom-end" shadow="sm">
            <Menu.Target>
              <ActionIcon variant="subtle">
                <DotsThreeVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<Eye size={14} />}
                onClick={() => handleViewDetails(collaborateur.id)}
              >
                Voir détails
              </Menu.Item>
              <Menu.Item
                leftSection={<PencilSimple size={14} />}
                onClick={() => handleEdit(collaborateur.id)}
              >
                Modifier
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<GraduationCap size={14} />}
                onClick={() => router.push(`/sessions/new?collaborateurId=${collaborateur.id}`)}
              >
                Inscrire à une formation
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={collaborateur.actif ? <UserCircleMinus size={14} /> : <UserCheck size={14} />}
                color={collaborateur.actif ? 'orange' : 'green'}
                onClick={() => handleToggleActif(collaborateur)}
              >
                {collaborateur.actif ? 'Désactiver' : 'Activer'}
              </Menu.Item>
              <Menu.Item
                leftSection={<Calendar size={14} />}
                color="orange"
                onClick={() => handleOpenDeactivateModal(collaborateur)}
              >
                {collaborateur.actif ? 'Désactiver avec date' : 'Modifier date inactivation'}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<Trash size={14} />}
                color="red"
                onClick={() => handleOpenDeleteModal(collaborateur)}
              >
                Supprimer
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
    );
  });

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <div>
            <Group align="center" gap="sm">
              <Users size={32} color="#228BE6" />
              <Title order={1}>Collaborateurs</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Gérez vos collaborateurs et leurs formations
            </Text>
          </div>
          <Group>
            <Tooltip label="Rafraîchir">
              <ActionIcon variant="light" size="lg" onClick={handleRefresh}>
                <ArrowsClockwise size={20} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<Upload size={16} />}
              variant="light"
              onClick={() => router.push('/collaborateurs/import')}
            >
              Importer
            </Button>
            <Button
              leftSection={<Download size={16} />}
              variant="light"
              onClick={handleExport}
            >
              Exporter
            </Button>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => router.push('/collaborateurs/new')}
            >
              Nouveau
            </Button>
          </Group>
        </Flex>

        {/*
          Statistiques rapides.

          Ces tuiles suivent le filtre courant : quand un filtre est actif,
          elles sont explicitement libellées « du filtre » pour qu'on ne les
          lise plus comme l'effectif complet au-dessus d'un tableau filtré.
        */}
        <Grid mt="lg">
          {filtreActif && (
            <Grid.Col span={12}>
              <Card withBorder p="md" radius="md" bg="orange.0">
                <Group justify="space-between" align="center">
                  <Group gap="sm" align="center">
                    <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                      <FunnelSimple size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        Résultats du filtre
                      </Text>
                      <Text size="xl" fw={700} c="orange.8">
                        {totalFiltres} collaborateur{totalFiltres > 1 ? 's' : ''}
                      </Text>
                    </div>
                  </Group>
                  <Text size="xs" c="dimmed" style={{ maxWidth: 480 }}>
                    C&apos;est le nombre de lignes du tableau ci-dessous. Les tuiles
                    suivantes portent elles aussi sur le filtre courant (hors
                    sélecteur de statut) et non sur l&apos;effectif total.
                  </Text>
                </Group>
              </Card>
            </Grid.Col>
          )}
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {filtreActif ? 'Total du filtre' : 'Total'}
                  </Text>
                  <Text size="xl" fw={700}>{stats.total}</Text>
                  {filtreActif && (
                    <Text size="xs" c="dimmed">
                      actifs + inactifs correspondant au filtre
                    </Text>
                  )}
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <Users size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {filtreActif ? 'Actifs du filtre' : 'Actifs'}
                  </Text>
                  <Text size="xl" fw={700} c="green">{stats.actifs}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <User size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {filtreActif ? 'Inactifs du filtre' : 'Inactifs'}
                  </Text>
                  <Text size="xl" fw={700} c="red">{stats.inactifs}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="red">
                  <UserMinus size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {filtreActif ? 'Départements du filtre' : 'Départements'}
                  </Text>
                  <Text size="xl" fw={700}>{stats.departements}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <Building size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Filtres */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group align="center" mb="md">
          <FunnelSimple size={20} />
          <Text fw={600}>Filtres et Recherche</Text>
        </Group>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label=" "
              placeholder="Rechercher par nom, prénom, matricule..."
              leftSection={<MagnifyingGlass size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Tous les départements"
              data={departements}
              value={departmentFilter}
              onChange={(value) => setDepartmentFilter(value || '')}
              clearable
              searchable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Statut"
              data={[
                { value: 'actif', label: 'Actifs' },
                { value: 'inactif', label: 'Inactifs' },
                { value: 'tous', label: 'Tous (inclure inactifs)' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || 'actif')}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Congé longue durée"
              data={[
                { value: 'tous', label: 'Congé : tous' },
                { value: 'enConge', label: 'En congé longue durée' },
                { value: 'horsConge', label: 'Hors congé longue durée' },
              ]}
              value={congeFilter}
              onChange={(value) => setCongeFilter(value || 'tous')}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Tous les contrats"
              data={typesContrats}
              value={contratFilter}
              onChange={(value) => setContratFilter(value || '')}
              clearable
              searchable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <MultiSelect
              placeholder="Infos manquantes..."
              data={missingFieldsOptions}
              value={missingFieldsFilter}
              onChange={setMissingFieldsFilter}
              clearable
              searchable
              leftSection={<Warning size={16} />}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Combinaison impossible : un inactif n'est jamais en congé longue durée */}
      {congeFilter === 'enConge' && statusFilter === 'inactif' && (
        <Alert icon={<Warning size={16} />} color="blue" variant="light" mb="xl">
          <Text size="sm">
            Un collaborateur inactif n&apos;est jamais en congé longue durée : cette
            combinaison de filtres ne peut renvoyer aucun résultat. Choisissez le statut
            « Actifs » ou « Tous ».
          </Text>
        </Alert>
      )}

      {/* Bannière filtre sans formation (+ période appliquée).
          Le filtre et la période se retirent séparément : la croix ne retire
          que le filtre, le bouton « Retirer la période » ne retire que les
          bornes. */}
      {(sansFormation || aPeriodeSansFormation) && (
        <Alert
          icon={<Warning size={16} />}
          color={sansFormation ? 'orange' : 'gray'}
          variant="light"
          mb="xl"
          withCloseButton={sansFormation}
          onClose={retirerFiltreSansFormation}
        >
          <Stack gap={6}>
            {sansFormation ? (
              <Text fw={500} size="sm">
                Filtre actif : collaborateurs sans aucune formation —{' '}
                {isLoading
                  ? 'calcul en cours…'
                  : `${totalFiltres} collaborateur${totalFiltres > 1 ? 's' : ''} correspondant${totalFiltres > 1 ? 's' : ''}`}
              </Text>
            ) : (
              <Text fw={500} size="sm">
                Filtre « sans formation » retiré : la période ci-dessous n&apos;est plus appliquée.
              </Text>
            )}

            {sansFormation && (
              <Text size="xs" c="dimmed">
                Le tableau et les tuiles ci-dessus sont bien restreints à ce filtre.
              </Text>
            )}

            {aPeriodeSansFormation ? (
              <Group gap="xs" align="center">
                <Text size="sm">
                  {sansFormation
                    ? `Période prise en compte : ${libellePeriodeSansFormation} (sessions individuelles et collectives, sessions sans date incluses).`
                    : `Période conservée mais sans effet : ${libellePeriodeSansFormation}.`}
                </Text>
                <Button
                  variant="subtle"
                  color="gray"
                  size="compact-xs"
                  onClick={retirerPeriodeSansFormation}
                >
                  Retirer la période
                </Button>
              </Group>
            ) : (
              /*
                Seconde moitié du malentendu : sans bornes dans l'URL, le filtre
                porte sur TOUT l'historique. Le compteur du tableau de bord, lui,
                est borné à une période — les deux chiffres n'ont donc aucune
                raison d'être égaux, et cet écart était lu comme un filtre en
                panne.
              */
              <Stack gap={2}>
                <Text size="sm">
                  Aucune période n&apos;est appliquée : le filtre porte sur tout
                  l&apos;historique, c&apos;est-à-dire les collaborateurs qui n&apos;ont
                  jamais suivi aucune formation.
                </Text>
                <Text size="xs" c="dimmed">
                  Ce n&apos;est pas le même calcul que le compteur du tableau de bord,
                  qui est borné à une période : un collaborateur formé il y a trois ans
                  compte comme « sans formation » sur la période du tableau de bord,
                  mais pas ici.
                </Text>
              </Stack>
            )}
          </Stack>
        </Alert>
      )}

      {/* Table des collaborateurs */}
      <Paper shadow="xs" radius="md" withBorder>
        {isLoading ? (
          <Center h={400}>
            <Loader size="lg" variant="bars" />
          </Center>
        ) : error ? (
          <Alert icon={<Warning size={16} />} color="red" variant="light" m="lg">
            {error}
          </Alert>
        ) : collaborateurs.length > 0 ? (
          <>
            <Table.ScrollContainer minWidth={900}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur / Matricule</Table.Th>
                    <Table.Th>Département</Table.Th>
                    <Table.Th>Manager</Table.Th>
                    <Table.Th>Contrat</Table.Th>
                    <Table.Th>Formations</Table.Th>
                    <Table.Th>Statut</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Pagination */}
            <Group justify="space-between" p="lg">
              <Text size="sm" c="dimmed">
                Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} collaborateurs
              </Text>
              <Pagination
                value={page}
                onChange={setPage}
                total={totalPages}
                siblings={1}
                boundaries={1}
                size="md"
              />
            </Group>
          </>
        ) : (
          <Center py="xl">
            <Stack align="center">
              <Users size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucun collaborateur trouvé</Text>
              <Text size="sm" c="dimmed">
                Essayez de modifier vos critères de recherche
              </Text>
              <Button
                leftSection={<Plus size={16} />}
                onClick={() => router.push('/collaborateurs/new')}
                mt="md"
              >
                Ajouter un collaborateur
              </Button>
            </Stack>
          </Center>
        )}
      </Paper>

      {/* Modal de confirmation de suppression */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => !isDeleting && setDeleteModalOpened(false)}
        title="Confirmer la suppression"
        centered
      >
        <Stack gap="md">
          <Text>
            Êtes-vous sûr de vouloir supprimer le collaborateur{' '}
            <Text span fw={600}>
              {collaborateurToDelete?.prenom} {collaborateurToDelete?.nom}
            </Text>{' '}
            ?
          </Text>

          {/* Afficher des informations si le collaborateur a des dépendances */}
          {collaborateurToDelete && (
            <Stack gap="xs">
              {(collaborateurToDelete.nombreFormations ?? 0) > 0 && (
                <Paper p="sm" withBorder bg="blue.0">
                  <Group gap="xs">
                    <GraduationCap size={20} className="text-blue-600" />
                    <Text size="sm" c="blue.8">
                      Ce collaborateur a {collaborateurToDelete.nombreFormations} formation(s).
                      Les données de formation seront conservées.
                    </Text>
                  </Group>
                </Paper>
              )}

              {collaborateurToDelete.departement && (
                <Text size="sm" c="dimmed">
                  Département :{' '}
                  {typeof collaborateurToDelete.departement === 'string'
                    ? collaborateurToDelete.departement
                    : collaborateurToDelete.departement?.nomDepartement || String(collaborateurToDelete.departement)}
                </Text>
              )}
            </Stack>
          )}

          <Alert icon={<Warning size={20} />} color="red" variant="light">
            <Text size="sm" fw={500}>
              Cette action est irréversible !
            </Text>
            <Text size="sm">
              Le collaborateur sera définitivement supprimé de la base de données.
            </Text>
            <Text size="sm">
              Les subordonnés éventuels seront automatiquement réassignés.
            </Text>
          </Alert>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setDeleteModalOpened(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={isDeleting}
              leftSection={<Trash size={16} />}
            >
              Supprimer
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de désactivation avec date / modification date inactivation */}
      <Modal
        opened={deactivateModalOpened}
        onClose={() => !isDeactivating && setDeactivateModalOpened(false)}
        title={collaborateurToDeactivate?.actif ? "Désactiver le collaborateur" : "Modifier la date d'inactivation"}
        centered
      >
        <Stack gap="md">
          <Text>
            {collaborateurToDeactivate?.actif
              ? "Vous allez désactiver le collaborateur "
              : "Modifier la date d'inactivation de "}
            <Text span fw={600}>
              {collaborateurToDeactivate?.prenom} {collaborateurToDeactivate?.nom}
            </Text>
          </Text>

          <DateInput
            label="Date d'inactivation"
            placeholder="Sélectionner une date"
            locale="fr"
            valueFormat="DD/MM/YYYY"
            value={dateInactivation}
            onChange={(value) => {
              const dateValue = typeof value === 'string' ? new Date(value) : value;
              setDateInactivation(dateValue);
            }}
            clearable
            description="Date à laquelle le collaborateur est devenu inactif"
            leftSection={<Calendar size={16} />}
          />

          {collaborateurToDeactivate?.actif && (
            <Alert icon={<Warning size={20} />} color="orange" variant="light">
              <Text size="sm">
                Le collaborateur sera marqué comme inactif et ne sera plus comptabilisé dans les statistiques actives.
              </Text>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setDeactivateModalOpened(false)}
              disabled={isDeactivating}
            >
              Annuler
            </Button>
            <Button
              color="orange"
              onClick={handleDeactivateWithDate}
              loading={isDeactivating}
              leftSection={collaborateurToDeactivate?.actif ? <UserCircleMinus size={16} /> : <Calendar size={16} />}
            >
              {collaborateurToDeactivate?.actif ? 'Désactiver' : 'Enregistrer'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}