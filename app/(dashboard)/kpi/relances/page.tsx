'use client';

/**
 * Historique des relances de formations obligatoires.
 *
 * Les envois étaient tracés dans `ReminderLog` depuis toujours, mais AUCUNE
 * page ne lisait `GET /notifications/reminder-history` : la RH ne savait donc
 * pas qui avait déjà été relancé, ni quand. Cette page est la lecture de cette
 * table — elle n'envoie jamais rien.
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Group,
  LoadingOverlay,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { notificationsService } from '@/lib/services';
import type { ReminderHistoryEntry } from '@/lib/services';

/** Libellés des périmètres de campagne, alignés sur /kpi/conformite. */
const LIBELLES_TYPE: Record<string, string> = {
  annuelle: 'Obligatoires annuelles',
  onboarding: 'Onboarding',
  securite: 'Sécurité au travail',
};

const COULEURS_TYPE: Record<string, string> = {
  annuelle: 'blue',
  onboarding: 'grape',
  securite: 'orange',
};

function formatDateHeure(valeur: string): string {
  const date = new Date(valeur);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoriqueRelancesPage() {
  const [relances, setRelances] = useState<ReminderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtres : le type et la plage de dates sont appliqués côté serveur,
  // le statut côté client (la colonne n'est pas filtrable par l'API).
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  // Mantine 8 : DatePickerInput rend des chaines 'YYYY-MM-DD', pas des Date.
  const [plage, setPlage] = useState<[string | null, string | null]>([null, null]);

  const [lignesDepliees, setLignesDepliees] = useState<number[]>([]);

  const chargerHistorique = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const [debut, fin] = plage;
      const data = await notificationsService.getReminderHistory({
        type: filtreType === 'tous' ? undefined : filtreType,
        startDate: debut ?? undefined,
        // Borne haute incluse : sans l'heure, une relance envoyée dans la
        // journée du dernier jour choisi serait exclue.
        endDate: fin ? `${fin}T23:59:59.999` : undefined,
        limit: 500,
      });
      setRelances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique des relances:", error);
      setErreur("Impossible de charger l'historique des relances.");
      notifications.show({
        title: 'Erreur',
        message: "Impossible de charger l'historique des relances",
        color: 'red',
        icon: <WarningCircle size={20} weight="fill" />,
      });
    } finally {
      setLoading(false);
    }
  }, [filtreType, plage]);

  useEffect(() => {
    chargerHistorique();
  }, [chargerHistorique]);

  const relancesFiltrees = useMemo(() => {
    if (filtreStatut === 'tous') return relances;
    return relances.filter((relance) => relance.statut === filtreStatut);
  }, [relances, filtreStatut]);

  const compteurs = useMemo(() => {
    const envoyees = relancesFiltrees.filter((r) => r.statut === 'envoye').length;
    const collaborateurs = relancesFiltrees.reduce(
      (somme, r) => somme + (r.collaborateurs?.length ?? 0),
      0,
    );
    return {
      total: relancesFiltrees.length,
      envoyees,
      erreurs: relancesFiltrees.length - envoyees,
      collaborateurs,
    };
  }, [relancesFiltrees]);

  const basculerLigne = (id: number) => {
    setLignesDepliees((prev) =>
      prev.includes(id) ? prev.filter((valeur) => valeur !== id) : [...prev, id],
    );
  };

  const reinitialiserFiltres = () => {
    setFiltreType('tous');
    setFiltreStatut('tous');
    setPlage([null, null]);
  };

  const filtresActifs =
    filtreType !== 'tous' || filtreStatut !== 'tous' || Boolean(plage[0]) || Boolean(plage[1]);

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Group gap="md">
          <ThemeIcon size="xl" radius="md" variant="light" color="red">
            <EnvelopeSimple size={28} weight="duotone" />
          </ThemeIcon>
          <div>
            <Title order={1}>Historique des relances</Title>
            <Text size="lg" c="dimmed" mt="xs">
              Qui a été relancé sur les formations obligatoires, quand, et avec quel
              résultat
            </Text>
          </div>
        </Group>
        <Button
          variant="light"
          leftSection={<ArrowClockwise size={16} weight="bold" />}
          onClick={chargerHistorique}
          loading={loading}
        >
          Actualiser
        </Button>
      </Group>

      {/* Filtres */}
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="lg">
        <Group gap="md" align="flex-end" wrap="wrap">
          <Select
            label="Type de campagne"
            data={[
              { value: 'tous', label: 'Tous les types' },
              { value: 'annuelle', label: LIBELLES_TYPE.annuelle },
              { value: 'onboarding', label: LIBELLES_TYPE.onboarding },
              { value: 'securite', label: LIBELLES_TYPE.securite },
            ]}
            value={filtreType}
            onChange={(valeur) => setFiltreType(valeur ?? 'tous')}
            w={220}
          />
          <Select
            label="Statut"
            data={[
              { value: 'tous', label: 'Tous les statuts' },
              { value: 'envoye', label: 'Envoyée' },
              { value: 'erreur', label: 'En erreur' },
            ]}
            value={filtreStatut}
            onChange={(valeur) => setFiltreStatut(valeur ?? 'tous')}
            w={180}
          />
          <DatePickerInput
            type="range"
            label="Période d'envoi"
            placeholder="Toutes les dates"
            value={plage}
            onChange={(valeur) => setPlage(valeur as [string | null, string | null])}
            locale="fr"
            valueFormat="DD/MM/YYYY"
            clearable
            w={260}
          />
          {filtresActifs && (
            <Button variant="subtle" color="gray" onClick={reinitialiserFiltres}>
              Réinitialiser
            </Button>
          )}
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          Les relances envoyées avant la mise en place de la traçabilité n&apos;ont ni
          type ni période : filtrer par type les exclut.
        </Text>
      </Paper>

      {/* Compteurs */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="lg">
        <Card shadow="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed">Relances affichées</Text>
          <Text fw={700} size="xl">{compteurs.total}</Text>
        </Card>
        <Card shadow="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed">Envoyées</Text>
          <Text fw={700} size="xl" c="teal">{compteurs.envoyees}</Text>
        </Card>
        <Card shadow="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed">En erreur</Text>
          <Text fw={700} size="xl" c={compteurs.erreurs > 0 ? 'red' : undefined}>
            {compteurs.erreurs}
          </Text>
        </Card>
        <Card shadow="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed">Collaborateurs concernés</Text>
          <Text fw={700} size="xl">{compteurs.collaborateurs}</Text>
        </Card>
      </SimpleGrid>

      <Card shadow="sm" radius="md" withBorder pos="relative">
        <LoadingOverlay visible={loading} zIndex={100} overlayProps={{ radius: 'md', blur: 2 }} />

        {erreur ? (
          <Alert color="red" variant="light" icon={<WarningCircle size={16} weight="fill" />}>
            <Stack gap="sm" align="flex-start">
              <Text size="sm">{erreur}</Text>
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<ArrowClockwise size={14} weight="bold" />}
                onClick={chargerHistorique}
              >
                Réessayer
              </Button>
            </Stack>
          </Alert>
        ) : relancesFiltrees.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm" py="xl">
              <ThemeIcon size={56} radius="xl" variant="light" color="gray">
                <EnvelopeSimple size={30} weight="duotone" />
              </ThemeIcon>
              <Text fw={600}>
                {filtresActifs
                  ? 'Aucune relance ne correspond aux filtres'
                  : 'Aucune relance envoyée pour le moment'}
              </Text>
              <Text size="sm" c="dimmed" ta="center" maw={520}>
                {filtresActifs
                  ? 'Élargissez la période ou retirez un filtre pour voir davantage de relances.'
                  : "Les relances envoyées depuis la page Conformité apparaîtront ici : destinataire, période, statut et collaborateurs concernés."}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={900}>
            <Table highlightOnHover striped verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={40} />
                  <Table.Th>Date d&apos;envoi</Table.Th>
                  <Table.Th>Destinataire</Table.Th>
                  <Table.Th>Type de campagne</Table.Th>
                  <Table.Th>Période</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th ta="right">Collaborateurs</Table.Th>
                  <Table.Th>Envoyé par</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {relancesFiltrees.map((relance) => {
                  const depliee = lignesDepliees.includes(relance.id);
                  const collaborateurs = relance.collaborateurs ?? [];
                  const formations = relance.formations ?? [];

                  return (
                    <Fragment key={relance.id}>
                      <Table.Tr
                        style={{ cursor: 'pointer' }}
                        onClick={() => basculerLigne(relance.id)}
                      >
                        <Table.Td>
                          <UnstyledButton
                            aria-label={depliee ? 'Masquer le détail' : 'Voir le détail'}
                          >
                            {depliee ? (
                              <CaretDown size={16} weight="bold" />
                            ) : (
                              <CaretRight size={16} weight="bold" />
                            )}
                          </UnstyledButton>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDateHeure(relance.dateEnvoi)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={0}>
                            <Text size="sm" fw={500}>
                              {relance.managerNom || 'Destinataire inconnu'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {relance.managerEmail || 'Aucune adresse'}
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          {relance.type ? (
                            <Badge
                              size="sm"
                              variant="light"
                              color={COULEURS_TYPE[relance.type] ?? 'gray'}
                            >
                              {LIBELLES_TYPE[relance.type] ?? relance.type}
                            </Badge>
                          ) : (
                            <Text size="xs" c="dimmed">Non renseigné</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{relance.periode || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          {relance.statut === 'envoye' ? (
                            <Badge
                              size="sm"
                              color="green"
                              variant="light"
                              leftSection={<CheckCircle size={12} weight="fill" />}
                            >
                              Envoyée
                            </Badge>
                          ) : (
                            <Tooltip
                              label={relance.erreurMessage || 'Échec inconnu'}
                              multiline
                              w={300}
                              withArrow
                            >
                              <Badge
                                size="sm"
                                color="red"
                                variant="light"
                                leftSection={<WarningCircle size={12} weight="fill" />}
                              >
                                En erreur
                              </Badge>
                            </Tooltip>
                          )}
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="sm" fw={500}>{collaborateurs.length}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c={relance.envoyePar ? undefined : 'dimmed'}>
                            {relance.envoyePar || 'Non renseigné'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>

                      {depliee && (
                        <Table.Tr>
                          <Table.Td colSpan={8} style={{ padding: 0 }}>
                            <Box p="md" bg="var(--mantine-color-default-hover)">
                              <Stack gap="sm">
                                {relance.statut !== 'envoye' && relance.erreurMessage && (
                                  <Alert
                                    color="red"
                                    variant="light"
                                    icon={<WarningCircle size={16} weight="fill" />}
                                  >
                                    <Text size="sm">{relance.erreurMessage}</Text>
                                  </Alert>
                                )}

                                <Text size="sm" fw={600}>
                                  Collaborateurs concernés ({collaborateurs.length}) —{' '}
                                  {formations.length} formation(s) manquante(s)
                                </Text>

                                {collaborateurs.length === 0 ? (
                                  <Text size="sm" c="dimmed">
                                    Aucun collaborateur enregistré sur cette relance.
                                  </Text>
                                ) : (
                                  <Stack gap="xs">
                                    {collaborateurs.map((collaborateur, index) => (
                                      <Paper
                                        key={`${relance.id}-${collaborateur.nom}-${index}`}
                                        withBorder
                                        p="sm"
                                        radius="md"
                                      >
                                        <Stack gap={6}>
                                          <Text size="sm" fw={500}>{collaborateur.nom}</Text>
                                          <Group gap={4}>
                                            {(collaborateur.formations ?? []).length === 0 ? (
                                              <Text size="xs" c="dimmed">
                                                Aucune formation détaillée
                                              </Text>
                                            ) : (
                                              collaborateur.formations.map((formation, rang) => (
                                                <Badge
                                                  key={`${formation}-${rang}`}
                                                  size="xs"
                                                  variant="light"
                                                  color="red"
                                                >
                                                  {formation}
                                                </Badge>
                                              ))
                                            )}
                                          </Group>
                                        </Stack>
                                      </Paper>
                                    ))}
                                  </Stack>
                                )}
                              </Stack>
                            </Box>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Fragment>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </Container>
  );
}
