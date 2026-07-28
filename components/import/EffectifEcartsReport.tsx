'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Grid,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { UserMinus } from '@phosphor-icons/react/dist/ssr/UserMinus';
import { UserPlus } from '@phosphor-icons/react/dist/ssr/UserPlus';
import { UserCircle } from '@phosphor-icons/react/dist/ssr/UserCircle';
import { GitDiff } from '@phosphor-icons/react/dist/ssr/GitDiff';
import { effectifService } from '@/lib/services';
import {
  ActionEffectif,
  TypeEcartAttribut,
  type EffectifReconciliation,
} from '@/lib/types/effectif.types';

const LIBELLE_ECART: Record<TypeEcartAttribut, string> = {
  [TypeEcartAttribut.DEPARTEMENT]: 'Département',
  [TypeEcartAttribut.MANAGER]: 'Manager',
  [TypeEcartAttribut.WORKER_SUB_TYPE]: 'Type de contrat',
};

function formatDate(valeur?: string): string {
  if (!valeur) return '—';
  return new Date(valeur).toLocaleDateString('fr-FR');
}

function moisDepuis(valeur?: string): number | null {
  if (!valeur) return null;
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return null;
  const jours = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(jours / 30);
}

interface Props {
  analyse: EffectifReconciliation;
  /** Remonte l'analyse mise à jour après une désactivation / réactivation */
  onChange: (analyse: EffectifReconciliation) => void;
  /**
   * Après un import RH, les autres écarts viennent d'être corrigés par l'import :
   * seuls les collaborateurs absents du fichier restent à traiter.
   */
  fantomesUniquement?: boolean;
}

/**
 * Rapport d'écarts entre le fichier d'effectif RH et les collaborateurs
 * enregistrés, avec les actions de désactivation / réactivation.
 */
export function EffectifEcartsReport({
  analyse,
  onChange,
  fantomesUniquement = false,
}: Props) {
  const [isApplying, setIsApplying] = useState(false);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [afficherHorsPerimetre, setAfficherHorsPerimetre] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('fantomes');

  const fantomesAffiches = useMemo(
    () =>
      afficherHorsPerimetre
        ? analyse.fantomes
        : analyse.fantomes.filter((f) => !f.horsPerimetreRh),
    [analyse.fantomes, afficherHorsPerimetre],
  );

  const selectionnes = useMemo(
    () => fantomesAffiches.filter((f) => selection.has(f.collaborateurId)),
    [fantomesAffiches, selection],
  );

  const toggle = (id: number) => {
    setSelection((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(id)) {
        suivant.delete(id);
      } else {
        suivant.add(id);
      }
      return suivant;
    });
  };

  const toggleTout = () => {
    setSelection((precedent) => {
      const tousSelectionnes = fantomesAffiches.every((f) =>
        precedent.has(f.collaborateurId),
      );
      if (tousSelectionnes) return new Set();
      return new Set(fantomesAffiches.map((f) => f.collaborateurId));
    });
  };

  const handleDesactivation = async () => {
    if (selectionnes.length === 0) return;

    setIsApplying(true);
    try {
      const reponse = await effectifService.appliquer({
        reconciliationId: analyse.reconciliationId,
        action: ActionEffectif.DESACTIVER,
        collaborateurIds: selectionnes.map((f) => f.collaborateurId),
      });

      const traites = new Set(selectionnes.map((f) => f.collaborateurId));
      const restants = analyse.fantomes.filter(
        (f) => !traites.has(f.collaborateurId),
      );
      onChange({
        ...analyse,
        fantomes: restants,
        stats: {
          ...analyse.stats,
          nbFantomes: restants.length,
          nbFantomesPerimetreRh: restants.filter((f) => !f.horsPerimetreRh)
            .length,
          effectifBaseActif: analyse.stats.effectifBaseActif - reponse.nbTraites,
          ecart: analyse.stats.ecart - reponse.nbTraites,
        },
      });
      setSelection(new Set());

      notifications.show({
        title: 'Effectif mis à jour',
        message: `${reponse.nbTraites} collaborateur(s) désactivé(s). Leur historique de formation reste consultable.`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      reponse.avertissements.forEach((message) =>
        notifications.show({ title: 'À vérifier', message, color: 'yellow' }),
      );
    } catch (error: any) {
      notifications.show({
        title: 'Désactivation impossible',
        message:
          error.response?.data?.message || error.message || 'Erreur inattendue',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsApplying(false);
      setConfirmation(false);
    }
  };

  const handleReactivation = async () => {
    if (analyse.aReactiver.length === 0) return;

    setIsApplying(true);
    try {
      const reponse = await effectifService.appliquer({
        reconciliationId: analyse.reconciliationId,
        action: ActionEffectif.REACTIVER,
        collaborateurIds: analyse.aReactiver.map((c) => c.collaborateurId),
      });

      onChange({
        ...analyse,
        aReactiver: [],
        stats: {
          ...analyse.stats,
          nbAReactiver: 0,
          effectifBaseActif: analyse.stats.effectifBaseActif + reponse.nbTraites,
          ecart: analyse.stats.ecart + reponse.nbTraites,
        },
      });

      notifications.show({
        title: 'Collaborateurs réactivés',
        message: `${reponse.nbTraites} fiche(s) remise(s) en actif`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
    } catch (error: any) {
      notifications.show({
        title: 'Réactivation impossible',
        message:
          error.response?.data?.message || error.message || 'Erreur inattendue',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const tableauFantomes = (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Switch
          checked={afficherHorsPerimetre}
          onChange={(event) => {
            setAfficherHorsPerimetre(event.currentTarget.checked);
            setSelection(new Set());
          }}
          label={`Inclure les fiches hors périmètre RH (${
            analyse.fantomes.filter((f) => f.horsPerimetreRh).length
          })`}
        />
        <Button
          color="red"
          variant="light"
          leftSection={<UserMinus size={16} />}
          disabled={selectionnes.length === 0}
          onClick={() => setConfirmation(true)}
        >
          Désactiver la sélection ({selectionnes.length})
        </Button>
      </Group>

      <ScrollArea.Autosize mah={520}>
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40}>
                <Checkbox
                  aria-label="Tout sélectionner"
                  checked={
                    fantomesAffiches.length > 0 &&
                    selectionnes.length === fantomesAffiches.length
                  }
                  indeterminate={
                    selectionnes.length > 0 &&
                    selectionnes.length < fantomesAffiches.length
                  }
                  onChange={toggleTout}
                />
              </Table.Th>
              <Table.Th>Collaborateur</Table.Th>
              <Table.Th>Matricule</Table.Th>
              <Table.Th>Département</Table.Th>
              <Table.Th>Dernière formation</Table.Th>
              <Table.Th>Formations</Table.Th>
              <Table.Th>Signalements</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {fantomesAffiches.map((fantome) => {
              const mois = moisDepuis(fantome.derniereFormation);
              return (
                <Table.Tr key={fantome.collaborateurId}>
                  <Table.Td>
                    <Checkbox
                      aria-label={`Sélectionner ${fantome.nomComplet}`}
                      checked={selection.has(fantome.collaborateurId)}
                      onChange={() => toggle(fantome.collaborateurId)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {fantome.nomComplet}
                    </Text>
                    {fantome.workerSubType && (
                      <Text size="xs" c="dimmed">
                        {fantome.workerSubType}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{fantome.matricule || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{fantome.departement || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(fantome.derniereFormation)}</Text>
                    {mois !== null && (
                      <Text size="xs" c="dimmed">
                        il y a {mois} mois
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{fantome.nbFormations}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      {fantome.horsPerimetreRh && (
                        <Tooltip
                          multiline
                          w={260}
                          label="Fiche créée par un import OLU/manuel, jamais confirmée par un fichier RH : son absence ne prouve pas un départ"
                        >
                          <Badge color="gray" variant="light" size="sm">
                            Hors périmètre RH
                          </Badge>
                        </Tooltip>
                      )}
                      {fantome.compteActif && (
                        <Tooltip
                          multiline
                          w={260}
                          label="Un accès à l'application est rattaché à cette fiche (manager invité ou RH). Le désactiver se fait séparément, dans Comptes managers."
                        >
                          <Badge color="red" variant="light" size="sm">
                            Accès {fantome.compteRole || 'appli'}
                          </Badge>
                        </Tooltip>
                      )}
                      {fantome.nbSubordonnesActifs > 0 && (
                        <Tooltip label="Des collaborateurs actifs lui sont rattachés">
                          <Badge color="orange" variant="light" size="sm">
                            Manager de {fantome.nbSubordonnesActifs}
                          </Badge>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea.Autosize>
    </Stack>
  );

  const aucunEcart = (
    <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
      Aucun écart : tous les collaborateurs actifs figurent dans le fichier RH.
    </Alert>
  );

  return (
    <Stack gap="lg">
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder padding="md" radius="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Effectif fichier RH
            </Text>
            <Text size="xl" fw={700}>
              {analyse.stats.effectifFichier}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder padding="md" radius="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Actifs dans l&apos;application
            </Text>
            <Text size="xl" fw={700}>
              {analyse.stats.effectifBaseActif}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder padding="md" radius="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Écart
            </Text>
            <Text
              size="xl"
              fw={700}
              c={analyse.stats.ecart === 0 ? 'green' : 'orange'}
            >
              {analyse.stats.ecart > 0 ? '+' : ''}
              {analyse.stats.ecart}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder padding="md" radius="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Départs non répercutés
                </Text>
                <Text
                  size="xl"
                  fw={700}
                  c={analyse.stats.nbFantomesPerimetreRh > 0 ? 'red' : 'green'}
                >
                  {analyse.stats.nbFantomesPerimetreRh}
                </Text>
              </div>
              <ThemeIcon
                variant="light"
                color={analyse.stats.nbFantomesPerimetreRh > 0 ? 'red' : 'green'}
                radius="md"
                size="lg"
              >
                <UserMinus size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {analyse.avertissements.map((message, index) => (
        <Alert key={index} icon={<Warning size={16} />} color="yellow" variant="light">
          {message}
        </Alert>
      ))}

      {fantomesUniquement ? (
        analyse.fantomes.length === 0 ? (
          aucunEcart
        ) : (
          tableauFantomes
        )
      ) : (
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab
              value="fantomes"
              leftSection={<UserMinus size={16} />}
              rightSection={
                <Badge size="sm" variant="light" color="red" circle>
                  {analyse.fantomes.length}
                </Badge>
              }
            >
              Plus dans l&apos;effectif
            </Tabs.Tab>
            <Tabs.Tab
              value="reactiver"
              leftSection={<UserPlus size={16} />}
              rightSection={
                <Badge size="sm" variant="light" color="orange" circle>
                  {analyse.aReactiver.length}
                </Badge>
              }
            >
              À réactiver
            </Tabs.Tab>
            <Tabs.Tab
              value="absents"
              leftSection={<UserCircle size={16} />}
              rightSection={
                <Badge size="sm" variant="light" color="blue" circle>
                  {analyse.absentsBase.length}
                </Badge>
              }
            >
              Absents de l&apos;application
            </Tabs.Tab>
            <Tabs.Tab
              value="ecarts"
              leftSection={<GitDiff size={16} />}
              rightSection={
                <Badge size="sm" variant="light" color="grape" circle>
                  {analyse.ecartsAttributs.length}
                </Badge>
              }
            >
              Écarts de fiche
            </Tabs.Tab>
          </Tabs.List>

          {/* Actifs ici, absents du fichier RH */}
          <Tabs.Panel value="fantomes" pt="md">
            {analyse.fantomes.length === 0 ? aucunEcart : tableauFantomes}
          </Tabs.Panel>

          {/* Inactifs ici mais présents dans le fichier RH */}
          <Tabs.Panel value="reactiver" pt="md">
            {analyse.aReactiver.length === 0 ? (
              <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
                Aucun collaborateur du fichier RH n&apos;est inactif dans l&apos;application.
              </Alert>
            ) : (
              <Stack gap="md">
                <Group justify="flex-end">
                  <Button
                    color="green"
                    variant="light"
                    leftSection={<UserPlus size={16} />}
                    loading={isApplying}
                    onClick={handleReactivation}
                  >
                    Réactiver les {analyse.aReactiver.length} fiches
                  </Button>
                </Group>
                <ScrollArea.Autosize mah={520}>
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Collaborateur</Table.Th>
                        <Table.Th>Matricule</Table.Th>
                        <Table.Th>Département (fichier)</Table.Th>
                        <Table.Th>Désactivé le</Table.Th>
                        <Table.Th>Rapproché par</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {analyse.aReactiver.map((collab) => (
                        <Table.Tr key={collab.collaborateurId}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {collab.nomComplet}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{collab.matricule || '—'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{collab.departementFichier || '—'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatDate(collab.dateInactivation)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" size="sm">
                              {collab.rapprochePar}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea.Autosize>
              </Stack>
            )}
          </Tabs.Panel>

          {/* Présents dans le fichier RH, aucune fiche ici */}
          <Tabs.Panel value="absents" pt="md">
            {analyse.absentsBase.length === 0 ? (
              <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
                Tout l&apos;effectif RH dispose d&apos;une fiche dans l&apos;application.
              </Alert>
            ) : (
              <Stack gap="md">
                <Alert icon={<Info size={16} />} color="blue" variant="light">
                  Ces personnes figurent dans l&apos;effectif RH sans fiche ici. Lancez
                  l&apos;import RH des collaborateurs pour les créer.
                </Alert>
                <ScrollArea.Autosize mah={520}>
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Collaborateur</Table.Th>
                        <Table.Th>Matricule</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Département</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {analyse.absentsBase.map((collab) => (
                        <Table.Tr key={`${collab.matricule}-${collab.nomComplet}`}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {collab.nomComplet}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{collab.matricule || '—'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{collab.email || '—'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {collab.departement || collab.workerSubType || '—'}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea.Autosize>
              </Stack>
            )}
          </Tabs.Panel>

          {/* Fiches rapprochées mais divergentes */}
          <Tabs.Panel value="ecarts" pt="md">
            {analyse.ecartsAttributs.length === 0 ? (
              <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
                Aucun écart de département, de manager ou de type de contrat.
              </Alert>
            ) : (
              <ScrollArea.Autosize mah={520}>
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Collaborateur</Table.Th>
                      <Table.Th>Donnée</Table.Th>
                      <Table.Th>Dans l&apos;application</Table.Th>
                      <Table.Th>Dans le fichier RH</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {analyse.ecartsAttributs.map((ecart, index) => (
                      <Table.Tr key={`${ecart.collaborateurId}-${ecart.type}-${index}`}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {ecart.nomComplet}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {ecart.matricule || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" size="sm" color="grape">
                            {LIBELLE_ECART[ecart.type] || ecart.type}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{ecart.valeurBase || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{ecart.valeurFichier || '—'}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea.Autosize>
            )}
          </Tabs.Panel>
        </Tabs>
      )}

      <Modal
        opened={confirmation}
        onClose={() => setConfirmation(false)}
        title="Confirmer la désactivation"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {selectionnes.length} collaborateur(s) vont passer en inactif avec la date
            du jour comme date d&apos;inactivation. Les fiches et leur historique de
            formation sont conservés ; elles n&apos;apparaîtront plus dans l&apos;effectif
            actif ni dans les relances.
          </Text>
          {selectionnes.some((f) => f.compteActif) && (
            <Alert icon={<Warning size={16} />} color="orange" variant="light">
              Certains ont un accès à l&apos;application (manager ou RH) : il reste
              valide après cette désactivation, à révoquer dans Comptes managers.
            </Alert>
          )}
          {selectionnes.some((f) => f.nbSubordonnesActifs > 0) && (
            <Alert icon={<Warning size={16} />} color="orange" variant="light">
              Certains sont managers de collaborateurs actifs : leur rattachement devra
              être revu.
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmation(false)}>
              Annuler
            </Button>
            <Button color="red" loading={isApplying} onClick={handleDesactivation}>
              Désactiver
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
