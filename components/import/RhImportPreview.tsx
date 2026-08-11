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
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
  Tooltip,
} from '@mantine/core';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { UserPlus } from '@phosphor-icons/react/dist/ssr/UserPlus';
import { UserMinus } from '@phosphor-icons/react/dist/ssr/UserMinus';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import type { RhPreviewEtendu } from '@/lib/services/import.service';

interface Props {
  preview: RhPreviewEtendu;
  isImporting: boolean;
  /** Lance l'import réel avec les réactivations décochées en exclusion */
  onConfirm: (reactivationsExclues: number[]) => void;
  onCancel: () => void;
}

function formatDate(valeur?: string): string {
  if (!valeur) return '—';
  return new Date(valeur).toLocaleDateString('fr-FR');
}

function Tuile({
  libelle,
  valeur,
  couleur,
}: {
  libelle: string;
  valeur: number;
  couleur?: string;
}) {
  return (
    <Card withBorder padding="md" radius="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {libelle}
      </Text>
      <Text size="xl" fw={700} c={valeur > 0 ? couleur : undefined}>
        {valeur}
      </Text>
    </Card>
  );
}

function ListeChangements({
  changements,
}: {
  changements: { champ: string; avant?: string; apres?: string }[];
}) {
  return (
    <Stack gap={4}>
      {changements.map((c, i) => (
        <Group key={`${c.champ}-${i}`} gap={8} wrap="nowrap">
          <Text size="xs" fw={600} w={130} style={{ flexShrink: 0 }}>
            {c.champ}
          </Text>
          <Text size="xs" c="dimmed" td={c.avant ? 'line-through' : undefined}>
            {c.avant || '(vide)'}
          </Text>
          <ArrowRight size={12} />
          <Text size="xs" fw={500}>
            {c.apres || '(vide)'}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}

/**
 * Aperçu de l'import RH : montre exactement ce qui serait créé, réactivé et
 * modifié. Rien n'est écrit tant que l'utilisateur n'a pas validé, et chaque
 * réactivation peut être refusée individuellement.
 */
export function RhImportPreview({
  preview,
  isImporting,
  onConfirm,
  onCancel,
}: Props) {
  const [activeTab, setActiveTab] = useState<string | null>(
    preview.reactivations.length > 0 ? 'reactivations' : 'creations',
  );
  // Par défaut toutes les réactivations sont acceptées : décocher = laisser inactif
  const [reactivationsAcceptees, setReactivationsAcceptees] = useState<Set<number>>(
    () => new Set(preview.reactivations.map((r) => r.collaborateurId)),
  );

  const exclusions = useMemo(
    () =>
      preview.reactivations
        .map((r) => r.collaborateurId)
        .filter((id) => !reactivationsAcceptees.has(id)),
    [preview.reactivations, reactivationsAcceptees],
  );

  // Fiches créées par l'import OLU et jamais complétées : ce ne sont PAS des
  // départs. Les décocher laisserait des arrivants récents en inactif.
  const nbFichesIncompletes = useMemo(
    () =>
      preview.stats.nbFichesIncompletesOlu ??
      preview.reactivations.filter((r) => r.ficheIncompleteOlu).length,
    [preview.stats.nbFichesIncompletesOlu, preview.reactivations],
  );

  const exclusionsFichesIncompletes = useMemo(
    () =>
      preview.reactivations.filter(
        (r) => r.ficheIncompleteOlu && !reactivationsAcceptees.has(r.collaborateurId),
      ).length,
    [preview.reactivations, reactivationsAcceptees],
  );

  const toggleReactivation = (id: number) => {
    setReactivationsAcceptees((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(id)) {
        suivant.delete(id);
      } else {
        suivant.add(id);
      }
      return suivant;
    });
  };

  const toutBasculer = () => {
    setReactivationsAcceptees((precedent) =>
      precedent.size === preview.reactivations.length
        ? new Set()
        : new Set(preview.reactivations.map((r) => r.collaborateurId)),
    );
  };

  const aucunChangement =
    preview.stats.nbCreations === 0 &&
    preview.stats.nbReactivations === 0 &&
    preview.stats.nbModifications === 0;

  return (
    <Stack gap="lg">
      <Alert icon={<Info size={16} />} color="blue" variant="light">
        <Text fw={600} mb={4}>
          Aperçu — aucune donnée n&apos;est encore modifiée
        </Text>
        <Text size="sm">
          Fichier <Text span fw={600}>{preview.nomFichier}</Text> :{' '}
          {preview.stats.lignesFichier} ligne(s) exploitables, comparées aux{' '}
          {preview.stats.effectifBaseActif} collaborateurs actifs de l&apos;application.
          {preview.stats.nbInchanges > 0 &&
            ` ${preview.stats.nbInchanges} fiche(s) sont déjà à jour.`}
        </Text>
      </Alert>

      {/* Le backend peut renvoyer plusieurs avertissements distincts : tous affichés */}
      {(preview.avertissements ?? []).map((message, index) => (
        <Alert key={index} icon={<Warning size={16} />} color="yellow" variant="light">
          {message}
        </Alert>
      ))}

      <Grid>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Tuile libelle="Créations" valeur={preview.stats.nbCreations} couleur="green" />
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Tuile
            libelle="Réactivations"
            valeur={preview.stats.nbReactivations}
            couleur="orange"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Tuile
            libelle="Modifications"
            valeur={preview.stats.nbModifications}
            couleur="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Tuile
            libelle="Départs potentiels"
            valeur={preview.stats.nbDepartsPotentiels}
            couleur="red"
          />
        </Grid.Col>
        {nbFichesIncompletes > 0 && (
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Tuile
              libelle="Fiches à compléter"
              valeur={nbFichesIncompletes}
              couleur="cyan"
            />
          </Grid.Col>
        )}
      </Grid>

      {aucunChangement && (
        <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
          Ce fichier n&apos;apporte aucun changement : toutes les fiches sont déjà
          conformes.
        </Alert>
      )}

      {preview.departementsACreer.length > 0 && (
        <Alert icon={<Info size={16} />} color="grape" variant="light">
          <Text size="sm" fw={600} mb={4}>
            {preview.departementsACreer.length} département(s) seraient créés
          </Text>
          <Group gap={6}>
            {preview.departementsACreer.map((d) => (
              <Badge key={d} variant="light" color="grape" size="sm">
                {d}
              </Badge>
            ))}
          </Group>
        </Alert>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab
            value="reactivations"
            leftSection={<ArrowCounterClockwise size={16} />}
            rightSection={
              <Badge size="sm" variant="light" color="orange" circle>
                {preview.reactivations.length}
              </Badge>
            }
          >
            Réactivations
          </Tabs.Tab>
          <Tabs.Tab
            value="creations"
            leftSection={<UserPlus size={16} />}
            rightSection={
              <Badge size="sm" variant="light" color="green" circle>
                {preview.creations.length}
              </Badge>
            }
          >
            Créations
          </Tabs.Tab>
          <Tabs.Tab
            value="modifications"
            leftSection={<PencilSimple size={16} />}
            rightSection={
              <Badge size="sm" variant="light" color="blue" circle>
                {preview.modifications.length}
              </Badge>
            }
          >
            Modifications
          </Tabs.Tab>
          <Tabs.Tab
            value="departs"
            leftSection={<UserMinus size={16} />}
            rightSection={
              <Badge size="sm" variant="light" color="red" circle>
                {preview.departsPotentiels.length}
              </Badge>
            }
          >
            Départs potentiels
          </Tabs.Tab>
        </Tabs.List>

        {/* Réactivations : le point sensible, décochables une par une */}
        <Tabs.Panel value="reactivations" pt="md">
          {preview.reactivations.length === 0 ? (
            <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
              Aucune fiche inactive ne serait réactivée par ce fichier.
            </Alert>
          ) : (
            <Stack gap="md">
              <Alert icon={<Warning size={16} />} color="orange" variant="light">
                <Text size="sm">
                  Ces fiches sont <Text span fw={600}>inactives</Text> et le fichier les
                  remettrait en actif. Si le fichier est ancien, ce sont des personnes
                  déjà parties : <Text span fw={600}>décochez-les</Text> pour qu&apos;elles
                  restent inactives.
                </Text>
                {nbFichesIncompletes > 0 && (
                  <Text size="sm" mt={6}>
                    Attention : les lignes marquées{' '}
                    <Text span fw={600}>Fiche à compléter</Text> ne sont pas des départs,
                    ne les décochez pas.
                  </Text>
                )}
              </Alert>

              {nbFichesIncompletes > 0 && (
                <Alert icon={<Info size={16} />} color="cyan" variant="light">
                  <Text size="sm" fw={600} mb={4}>
                    {nbFichesIncompletes} fiche(s) incomplète(s) issue(s) de l&apos;import
                    OLU
                  </Text>
                  <Text size="sm">
                    Ces collaborateurs ont été créés automatiquement par un import OLU sans
                    leurs informations RH : ce sont le plus souvent des{' '}
                    <Text span fw={600}>arrivants récents</Text>, pas des départs. Le
                    fichier RH complète leur fiche et les remet actifs.{' '}
                    <Text span fw={600}>Laissez-les cochées</Text> : les décocher les
                    laisserait inactifs et hors des statistiques.
                  </Text>
                </Alert>
              )}

              {exclusionsFichesIncompletes > 0 && (
                <Alert icon={<Warning size={16} />} color="red" variant="light">
                  <Text size="sm">
                    Vous excluez {exclusionsFichesIncompletes} fiche(s) à compléter :
                    ces arrivants resteront <Text span fw={600}>inactifs</Text> et leur
                    fiche restera incomplète.
                  </Text>
                </Alert>
              )}

              <Group justify="space-between">
                <Button variant="subtle" size="xs" onClick={toutBasculer}>
                  {reactivationsAcceptees.size === preview.reactivations.length
                    ? 'Tout décocher'
                    : 'Tout cocher'}
                </Button>
                {exclusions.length > 0 && (
                  <Text size="sm" c="dimmed">
                    {exclusions.length} fiche(s) resteront inactives
                  </Text>
                )}
              </Group>

              <ScrollArea.Autosize mah={420}>
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={40}>
                        <Checkbox
                          aria-label="Tout réactiver"
                          checked={
                            reactivationsAcceptees.size === preview.reactivations.length
                          }
                          indeterminate={
                            reactivationsAcceptees.size > 0 &&
                            reactivationsAcceptees.size < preview.reactivations.length
                          }
                          onChange={toutBasculer}
                        />
                      </Table.Th>
                      <Table.Th>Collaborateur</Table.Th>
                      <Table.Th>Nature</Table.Th>
                      <Table.Th>Matricule</Table.Th>
                      <Table.Th>Désactivé le</Table.Th>
                      <Table.Th>Formations</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {preview.reactivations.map((r) => (
                      <Table.Tr key={r.collaborateurId}>
                        <Table.Td>
                          <Checkbox
                            aria-label={`Réactiver ${r.nomComplet}`}
                            checked={reactivationsAcceptees.has(r.collaborateurId)}
                            onChange={() => toggleReactivation(r.collaborateurId)}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {r.nomComplet}
                          </Text>
                          {!reactivationsAcceptees.has(r.collaborateurId) && (
                            <Text
                              size="xs"
                              c={r.ficheIncompleteOlu ? 'red' : 'dimmed'}
                              fw={r.ficheIncompleteOlu ? 600 : undefined}
                            >
                              {r.ficheIncompleteOlu
                                ? 'restera inactif alors que sa fiche est incomplète'
                                : 'restera inactif'}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {r.ficheIncompleteOlu ? (
                            <Tooltip
                              multiline
                              w={280}
                              label="Fiche créée par un import OLU et jamais complétée : ce n'est pas un départ. La laisser cochée complète ses informations RH et la remet active."
                            >
                              <Badge size="sm" variant="light" color="cyan">
                                Fiche à compléter
                              </Badge>
                            </Tooltip>
                          ) : r.dateInactivation ? (
                            <Tooltip
                              multiline
                              w={280}
                              label="Fiche désactivée à une date connue : vérifiez qu'il ne s'agit pas d'un départ réel avant de la réactiver."
                            >
                              <Badge size="sm" variant="light" color="orange">
                                Départ enregistré
                              </Badge>
                            </Tooltip>
                          ) : (
                            <Text size="xs" c="dimmed">
                              {r.sourceImport ? `Source ${r.sourceImport}` : '—'}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{r.matricule || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(r.dateInactivation)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{r.nbFormations}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea.Autosize>
            </Stack>
          )}
        </Tabs.Panel>

        {/* Créations */}
        <Tabs.Panel value="creations" pt="md">
          {preview.creations.length === 0 ? (
            <Alert icon={<Info size={16} />} color="blue" variant="light">
              Aucun nouveau collaborateur dans ce fichier.
            </Alert>
          ) : (
            <ScrollArea.Autosize mah={420}>
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur</Table.Th>
                    <Table.Th>Matricule</Table.Th>
                    <Table.Th>Département</Table.Th>
                    <Table.Th>Type de contrat</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {preview.creations.map((c) => (
                    <Table.Tr key={`${c.matricule}-${c.nomComplet}`}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {c.nomComplet}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{c.matricule}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{c.departement}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{c.workerSubType || '—'}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
          )}
        </Tabs.Panel>

        {/* Modifications champ par champ */}
        <Tabs.Panel value="modifications" pt="md">
          {preview.modifications.length === 0 ? (
            <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
              Aucune fiche existante ne serait modifiée.
            </Alert>
          ) : (
            <ScrollArea.Autosize mah={480}>
              <Table striped verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={260}>Collaborateur</Table.Th>
                    <Table.Th>Changements</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {preview.modifications.map((m) => (
                    <Table.Tr key={m.collaborateurId}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {m.nomComplet}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {m.matricule || 'sans matricule'}
                        </Text>
                        {m.rapprocheParNom && (
                          <Tooltip
                            multiline
                            w={240}
                            label="Fiche rapprochée par nom et prénom (stub OLU ou fiche incomplète)"
                          >
                            <Badge size="xs" variant="light" color="grape" mt={4}>
                              Rapprochée par nom
                            </Badge>
                          </Tooltip>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <ListeChangements changements={m.changements} />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
          )}
        </Tabs.Panel>

        {/* Départs potentiels : non touchés par l'import */}
        <Tabs.Panel value="departs" pt="md">
          <Stack gap="md">
            <Alert icon={<Info size={16} />} color="blue" variant="light">
              Ces collaborateurs sont actifs dans l&apos;application mais absents du
              fichier. <Text span fw={600}>L&apos;import ne les modifie pas</Text> — vous
              pourrez les désactiver depuis le rapport affiché après l&apos;import.
            </Alert>
            {preview.departsPotentiels.length === 0 ? (
              <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
                Tous les collaborateurs actifs figurent dans le fichier.
              </Alert>
            ) : (
              <ScrollArea.Autosize mah={420}>
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Collaborateur</Table.Th>
                      <Table.Th>Matricule</Table.Th>
                      <Table.Th>Département</Table.Th>
                      <Table.Th>Signalement</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {preview.departsPotentiels.map((d) => (
                      <Table.Tr key={d.collaborateurId}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {d.nomComplet}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{d.matricule || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{d.departement || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          {d.horsPerimetreRh && (
                            <Badge color="gray" variant="light" size="sm">
                              Hors périmètre RH
                            </Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea.Autosize>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel} disabled={isImporting}>
          Annuler
        </Button>
        <Button
          onClick={() => onConfirm(exclusions)}
          loading={isImporting}
          disabled={aucunChangement}
        >
          Valider l&apos;import
          {preview.stats.nbCreations + preview.stats.nbModifications > 0 &&
            ` (${
              preview.stats.nbCreations +
              preview.stats.nbModifications +
              (preview.stats.nbReactivations - exclusions.length)
            } fiches)`}
        </Button>
      </Group>
    </Stack>
  );
}
