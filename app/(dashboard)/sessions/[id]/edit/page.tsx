'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Card,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Alert,
  NumberInput,
  Textarea,
  Paper,
  Text,
  Loader,
  Center,
  Badge,
  ThemeIcon,
  Divider,
  Grid,
  Modal,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Building } from '@phosphor-icons/react/dist/ssr/Building';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText';
import { FloppyDisk } from '@phosphor-icons/react/dist/ssr/FloppyDisk';
import { Star } from '@phosphor-icons/react/dist/ssr/Star';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck';
import { Hourglass } from '@phosphor-icons/react/dist/ssr/Hourglass';
import { Certificate } from '@phosphor-icons/react/dist/ssr/Certificate';
import { CalendarX } from '@phosphor-icons/react/dist/ssr/CalendarX';
import { IdentificationCard } from '@phosphor-icons/react/dist/ssr/IdentificationCard';
import { ArrowsLeftRight } from '@phosphor-icons/react/dist/ssr/ArrowsLeftRight';
import { sessionsService, collaborateursService, commonService, formationsService } from '@/lib/services';
import { SessionsUnifiedService } from '@/lib/services/sessions-unified.service';
import { SessionFormationResponse, CollectiveSession, OrganismeFormation } from '@/lib/types';
import { StatutUtils } from '@/lib/utils/statut.utils';
import { formatDateOnly } from '@/lib/utils/date.utils';
import { SessionTypeBadge } from '@/components/sessions/SessionTypeBadge';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';

interface Props {
  params: {
    id: string;
  };
}

// Configuration des statuts
const statusConfig = {
  'inscrit': { color: 'blue', icon: CalendarCheck, label: 'Inscrit' },
  'INSCRIT': { color: 'blue', icon: CalendarCheck, label: 'Inscrit' },
  'en_cours': { color: 'yellow', icon: Hourglass, label: 'En cours' },
  'EN_COURS': { color: 'yellow', icon: Hourglass, label: 'En cours' },
  'complete': { color: 'green', icon: Certificate, label: 'Terminé' },
  'COMPLETE': { color: 'green', icon: Certificate, label: 'Terminé' },
  'TERMINE': { color: 'green', icon: Certificate, label: 'Terminé' },
  'Terminé': { color: 'green', icon: Certificate, label: 'Terminé' },
  'terminé': { color: 'green', icon: Certificate, label: 'Terminé' },
  'annule': { color: 'red', icon: CalendarX, label: 'Annulé' },
  'ANNULE': { color: 'red', icon: CalendarX, label: 'Annulé' },
  'Annulé': { color: 'red', icon: CalendarX, label: 'Annulé' },
  'annulé': { color: 'red', icon: CalendarX, label: 'Annulé' },
};

interface FormValues {
  // Champs communs
  statut: string;
  dateDebut: string;
  dateFin: string;
  anneeBudgetaire?: number;
  // null = aucun organisme rattaché (et, pour une session individuelle,
  // détachement explicite au moment de l'enregistrement)
  organismeId?: number | null;

  // Champs individuels
  dureeHeures?: number;
  tarifHT?: number;
  tarifTTC?: number;
  commentaire: string;

  // Champs collectifs
  titre?: string;
  lieu?: string;
  dureePrevueHeures?: number;
  modalite?: string;
  tarifUnitaireHT?: number;
  tarifTotalHT?: number;
  description?: string;
  formateurNom?: string;
  formateurContact?: string;
  lienVisio?: string;
}

export default function EditSessionPage({ params }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null); // Can be individual or collective

  // Organisme de formation : la liste des organismes actifs alimente le Select,
  // et l'organisme « normal » de la formation sert à signaler une divergence.
  const [organismes, setOrganismes] = useState<OrganismeFormation[]>([]);
  const [loadingOrganismes, setLoadingOrganismes] = useState(true);
  const [formationOrganisme, setFormationOrganisme] = useState<
    { id: number; nom: string } | null
  >(null);

  // Remplacement du collaborateur (sessions individuelles)
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replacementId, setReplacementId] = useState<string | null>(null);
  const [replacementMotif, setReplacementMotif] = useState('');
  const [replacementSearch, setReplacementSearch] = useState('');
  const [replacementOptions, setReplacementOptions] = useState<{ value: string; label: string }[]>([]);
  const [isReplacing, setIsReplacing] = useState(false);

  // Recherche serveur debouncée (même pattern que la page inscriptions).
  // Indispensable : les noms sont chiffrés en base, un filtrage client sur une
  // page partielle ne trouverait pas grand-chose.
  useEffect(() => {
    const q = replacementSearch.trim();
    if (q.length < 2) {
      setReplacementOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await collaborateursService.searchCollaborateurs(q, { limit: 50 });
        const liste = Array.isArray(data) ? data : [];
        setReplacementOptions(
          liste
            .filter((c: any) => c.id !== session?.collaborateur?.id && c.actif !== false)
            .map((c: any) => ({
              value: String(c.id),
              label: `${c.prenom ?? ''} ${c.nom ?? ''}`.trim() + (c.matricule ? ` (${c.matricule})` : ''),
            }))
        );
      } catch (err) {
        console.error('Erreur lors de la recherche de collaborateurs:', err);
        setReplacementOptions([]);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [replacementSearch, session?.collaborateur?.id]);

  // Charger les organismes de formation actifs (le backend ne renvoie que
  // les organismes actifs sur /common/organismes).
  useEffect(() => {
    const loadOrganismes = async () => {
      setLoadingOrganismes(true);
      try {
        const data = await commonService.getOrganismesFormation();
        setOrganismes((data || []) as OrganismeFormation[]);
      } catch (error) {
        console.error('Erreur lors du chargement des organismes:', error);
        setOrganismes([]);
      } finally {
        setLoadingOrganismes(false);
      }
    };

    loadOrganismes();
  }, []);

  const handleReplaceCollaborateur = async () => {
    if (!replacementId) return;
    setIsReplacing(true);
    try {
      await sessionsService.replaceCollaborateur(parseInt(params.id), {
        nouveauCollaborateurId: parseInt(replacementId),
        motif: replacementMotif.trim() || undefined,
      });

      notifications.show({
        title: 'Collaborateur remplacé',
        message: 'La session a été réaffectée au nouveau collaborateur',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      setShowReplaceModal(false);
      const sessionData = await SessionsUnifiedService.findOne(parseInt(params.id));
      setSession(sessionData);
    } catch (error: any) {
      notifications.show({
        title: 'Remplacement impossible',
        message: error.response?.data?.message || 'Une erreur est survenue',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsReplacing(false);
    }
  };


  const form = useForm<FormValues>({
    initialValues: {
      // Communs
      statut: '',
      dateDebut: '',
      dateFin: '',
      anneeBudgetaire: undefined,
      organismeId: null,
      // Individuels
      dureeHeures: undefined,
      tarifHT: undefined,
      tarifTTC: undefined,
      commentaire: '',
      // Collectifs
      titre: '',
      lieu: '',
      dureePrevueHeures: undefined,
      modalite: 'presentiel',
      tarifUnitaireHT: undefined,
      tarifTotalHT: undefined,
      description: '',
      formateurNom: '',
      formateurContact: '',
      lienVisio: '',
    },
    validate: {
      statut: (value) => {
        if (!value) return 'Le statut est requis';
        return null;
      },
      dateDebut: (value) => {
        if (!value) return 'La date de début est requise';
        return null;
      },
      dateFin: (value, values) => {
        if (value && values.dateDebut && value < values.dateDebut) {
          return 'La date de fin doit être après la date de début';
        }
        return null;
      },
      dureeHeures: (value) => {
        if (value !== undefined && value < 0) {
          return 'La durée doit être positive';
        }
        return null;
      },
      anneeBudgetaire: (value) => {
        if (value !== undefined && (value < 2000 || value > 2100)) {
          return 'L\'année doit être entre 2000 et 2100';
        }
        return null;
      },
    },
  });

  // Normaliser le statut pour le backend
  const normalizeStatusForBackend = (status: string): string => {
    const statusLower = status?.toLowerCase() || 'inscrit';
    if (statusLower === 'termine' || statusLower === 'terminé') {
      return 'complete';
    }
    if (statusLower === 'annulé') {
      return 'annule';
    }
    return statusLower;
  };

  // Charger les données de la session avec auto-détection
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      try {
        const sessionData = await SessionsUnifiedService.findOne(parseInt(params.id));
        setSession(sessionData);

        // Normaliser le statut pour l'envoi au backend
        const normalizedStatus = normalizeStatusForBackend(sessionData.statut);

        // Organisme rattaché à la session : la lecture renvoie l'objet
        // `organisme` (avec son id) côté individuel, et `organismeId` côté
        // collectif. null = aucun organisme rattaché.
        //
        // ATTENTION `organismeHerite` : depuis le repli d'affichage, `organisme`
        // peut être celui de la FORMATION et non celui de la session. Le
        // pré-remplir ici le matérialiserait en organisme de session à la
        // première sauvegarde, sans décision de la RH. Le champ reste donc vide
        // (un encart lui dit lequel serait hérité, et elle le choisit si elle
        // veut vraiment le figer sur cette session).
        const organismeHerite = (sessionData as any).organismeHerite === true;
        const organismeIdActuel = organismeHerite
          ? null
          : ((sessionData as any).organisme?.id ?? (sessionData as any).organismeId ?? null);

        // Mettre à jour le formulaire selon le type de session
        if (sessionData.type === 'collective') {
          // Session collective
          form.setValues({
            statut: normalizedStatus,
            dateDebut: sessionData.dateDebut
              ? formatDateOnly(new Date(sessionData.dateDebut))
              : '',
            dateFin: sessionData.dateFin
              ? formatDateOnly(new Date(sessionData.dateFin))
              : '',
            anneeBudgetaire: sessionData.anneeBudgetaire || undefined,
            organismeId: organismeIdActuel,
            // Champs collectifs
            titre: sessionData.titre || '',
            lieu: sessionData.lieu || '',
            dureePrevueHeures: sessionData.dureePrevue ? Number(sessionData.dureePrevue) : undefined,
            modalite: sessionData.modalite || 'presentiel',
            tarifUnitaireHT: sessionData.tarifUnitaireHT ? Number(sessionData.tarifUnitaireHT) : undefined,
            tarifTotalHT: sessionData.tarifTotalHT ? Number(sessionData.tarifTotalHT) : undefined,
            description: sessionData.description || '',
            formateurNom: sessionData.formateurNom || '',
            formateurContact: sessionData.formateurContact || '',
            lienVisio: sessionData.lienVisio || '',
            // Champs individuels (vides)
            dureeHeures: undefined,
            commentaire: '',
          });
        } else {
          // Session individuelle
          form.setValues({
            statut: normalizedStatus,
            dateDebut: sessionData.dateDebut
              ? formatDateOnly(new Date(sessionData.dateDebut))
              : '',
            dateFin: sessionData.dateFin
              ? formatDateOnly(new Date(sessionData.dateFin))
              : '',
            dureeHeures: sessionData.dureeHeures || undefined,
            tarifHT: sessionData.tarifHT ? Number(sessionData.tarifHT) : undefined,
            tarifTTC: sessionData.tarifTTC ? Number(sessionData.tarifTTC) : undefined,
            anneeBudgetaire: sessionData.anneeBudgetaire !== null && sessionData.anneeBudgetaire !== undefined
              ? sessionData.anneeBudgetaire
              : undefined,
            organismeId: organismeIdActuel,
            commentaire: sessionData.commentaire || '',
            // Champs collectifs (vides)
            titre: '',
            lieu: '',
            dureePrevueHeures: undefined,
            modalite: 'presentiel',
            tarifUnitaireHT: undefined,
            tarifTotalHT: undefined,
            description: '',
            formateurNom: '',
            formateurContact: '',
            lienVisio: '',
          });
        }

        // Organisme « normal » de la formation : sert uniquement à avertir la RH
        // d'une divergence. try/catch dédié : un échec ici ne doit surtout pas
        // faire sortir de la page d'édition (le catch global fait router.back()).
        const formationId = (sessionData as any).formation?.id ?? (sessionData as any).formationId;
        if (formationId) {
          try {
            const formation = await formationsService.getFormation(formationId);
            setFormationOrganisme(
              formation?.organismeId
                ? {
                    id: formation.organismeId,
                    nom: formation.organisme?.nomOrganisme || 'un autre organisme',
                  }
                : null
            );
          } catch (error) {
            console.error("Erreur lors du chargement de l'organisme de la formation:", error);
            setFormationOrganisme(null);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la session:', error);
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de charger la session',
          color: 'red',
          icon: <Warning size={20} />,
        });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSession();
  }, [params.id]);

  // Vérifier la transition de statut
  const isStatusTransitionAllowed = (currentStatus: string, newStatus: string): boolean => {
    // Normaliser les deux statuts avec la même fonction
    const mappedCurrent = normalizeStatusForBackend(currentStatus);
    const mappedNew = normalizeStatusForBackend(newStatus);

    const allowedTransitions: Record<string, string[]> = {
      'inscrit': ['en_cours', 'annule'],
      'en_cours': ['complete', 'annule'],
      'complete': [], // Aucune transition autorisée
      'annule': ['inscrit'], // Permet de réinscrire
    };

    // Même statut = autorisé (pas de changement)
    return mappedCurrent === mappedNew ||
           (allowedTransitions[mappedCurrent]?.includes(mappedNew) ?? false);
  };

  const handleSubmit = async (values: FormValues) => {
    if (!session) return;

    // Vérifier si la transition de statut est autorisée
    if (!isStatusTransitionAllowed(session.statut || 'inscrit', values.statut)) {
      notifications.show({
        title: 'Erreur',
        message: `Transition de statut non autorisée: ${session.statut} → ${values.statut}`,
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (session.type === 'collective') {
        // Mise à jour session collective
        const updateData: any = {
          statut: values.statut,
          dateDebut: values.dateDebut || undefined,
          dateFin: values.dateFin || undefined,
          titre: values.titre || undefined,
          lieu: values.lieu || undefined,
          dureePrevue: values.dureePrevueHeures || undefined,
          modalite: values.modalite || undefined,
          tarifUnitaireHT: values.tarifUnitaireHT || undefined,
          tarifTotalHT: values.tarifTotalHT || undefined,
          anneeBudgetaire: values.anneeBudgetaire || undefined,
          description: values.description || undefined,
          formateurNom: values.formateurNom || undefined,
          formateurContact: values.formateurContact || undefined,
          lienVisio: values.lienVisio || undefined,
          // Côté collectif, le détachement par `null` n'est pas fiable
          // (conversion de type héritée) : on n'envoie le champ que lorsqu'un
          // organisme est réellement sélectionné, sinon on le laisse inchangé.
          organismeId: values.organismeId ?? undefined,
        };

        // Supprimer les valeurs undefined
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        await SessionsUnifiedService.update(parseInt(params.id), updateData, 'collective');
      } else {
        // Mise à jour session individuelle
        const updateData: any = {
          statut: values.statut,
          dateDebut: values.dateDebut,
          dateFin: values.dateFin || undefined,
          dureeHeures: values.dureeHeures || undefined,
          tarifHT: values.tarifHT || undefined,
          tarifTTC: values.tarifTTC || undefined,
          anneeBudgetaire: values.anneeBudgetaire,
          commentaire: values.commentaire || undefined,
          // Le champ vidé doit DÉTACHER l'organisme : on envoie explicitement
          // `null` (et surtout pas `undefined`, que le backend interprète comme
          // « champ absent, ne rien changer » et que la boucle ci-dessous
          // supprimerait du payload).
          organismeId: values.organismeId ?? null,
        };

        // Supprimer les valeurs undefined
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        await sessionsService.updateSession(parseInt(params.id), updateData);
      }

      notifications.show({
        title: 'Succès',
        message: 'Session mise à jour avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      // Conserver le paramètre type pour rester sur la bonne page
      const typeParam = session.type === 'collective' ? '?type=collective' : '';
      router.push(`/sessions/${params.id}${typeParam}`);
    } catch (error: any) {
      // `error.message` : le service des sessions collectives passe par fetch et
      // relaie le message du backend dans une Error simple (pas de `response`).
      // C'est ce qui permet d'afficher tel quel « Organisme X introuvable ou
      // inactif » quel que soit le type de session.
      const errorMessage =
        error.response?.data?.message || error.message || 'Erreur lors de la mise à jour';

      notifications.show({
        title: 'Erreur',
        message: errorMessage,
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container size="lg">
        <Center h={400}>
          <Loader size="lg" variant="bars" />
        </Center>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container size="lg">
        <Center h={400}>
          <Stack align="center">
            <Warning size={48} color="gray" />
            <Text size="lg" c="dimmed">Session non trouvée</Text>
            <Button onClick={() => router.back()}>Retour</Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  // Configuration de l'icône et couleur du statut actuel
  // Chercher la configuration en tenant compte de toutes les variantes possibles
  let currentStatusConfig = statusConfig[session.statut as keyof typeof statusConfig];
  
  // Si pas trouvé directement, essayer en majuscules/minuscules
  if (!currentStatusConfig) {
    const upperStatus = session.statut?.toUpperCase();
    const lowerStatus = session.statut?.toLowerCase();
    currentStatusConfig = statusConfig[upperStatus as keyof typeof statusConfig] || 
                         statusConfig[lowerStatus as keyof typeof statusConfig];
  }
  
  // Si toujours pas trouvé et que c'est une variante de "terminé"
  if (!currentStatusConfig && (session.statut === 'TERMINE' || session.statut === 'termine' || session.statut === 'Terminé')) {
    currentStatusConfig = statusConfig.complete;
  }
  
  // Fallback final
  if (!currentStatusConfig) {
    currentStatusConfig = { color: 'blue', icon: CalendarCheck, label: session.statut || 'Inconnu' };
  }
  
  const StatusIcon = currentStatusConfig.icon;

  // Déterminer les transitions de statut autorisées
  const getAvailableStatusTransitions = () => {
    const currentStatus = session.statut || 'inscrit';
    // Normaliser le statut pour le backend
    const normalizedStatus = normalizeStatusForBackend(currentStatus);
    const transitions: { value: string; label: string; disabled?: boolean }[] = [];

    // Labels pour l'affichage
    const statusLabels: Record<string, string> = {
      'inscrit': 'Inscrit',
      'en_cours': 'En cours',
      'complete': 'Terminé',
      'annule': 'Annulé',
    };

    // Toujours afficher le statut actuel avec la valeur normalisée
    transitions.push({
      value: normalizedStatus,
      label: `${statusLabels[normalizedStatus] || 'Terminé'} (actuel)`,
    });

    // Ajouter les transitions possibles
    if (normalizedStatus === 'inscrit') {
      transitions.push(
        { value: 'en_cours', label: 'En cours' },
        { value: 'annule', label: 'Annulé' }
      );
    } else if (normalizedStatus === 'en_cours') {
      transitions.push(
        { value: 'complete', label: 'Terminé' },
        { value: 'annule', label: 'Annulé' }
      );
    } else if (normalizedStatus === 'annule') {
      transitions.push(
        { value: 'inscrit', label: 'Inscrit (réinscrire)' }
      );
    }
    // Si complete, aucune transition possible

    return transitions;
  };

  // ---- Organisme de la session (champ modifiable) ----

  const selectedOrganismeId = form.values.organismeId ?? null;

  // Options du Select : les organismes actifs. Si la session pointe vers un
  // organisme désactivé (cas fréquent sur les sessions historiques), il ne
  // figure pas dans la liste : on l'ajoute explicitement, sinon Mantine
  // afficherait un champ vide et la RH croirait l'organisme perdu.
  const organismeOptions = organismes.map((o) => ({
    value: o.id.toString(),
    label: o.nomOrganisme,
  }));

  // Un organisme hérité de la formation n'est pas « l'organisme de la session » :
  // il ne doit pas être injecté dans les options comme un organisme désactivé.
  const organismeSessionId = session.organismeHerite
    ? null
    : (session.organisme?.id ?? session.organismeId ?? null);
  if (
    organismeSessionId &&
    !organismeOptions.some((o) => o.value === organismeSessionId.toString())
  ) {
    organismeOptions.unshift({
      value: organismeSessionId.toString(),
      label: `${session.organisme?.nom || session.organisme?.nomOrganisme || 'Organisme'} (inactif)`,
    });
  }

  // Avertissement de divergence (même logique que la page de création) :
  // l'organisme choisi n'est pas celui qui dispense habituellement la formation.
  const nomOrganismeSelectionne =
    organismeOptions.find((o) => o.value === String(selectedOrganismeId))?.label ||
    'un autre organisme';

  const organismeWarning =
    formationOrganisme && selectedOrganismeId && selectedOrganismeId !== formationOrganisme.id
      ? `⚠️ Vous avez sélectionné "${nomOrganismeSelectionne}" alors que la formation est normalement dispensée par "${formationOrganisme.nom}".`
      : null;

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Group align="center" gap="sm">
            <Title order={1}>Modifier la session</Title>
            <Badge color="gray" variant="light">#{session.id}</Badge>
            {session.type && <SessionTypeBadge type={session.type} />}
            {session.sourceImport === 'OLU' && (
              <Badge color="violet" variant="light">OL</Badge>
            )}
          </Group>
          <Text c="dimmed" mt="xs">
            Modification de la session {session.type === 'collective' ? 'collective' : 'individuelle'}
          </Text>
        </div>
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={20} />}
          onClick={() => router.back()}
        >
          Retour
        </Button>
      </Group>

      {session.sourceImport === 'OLU' && (
        <Alert icon={<Info size={16} />} color="violet" variant="light" mb="lg">
          Cette session a été importée depuis Open Learning (OL). Vos modifications manuelles
          (tarifs, commentaires, dates) sont préservées lors des imports suivants.
          Seul le statut peut être mis à jour par OL (sans jamais régresser).
        </Alert>
      )}

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 4 }}>
          {/* Informations non modifiables */}
          <Stack gap="md">
            <Paper shadow="xs" p="lg" radius="md" withBorder>
              <Text fw={600} mb="md">Informations de la session</Text>
              <Stack gap="md">
                {/* Collaborateur (seulement pour sessions individuelles) */}
                {session.type === 'individuelle' && session.collaborateur && (
                  <>
                    <div>
                      <Group gap="xs" mb={4}>
                        <User size={16} color="#868E96" />
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Collaborateur
                        </Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        {session.collaborateur?.prenom} {session.collaborateur?.nom}
                      </Text>
                      {session.collaborateur?.matricule && (
                        <Group gap={4} mt={2}>
                          <IdentificationCard size={14} color="#868E96" />
                          <Text size="xs" c="dimmed">
                            Matricule: {session.collaborateur.matricule}
                          </Text>
                        </Group>
                      )}
                      <Text size="xs" c="dimmed" mt={2}>
                        {session.collaborateur?.departement || 'Département non défini'}
                      </Text>
                      {session.collaborateur?.email && (
                        <Text size="xs" c="dimmed">
                          {session.collaborateur.email}
                        </Text>
                      )}
                      <Button
                        variant="light"
                        size="xs"
                        mt="sm"
                        leftSection={<ArrowsLeftRight size={14} />}
                        onClick={() => {
                          setReplacementId(null);
                          setReplacementMotif('');
                          setShowReplaceModal(true);
                        }}
                      >
                        Remplacer
                      </Button>
                    </div>
                    <Divider />
                  </>
                )}

                {/* Informations collective (pour sessions collectives) */}
                {session.type === 'collective' && (
                  <>
                    <div>
                      <Group gap="xs" mb={4}>
                        <Users size={16} color="#868E96" />
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Session collective
                        </Text>
                      </Group>
                      {session.modalite && (
                        <Badge size="sm" variant="light" color="grape" mt={2}>
                          {session.modalite === 'presentiel' ? 'Présentiel' :
                           session.modalite === 'distanciel' ? 'Distanciel' : 'Hybride'}
                        </Badge>
                      )}
                    </div>
                    <Divider />
                  </>
                )}

                <Divider />

                {/* Formation */}
                <div>
                  <Group gap="xs" mb={4}>
                    <BookOpen size={16} color="#868E96" />
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Formation
                    </Text>
                  </Group>
                  <Text size="sm" fw={500}>
                    {session.formation?.nom}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    Code: {session.formation?.code}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Catégorie: {session.formation?.categorie}
                  </Text>
                  {session.formation?.dureeHeures && (
                    <Text size="xs" c="dimmed">
                      Durée prévue: {session.formation.dureeHeures}h
                    </Text>
                  )}
                </div>

                {/* L'organisme n'est plus affiché ici : il est devenu un champ
                    modifiable du formulaire (colonne de droite). */}
              </Stack>
            </Paper>

            {/* Statut actuel */}
            <Paper shadow="xs" p="lg" radius="md" withBorder>
              <Text fw={600} mb="md">Statut actuel</Text>
              <Center>
                <Stack align="center" gap="sm">
                  <ThemeIcon size={48} radius="md" variant="light" color={currentStatusConfig.color}>
                    <StatusIcon size={28} />
                  </ThemeIcon>
                  <Badge
                    size="lg"
                    color={currentStatusConfig.color}
                    variant="light"
                  >
                    {currentStatusConfig.label}
                  </Badge>
                </Stack>
              </Center>
            </Paper>

            {/* Note d'information */}
            <Alert icon={<Info size={16} />} color="blue" variant="light">
              <Text size="xs">
                Les transitions de statut sont limitées selon les règles métier. 
                Une session terminée ne peut pas être modifiée.
              </Text>
            </Alert>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              {/* Statut et dates */}
              <Paper shadow="xs" p="lg" radius="md" withBorder>
                <Group align="center" mb="md">
                  <Calendar size={20} />
                  <Text fw={600}>Statut et dates</Text>
                </Group>
                
                <Stack gap="md">
                  <Select
                    label="Statut"
                    description="Seules les transitions autorisées sont disponibles"
                    required
                    data={getAvailableStatusTransitions()}
                    {...form.getInputProps('statut')}
                  />
                  
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Date de début"
                        description="Date de début de la formation"
                        type="date"
                        required
                        {...form.getInputProps('dateDebut')}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Date de fin"
                        description="Date de fin de la formation"
                        type="date"
                        {...form.getInputProps('dateFin')}
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Paper>

              {/* Organisme de formation (modifiable) */}
              <Paper shadow="xs" p="lg" radius="md" withBorder>
                <Group align="center" mb="md">
                  <Building size={20} />
                  <Text fw={600}>Organisme de formation</Text>
                </Group>

                <Stack gap="md">
                  {/*
                    La session n'a pas d'organisme propre : la liste affiche
                    celui de la formation, signalé « via la formation ». On le
                    rappelle ici, sans pré-remplir le champ — le renseigner reste
                    une décision explicite de la RH.
                  */}
                  {session.organismeHerite && formationOrganisme && (
                    <Alert color="gray" title="Organisme hérité de la formation" icon={<Building size={20} />}>
                      Cette session n&apos;a pas d&apos;organisme propre : elle affiche
                      «&nbsp;{formationOrganisme.nom}&nbsp;», l&apos;organisme de la formation.
                      Sélectionnez un organisme ci-dessous uniquement si le prestataire
                      réel de cette session est différent, ou pour le figer sur la session.
                    </Alert>
                  )}

                  {organismeWarning && (
                    <Alert color="blue" title="Information" icon={<Warning size={20} />}>
                      {organismeWarning}
                    </Alert>
                  )}

                  <Select
                    label="Organisme"
                    placeholder={
                      loadingOrganismes
                        ? 'Chargement des organismes...'
                        : organismeOptions.length === 0
                          ? 'Aucun organisme disponible'
                          : 'Sélectionner un organisme'
                    }
                    description={
                      session.type === 'individuelle'
                        ? 'Videz le champ pour détacher l\'organisme de la session'
                        : 'Le détachement n\'est pas disponible sur une session collective : sélectionnez un autre organisme'
                    }
                    searchable
                    // Le détachement (`null`) n'est fiable que côté individuel.
                    // allowDeselect doit suivre clearable : sans ça, recliquer
                    // l'option déjà sélectionnée viderait quand même le champ
                    // sur une session collective, où le détachement n'aboutit
                    // pas (l'organisme réapparaîtrait après rechargement).
                    clearable={session.type === 'individuelle'}
                    allowDeselect={session.type === 'individuelle'}
                    disabled={loadingOrganismes || organismeOptions.length === 0}
                    data={organismeOptions}
                    nothingFoundMessage="Aucun organisme trouvé"
                    value={selectedOrganismeId !== null ? String(selectedOrganismeId) : null}
                    onChange={(value) =>
                      form.setFieldValue('organismeId', value ? parseInt(value, 10) : null)
                    }
                    leftSection={<Building size={16} />}
                  />

                  {!loadingOrganismes && organismeOptions.length === 0 && (
                    <Text size="xs" c="dimmed">
                      Aucun organisme actif n&apos;est disponible. Activez ou créez un organisme
                      depuis la page Organismes pour pouvoir en rattacher un à cette session.
                    </Text>
                  )}
                </Stack>
              </Paper>

              {/* Champs SESSION INDIVIDUELLE */}
              {session.type === 'individuelle' && (
                <>
                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <Clock size={20} />
                      <Text fw={600}>Durée et tarification</Text>
                    </Group>

                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <NumberInput
                          label="Durée (heures)"
                          description="Nombre d'heures effectivement suivies"
                          placeholder="Par pas de 0.5 (ex: 1.5, 2, 2.5)"
                          min={0}
                          max={1000}
                          step={0.5}
                          decimalScale={1}
                          {...form.getInputProps('dureeHeures')}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <NumberInput
                          label="Année budgétaire"
                          description="Laissez vide pour utiliser l'année de la session"
                          placeholder="Ex: 2024"
                          min={2000}
                          max={2100}
                          leftSection={<Calendar size={16} />}
                          {...form.getInputProps('anneeBudgetaire')}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <NumberInput
                          label="Tarif HT (€)"
                          description="Prix hors taxes"
                          placeholder="Ex: 500"
                          min={0}
                          decimalScale={2}
                          {...form.getInputProps('tarifHT')}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <NumberInput
                          label="Tarif TTC (€)"
                          description="Prix TTC (utilisé en priorité pour le budget)"
                          placeholder="Ex: 600"
                          min={0}
                          decimalScale={2}
                          {...form.getInputProps('tarifTTC')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Paper>

                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <FileText size={20} />
                      <Text fw={600}>Commentaire</Text>
                    </Group>

                    <Textarea
                      label="Commentaire"
                      description="Remarques ou observations sur la session"
                      placeholder="Ajouter un commentaire sur la session..."
                      rows={4}
                      {...form.getInputProps('commentaire')}
                    />
                  </Paper>
                </>
              )}

              {/* Champs SESSION COLLECTIVE */}
              {session.type === 'collective' && (
                <>
                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <FileText size={20} />
                      <Text fw={600}>Informations de la session</Text>
                    </Group>

                    <Stack gap="md">
                      <TextInput
                        label="Titre de la session"
                        placeholder="Ex: Formation React - Session Printemps 2024"
                        {...form.getInputProps('titre')}
                      />

                      <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="Lieu"
                            placeholder="Ex: Salle de formation A, Paris"
                            leftSection={<MapPin size={16} />}
                            {...form.getInputProps('lieu')}
                          />
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Select
                            label="Modalité"
                            data={[
                              { value: 'presentiel', label: 'Présentiel' },
                              { value: 'distanciel', label: 'Distanciel' },
                              { value: 'hybride', label: 'Hybride' },
                            ]}
                            {...form.getInputProps('modalite')}
                          />
                        </Grid.Col>
                      </Grid>

                      <NumberInput
                        label="Durée (heures)"
                        placeholder="Par pas de 0.5 (ex: 1.5, 2, 2.5)"
                        min={0}
                        step={0.5}
                        decimalScale={1}
                        leftSection={<Clock size={16} />}
                        {...form.getInputProps('dureePrevueHeures')}
                      />

                    </Stack>
                  </Paper>

                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <User size={20} />
                      <Text fw={600}>Formateur</Text>
                    </Group>

                    <Stack gap="md">
                      <TextInput
                        label="Nom du formateur"
                        placeholder="Nom complet du formateur"
                        {...form.getInputProps('formateurNom')}
                      />

                      <TextInput
                        label="Contact du formateur"
                        placeholder="Email ou téléphone"
                        {...form.getInputProps('formateurContact')}
                      />

                      <TextInput
                        label="Lien visio"
                        placeholder="https://meet.google.com/..."
                        description="Pour les sessions distancielles ou hybrides"
                        {...form.getInputProps('lienVisio')}
                      />
                    </Stack>
                  </Paper>

                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <FileText size={20} />
                      <Text fw={600}>Tarifs et budget</Text>
                    </Group>

                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <NumberInput
                          label="Tarif unitaire HT (€)"
                          placeholder="Ex: 500"
                          description="Prix par participant"
                          min={0}
                          decimalScale={2}
                          {...form.getInputProps('tarifUnitaireHT')}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <NumberInput
                          label="Tarif total HT (€)"
                          placeholder="Ex: 7500"
                          description="Prix total de la session"
                          min={0}
                          decimalScale={2}
                          {...form.getInputProps('tarifTotalHT')}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <NumberInput
                          label="Année budgétaire"
                          placeholder="Ex: 2024"
                          min={2000}
                          max={2100}
                          leftSection={<Calendar size={16} />}
                          {...form.getInputProps('anneeBudgetaire')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Paper>

                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <FileText size={20} />
                      <Text fw={600}>Description</Text>
                    </Group>

                    <Textarea
                      label="Description de la session"
                      placeholder="Description détaillée de la session collective..."
                      rows={4}
                      {...form.getInputProps('description')}
                    />
                  </Paper>
                </>
              )}

              {/* Actions */}
              <Group justify="space-between">
                <Button 
                  variant="subtle" 
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  loading={isSubmitting}
                  leftSection={<FloppyDisk size={16} />}
                  size="md"
                >
                  Enregistrer les modifications
                </Button>
              </Group>
            </Stack>
          </form>
        </Grid.Col>
      </Grid>

      {/* Remplacement du collaborateur : action séparée du formulaire, avec
          confirmation explicite (elle réaffecte la formation et annule les
          évaluations non répondues envoyées à l'ancien titulaire). */}
      <Modal
        opened={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        title="Remplacer le collaborateur"
        centered
      >
        <Stack gap="md">
          <Alert color="orange" icon={<Warning size={16} />}>
            La session sera réaffectée. Les évaluations déjà envoyées à{' '}
            <strong>
              {session?.collaborateur?.prenom} {session?.collaborateur?.nom}
            </strong>{' '}
            et non encore répondues seront annulées.
          </Alert>

          <Select
            label="Nouveau collaborateur"
            placeholder="Rechercher par nom, prénom ou matricule"
            searchable
            data={replacementOptions}
            value={replacementId}
            onChange={setReplacementId}
            searchValue={replacementSearch}
            onSearchChange={setReplacementSearch}
            nothingFoundMessage={
              replacementSearch.trim().length < 2
                ? 'Saisissez au moins 2 caractères'
                : 'Aucun collaborateur trouvé'
            }
            required
          />

          <TextInput
            label="Motif (optionnel)"
            placeholder="Ex : absence pour arrêt maladie"
            value={replacementMotif}
            onChange={(e) => setReplacementMotif(e.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowReplaceModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleReplaceCollaborateur}
              loading={isReplacing}
              disabled={!replacementId}
            >
              Confirmer le remplacement
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}