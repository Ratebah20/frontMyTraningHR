'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Paper,
  Stack,
  Breadcrumbs,
  Anchor,
  Card,
  SimpleGrid,
  Center,
  Loader,
  Tooltip,
  Menu,
  Avatar,
  Checkbox,
  Affix,
  Transition,
  Alert,
  Switch,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import { UserCircle } from '@phosphor-icons/react/dist/ssr/UserCircle';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { TreeStructure } from '@phosphor-icons/react/dist/ssr/TreeStructure';
import { ArrowsLeftRight } from '@phosphor-icons/react/dist/ssr/ArrowsLeftRight';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { departementsService } from '@/lib/services';
import { DepartementDetail, Collaborateur } from '@/lib/types';
import { DepartementFormModal } from '@/components/departements/DepartementFormModal';
import { DepartementBreadcrumb } from '@/components/departements/DepartementBreadcrumb';
import { TypeBadge } from '@/components/departements/TypeBadge';
import { ChangeEquipeModal } from '@/components/collaborateurs/ChangeEquipeModal';
import { DeleteDepartementModal } from '@/components/departements/DeleteDepartementModal';

export default function DepartementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const departementId = parseInt(params.id as string);

  // États
  const [departement, setDepartement] = useState<DepartementDetail | null>(null);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingEquipe, setIsCreatingEquipe] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  // Type imposé à l'ouverture du formulaire : sert au parcours « transformer ce
  // département en équipe », qui doit ouvrir le formulaire déjà positionné sur
  // « Équipe » (sinon le bouton ne tient pas sa promesse).
  const [typeInitialEdition, setTypeInitialEdition] = useState<'EQUIPE' | undefined>(undefined);
  // Afficher les personnes sorties des effectifs.
  //
  // La page chargeait `getCollaborateurs(id, false)` : sur un département dont
  // tous les rattachés sont partis (cas « Marketing devenu une équipe »), les
  // cartes annonçaient « 4 collaborateurs / 0 actif » et la table était VIDE —
  // impossible de sélectionner les 4 personnes pour les réaffecter, alors que
  // la suppression restait bloquée à cause d'elles.
  const [showInactive, setShowInactive] = useState(false);

  // États pour la sélection multiple et le changement d'équipe
  const [selectedCollaborateurs, setSelectedCollaborateurs] = useState<number[]>([]);
  const [changeEquipeModalOpened, setChangeEquipeModalOpened] = useState(false);
  const [collaborateursToMove, setCollaborateursToMove] = useState<{ id: number; nomComplet: string }[]>([]);

  // `collaborateurs` porte TOUJOURS l'effectif complet (actifs + inactifs) :
  // l'interrupteur ne fait que filtrer l'affichage, sans nouvel aller-retour.
  const collaborateursAffiches = showInactive
    ? collaborateurs
    : collaborateurs.filter(c => c.actif);
  const nombreInactifs = collaborateurs.filter(c => !c.actif).length;

  // Gestion de la sélection
  const isAllSelected =
    collaborateursAffiches.length > 0 &&
    selectedCollaborateurs.length === collaborateursAffiches.length;
  const isSomeSelected =
    selectedCollaborateurs.length > 0 &&
    selectedCollaborateurs.length < collaborateursAffiches.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCollaborateurs([]);
    } else {
      setSelectedCollaborateurs(collaborateursAffiches.map(c => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedCollaborateurs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Ouvrir la modale pour un seul collaborateur
  const openChangeEquipeForOne = (collab: Collaborateur) => {
    setCollaborateursToMove([{ id: collab.id, nomComplet: collab.nomComplet }]);
    setChangeEquipeModalOpened(true);
  };

  // Ouvrir la modale pour les collaborateurs sélectionnés
  const openChangeEquipeForSelected = () => {
    const selected = collaborateursAffiches
      .filter(c => selectedCollaborateurs.includes(c.id))
      .map(c => ({ id: c.id, nomComplet: c.nomComplet }));
    setCollaborateursToMove(selected);
    setChangeEquipeModalOpened(true);
  };

  // Callback après changement d'équipe réussi
  const handleChangeEquipeSuccess = () => {
    setSelectedCollaborateurs([]);
    loadData();
  };

  // Transformer ce département en ÉQUIPE rattachée à un parent : les
  // collaborateurs restent en place et leurs KPI remontent au département
  // parent (cf. T41). Le formulaire s'ouvre déjà positionné sur « Équipe ».
  const transformerEnEquipe = () => {
    setIsCreatingEquipe(false);
    setTypeInitialEdition('EQUIPE');
    setModalOpened(true);
  };

  // Charger les données
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptData, collabsData] = await Promise.all([
        departementsService.getById(departementId),
        // includeInactive = true : la table doit pouvoir montrer les personnes
        // parties, ce sont elles qui bloquent la suppression du département.
        departementsService.getCollaborateurs(departementId, true),
      ]);
      setDepartement(deptData);
      setCollaborateurs(collabsData);
      // Aucun actif mais des rattachés : on ouvre l'interrupteur d'office,
      // sinon la RH tombe sur une table vide face à un compteur qui affiche 4.
      const aDesActifs = collabsData.some(c => c.actif);
      if (!aDesActifs && collabsData.length > 0) {
        setShowInactive(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les données du département',
        color: 'red',
        icon: <Warning size={20} />,
      });
      router.push('/collaborateurs/departements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departementId]);

  // Soumettre le formulaire (création d'équipe ou édition)
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (isCreatingEquipe) {
        // Créer une nouvelle équipe sous ce département
        await departementsService.create(values);
        notifications.show({
          title: 'Succès',
          message: 'Équipe créée avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      } else {
        // Mettre à jour le département actuel
        await departementsService.update(departementId, values);
        notifications.show({
          title: 'Succès',
          message: 'Département mis à jour avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      }
      setModalOpened(false);
      setIsCreatingEquipe(false);
      setTypeInitialEdition(undefined);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      const message = error.response?.data?.message || error.message || 'Une erreur est survenue';
      notifications.show({
        title: 'Erreur',
        message,
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Center style={{ minHeight: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!departement) {
    return null;
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Breadcrumb et navigation */}
        <Group>
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => router.push('/collaborateurs/departements')}
          >
            <ArrowLeft size={20} />
          </ActionIcon>
          <DepartementBreadcrumb departementId={departementId} />
        </Group>

        {/* En-tête avec infos du département */}
        <Paper p="xl" withBorder>
          <Group justify="space-between" align="flex-start">
            <Group align="flex-start" gap="lg">
              {departement.type === 'EQUIPE' ? (
                <Users size={48} weight="duotone" className="text-green-500" />
              ) : (
                <Buildings size={48} weight="duotone" className="text-blue-500" />
              )}
              <div>
                <Group gap="sm" align="center">
                  <Title order={2}>{departement.nomDepartement}</Title>
                  <TypeBadge type={departement.type} />
                  <Badge color={departement.actif ? 'green' : 'gray'} variant="light" size="lg">
                    {departement.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </Group>
                {departement.codeDepartement && (
                  <Text c="dimmed" size="sm" mt={4}>
                    Code: {departement.codeDepartement}
                  </Text>
                )}
                {(departement as any).directeur?.nomComplet && (
                  <Text c="dimmed" size="sm" mt={4}>
                    Directeur: {(departement as any).directeur.nomComplet}
                  </Text>
                )}
                {departement.cheminComplet && (
                  <Text c="dimmed" size="sm" mt={4}>
                    Chemin: {departement.cheminComplet}
                  </Text>
                )}
              </div>
            </Group>

            {/*
              Ces deux actions n'existaient que sur la page LISTE : la RH, qui
              travaille depuis la fiche du département, n'y trouvait aucun moyen
              de le supprimer ni de le transformer en équipe.
            */}
            <Group>
              <Button
                leftSection={<PencilSimple size={18} />}
                variant="light"
                onClick={() => {
                  setIsCreatingEquipe(false);
                  setTypeInitialEdition(undefined);
                  setModalOpened(true);
                }}
              >
                Modifier
              </Button>
              <Button
                leftSection={<Plus size={18} />}
                color="green"
                onClick={() => {
                  setIsCreatingEquipe(true);
                  setModalOpened(true);
                }}
              >
                Ajouter une équipe
              </Button>
              {departement.type === 'DEPARTEMENT' && (
                <Button
                  leftSection={<Users size={18} />}
                  variant="light"
                  color="orange"
                  onClick={transformerEnEquipe}
                >
                  Transformer en équipe
                </Button>
              )}
              <Button
                leftSection={<Trash size={18} />}
                variant="light"
                color="red"
                onClick={() => setDeleteModalOpened(true)}
              >
                Supprimer
              </Button>
            </Group>
          </Group>
        </Paper>

        {/*
          Équipe sans parent : c'est exactement la configuration qui fausse les
          KPI (l'équipe apparaît comme une ligne isolée, ses collaborateurs ne
          remontent à aucun département). Le backend refuse désormais de créer
          cette situation, mais les données existantes peuvent la contenir.
        */}
        {departement.type === 'EQUIPE' && !departement.parentId && !departement.parent && (
          <Alert
            icon={<Warning size={18} />}
            color="orange"
            variant="light"
            title="Cette équipe n'est rattachée à aucun département"
          >
            <Stack gap="sm" align="flex-start">
              <Text size="sm">
                Une équipe doit être rattachée à un département : sans parent, elle
                apparaît isolée dans les KPI et ses {departement.nombreCollaborateurs}{' '}
                collaborateur(s) ne remontent à aucun département. Rattachez-la pour
                rétablir le calcul.
              </Text>
              <Button
                size="compact-sm"
                variant="light"
                color="orange"
                leftSection={<PencilSimple size={16} />}
                onClick={() => {
                  setIsCreatingEquipe(false);
                  setModalOpened(true);
                }}
              >
                Rattacher à un département
              </Button>
            </Stack>
          </Alert>
        )}

        {/* Statistiques */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Total collaborateurs
                </Text>
                <Text size="xl" fw={700} mt="xs">
                  {departement.nombreCollaborateurs}
                </Text>
              </div>
              <Users size={32} className="text-blue-500" weight="duotone" />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Collaborateurs actifs
                </Text>
                <Text size="xl" fw={700} mt="xs" c="green">
                  {departement.nombreCollaborateursActifs}
                </Text>
              </div>
              <CheckCircle size={32} className="text-green-500" weight="duotone" />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Collaborateurs inactifs
                </Text>
                <Text size="xl" fw={700} mt="xs" c="gray">
                  {departement.nombreCollaborateurs - departement.nombreCollaborateursActifs}
                </Text>
              </div>
              <XCircle size={32} className="text-gray-400" weight="duotone" />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Sous-{departement.type === 'EQUIPE' ? 'équipes' : 'départements'}
                </Text>
                <Text size="xl" fw={700} mt="xs" c="blue">
                  {departement.nombreSousDepartements || 0}
                </Text>
              </div>
              <TreeStructure size={32} className="text-blue-500" weight="duotone" />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Sous-départements/équipes */}
        {departement.sousDepartements && departement.sousDepartements.length > 0 && (
          <Paper withBorder>
            <Group p="md" justify="space-between">
              <Title order={3} size="h4">
                <Group gap="xs">
                  <TreeStructure size={24} />
                  Sous-{departement.type === 'EQUIPE' ? 'équipes' : 'départements'}
                </Group>
              </Title>
              <Text c="dimmed" size="sm">
                {departement.sousDepartements.length} élément(s)
              </Text>
            </Group>

            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nom</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th style={{ width: 80 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {departement.sousDepartements.map((subDept) => (
                  <Table.Tr key={subDept.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">
                        {subDept.nomDepartement}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <TypeBadge type={subDept.type} size="xs" />
                    </Table.Td>
                    <Table.Td>
                      <Badge color={subDept.actif ? 'green' : 'gray'} variant="light" size="sm">
                        {subDept.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Voir les détails">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => router.push(`/collaborateurs/departements/${subDept.id}`)}
                        >
                          <Eye size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}

        {/* Liste des collaborateurs */}
        <Paper withBorder>
          <Group p="md" justify="space-between">
            <Title order={3} size="h4">
              <Group gap="xs">
                <Users size={24} />
                Collaborateurs du département
              </Group>
            </Title>
            <Group gap="md">
              {nombreInactifs > 0 && (
                <Switch
                  size="sm"
                  checked={showInactive}
                  onChange={(event) => {
                    setShowInactive(event.currentTarget.checked);
                    setSelectedCollaborateurs([]);
                  }}
                  label={`Afficher les inactifs (${nombreInactifs})`}
                />
              )}
              <Text c="dimmed" size="sm">
                {collaborateursAffiches.length} collaborateur(s)
              </Text>
            </Group>
          </Group>

          {collaborateursAffiches.length === 0 ? (
            <Center p="xl">
              <Stack align="center" gap="md">
                <Users size={48} weight="thin" className="text-gray-400" />
                <Text c="dimmed">
                  {nombreInactifs > 0
                    ? `Aucun collaborateur actif — ${nombreInactifs} personne(s) sortie(s) des effectifs y sont encore rattachée(s).`
                    : 'Aucun collaborateur dans ce département'}
                </Text>
                {nombreInactifs > 0 && !showInactive && (
                  <Button variant="light" size="compact-sm" onClick={() => setShowInactive(true)}>
                    Afficher les inactifs
                  </Button>
                )}
              </Stack>
            </Center>
          ) : (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }}>
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={toggleSelectAll}
                      aria-label="Sélectionner tout"
                    />
                  </Table.Th>
                  <Table.Th>Collaborateur</Table.Th>
                  <Table.Th>Matricule</Table.Th>
                  <Table.Th>Manager</Table.Th>
                  <Table.Th>Formations</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {collaborateursAffiches.map((collab) => (
                  <Table.Tr
                    key={collab.id}
                    bg={selectedCollaborateurs.includes(collab.id) ? 'var(--mantine-color-blue-light)' : undefined}
                  >
                    <Table.Td>
                      <Checkbox
                        checked={selectedCollaborateurs.includes(collab.id)}
                        onChange={() => toggleSelect(collab.id)}
                        aria-label={`Sélectionner ${collab.nomComplet}`}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" color="blue">
                          <UserCircle size={20} />
                        </Avatar>
                        <div>
                          <Text fw={500} size="sm">
                            {collab.nomComplet}
                          </Text>
                          {collab.idExterne && (
                            <Text size="xs" c="dimmed">
                              {collab.idExterne}
                            </Text>
                          )}
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {collab.matricule || '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {collab.manager?.nomComplet || '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {collab.nombreFormations || 0}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Badge color={collab.actif ? 'green' : 'gray'} variant="light" size="sm">
                          {collab.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                        {collab.sortieProgrammee && (
                          <Badge color="orange" variant="light" size="xs">
                            Sortie prévue le{' '}
                            {new Date(collab.sortieProgrammee).toLocaleDateString('fr-FR')}
                          </Badge>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Voir le profil">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => router.push(`/collaborateurs/${collab.id}`)}
                          >
                            <Eye size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Menu shadow="md" width={200} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <DotsThreeVertical size={18} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<ArrowsLeftRight size={16} />}
                              onClick={() => openChangeEquipeForOne(collab)}
                            >
                              Changer d'équipe
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<Eye size={16} />}
                              onClick={() => router.push(`/collaborateurs/${collab.id}`)}
                            >
                              Voir le profil
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>

      {/* Modal d'édition/création */}
      <DepartementFormModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setIsCreatingEquipe(false);
          setTypeInitialEdition(undefined);
        }}
        onSubmit={handleSubmit}
        departement={isCreatingEquipe ? null : departement}
        isSubmitting={isSubmitting}
        initialType={isCreatingEquipe ? 'EQUIPE' : typeInitialEdition}
        initialParentId={isCreatingEquipe ? departementId : undefined}
      />

      {/* Modal de suppression (partagée avec la page liste) */}
      <DeleteDepartementModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        departement={departement}
        onDeleted={() => router.push('/collaborateurs/departements')}
        onTransformerEnEquipe={transformerEnEquipe}
      />

      {/* Modal de changement d'équipe */}
      <ChangeEquipeModal
        opened={changeEquipeModalOpened}
        onClose={() => setChangeEquipeModalOpened(false)}
        collaborateurs={collaborateursToMove}
        currentDepartementId={departementId}
        onSuccess={handleChangeEquipeSuccess}
      />

      {/* Barre d'actions flottante pour la sélection multiple */}
      <Affix position={{ bottom: 20, left: '50%' }} style={{ transform: 'translateX(-50%)' }}>
        <Transition transition="slide-up" mounted={selectedCollaborateurs.length > 0}>
          {(transitionStyles) => (
            <Paper
              shadow="lg"
              p="md"
              radius="lg"
              withBorder
              style={{
                ...transitionStyles,
                backgroundColor: 'var(--mantine-color-body)',
              }}
            >
              <Group gap="md">
                <Badge size="lg" variant="filled" color="blue">
                  {selectedCollaborateurs.length} sélectionné{selectedCollaborateurs.length > 1 ? 's' : ''}
                </Badge>
                <Button
                  leftSection={<ArrowsLeftRight size={18} />}
                  onClick={openChangeEquipeForSelected}
                >
                  Changer d'équipe
                </Button>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setSelectedCollaborateurs([])}
                  size="lg"
                >
                  <X size={18} />
                </ActionIcon>
              </Group>
            </Paper>
          )}
        </Transition>
      </Affix>
    </Container>
  );
}
