'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Group,
  Flex,
  Select,
  Tabs,
  Table,
  Badge,
  Alert,
  Loader,
  Center,
  Paper,
  Stack,
  Button,
  ActionIcon,
  Tooltip,
  ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CurrencyEur } from '@phosphor-icons/react/dist/ssr/CurrencyEur';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { ChartPie } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import {
  budgetSimpleService,
  CoutsOrganismesResponse,
  CoutsFormationsResponse,
  CoutsPersonnesResponse,
  CoutCategorie,
} from '@/lib/services/budget-simple.service';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => {
  const year = (CURRENT_YEAR - i).toString();
  return { value: year, label: year };
});

export default function BudgetCoutsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR.toString());

  const [coutsOrganismes, setCoutsOrganismes] = useState<CoutsOrganismesResponse | null>(null);
  const [coutsFormations, setCoutsFormations] = useState<CoutsFormationsResponse | null>(null);
  const [coutsPersonnes, setCoutsPersonnes] = useState<CoutsPersonnesResponse | null>(null);
  const [coutsCategories, setCoutsCategories] = useState<CoutCategorie[] | null>(null);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const annee = parseInt(selectedYear);

      const [organismes, formations, personnes, categories] = await Promise.all([
        budgetSimpleService.getCoutsParOrganisme(annee).catch(() => null),
        budgetSimpleService.getCoutsParFormation(annee).catch(() => null),
        budgetSimpleService.getCoutsParPersonne(annee).catch(() => null),
        budgetSimpleService.getCoutsParCategorie(annee).catch(() => undefined),
      ]);

      setCoutsOrganismes(organismes);
      setCoutsFormations(formations);
      setCoutsPersonnes(personnes);
      // undefined = erreur backend (ex: budget annuel requis sur une ancienne version)
      setCategoriesError(categories === undefined);
      setCoutsCategories(categories ?? null);

      if (!organismes && !formations && !personnes) {
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de charger les coûts de formation',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    notifications.show({
      title: 'Actualisé',
      message: 'Les données ont été mises à jour',
      color: 'green',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyPrecis = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

  // Les trois vues renvoient désormais le MÊME total et la même couverture :
  // on prend la première disponible.
  const couverture = coutsOrganismes ?? coutsFormations ?? coutsPersonnes ?? null;
  const sessionsSansTarif = couverture?.sessionsSansTarif ?? 0;
  const coutTotal = couverture?.total ?? 0;
  const coutEstime = couverture?.coutEstime ?? 0;

  // Écart entre le total « toutes sessions » et la ventilation par catégorie,
  // qui n'inclut que les sessions individuelles côté backend.
  const totalCategories = (coutsCategories ?? []).reduce((s, c) => s + c.totalConsomme, 0);
  const ecartCategories = Math.round((coutTotal - totalCategories) * 100) / 100;

  const budgetAnnuel =
    coutsOrganismes?.budgetAnnuel ??
    coutsFormations?.budgetAnnuel ??
    coutsPersonnes?.budgetAnnuel ??
    null;

  if (loading) {
    return (
      <Center h={600}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="xl" py="lg">
      <Flex justify="space-between" align="center" mb="md">
        <div>
          <Group gap="sm">
            <Title order={2}>Suivi des coûts</Title>
            <Badge color="blue" variant="light" leftSection={<CurrencyEur size={12} />}>
              Montants HT
            </Badge>
          </Group>
          <Text c="dimmed" size="sm">
            Vue des coûts par organisme, formation, personne et catégorie
            {budgetAnnuel !== null && ` — Budget formation ${selectedYear} : ${formatCurrency(budgetAnnuel)}`}
          </Text>
        </div>
        <Group>
          <Select
            value={selectedYear}
            onChange={(value) => setSelectedYear(value || CURRENT_YEAR.toString())}
            data={YEAR_OPTIONS}
            style={{ width: 120 }}
          />
          <Tooltip label="Actualiser les données">
            <ActionIcon variant="light" size="lg" onClick={handleRefresh} loading={refreshing}>
              <ArrowsClockwise size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Flex>

      {/* Bandeau de couverture : ce que vaut la donnée affichée.
          Le repli sur le tarif de la formation est une ESTIMATION — l'annoncer
          évite de présenter une estimation comme un coût constaté à la Finance. */}
      <Alert icon={<Info size={20} />} color="blue" mb="xl">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <div>
            <Text size="sm" fw={600}>
              {formatCurrencyPrecis(coutTotal)}
              {coutEstime > 0 && ` dont ${formatCurrencyPrecis(coutEstime)} estimés`}
              {sessionsSansTarif > 0 &&
                ` · ${sessionsSansTarif} session${sessionsSansTarif > 1 ? 's' : ''} sans tarif`}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Coûts HT issus des tarifs saisis sur les sessions.
              {coutEstime > 0 &&
                ' La part « estimés » provient du tarif de référence de la formation, ' +
                  'à défaut de tarif sur la session.'}
              {sessionsSansTarif > 0
                ? ' Les sessions sans tarif ne sont pas comptées : le total est sous-estimé.'
                : ' Toutes les sessions concernées portent un tarif.'}
              {' '}Les e-learning internes (import OLU), sans coût direct, sont exclus de ce
              décompte.
            </Text>
          </div>
          {sessionsSansTarif > 0 && (
            <Button
              component={Link}
              href="/budget/analytics#formations-sans-tarif"
              size="xs"
              variant="light"
              leftSection={<Warning size={14} />}
              style={{ flexShrink: 0 }}
            >
              Compléter les tarifs manquants
            </Button>
          )}
        </Group>
      </Alert>

      <Tabs defaultValue="organismes">
        <Tabs.List mb="md">
          <Tabs.Tab value="organismes" leftSection={<Buildings size={16} />}>
            Par organisme
          </Tabs.Tab>
          <Tabs.Tab value="formations" leftSection={<BookOpen size={16} />}>
            Par formation
          </Tabs.Tab>
          <Tabs.Tab value="personnes" leftSection={<Users size={16} />}>
            Par personne
          </Tabs.Tab>
          <Tabs.Tab value="categories" leftSection={<ChartPie size={16} />}>
            Par catégorie
          </Tabs.Tab>
        </Tabs.List>

        {/* ===== Par organisme ===== */}
        <Tabs.Panel value="organismes">
          <Paper shadow="xs" p="md" radius="md" withBorder>
            {!coutsOrganismes || coutsOrganismes.organismes.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Aucune session terminée avec coût pour {selectedYear}
              </Text>
            ) : (
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Organisme</Table.Th>
                      <Table.Th ta="right">Sessions</Table.Th>
                      <Table.Th ta="right">Collaborateurs</Table.Th>
                      <Table.Th ta="right">Coût total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {coutsOrganismes.organismes.map((o) => (
                      <Table.Tr key={o.organismeId ?? 'none'}>
                        <Table.Td>
                          {o.organismeId === null ? (
                            <Text size="sm" c="dimmed" fs="italic">
                              {o.nomOrganisme}
                            </Text>
                          ) : (
                            o.nomOrganisme
                          )}
                        </Table.Td>
                        <Table.Td ta="right">{o.nbSessions}</Table.Td>
                        <Table.Td ta="right">{o.nbCollaborateurs}</Table.Td>
                        <Table.Td ta="right" fw={600}>
                          {formatCurrency(o.coutTotal)}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                  <Table.Tfoot>
                    <Table.Tr>
                      <Table.Th>Total</Table.Th>
                      <Table.Th ta="right">
                        {coutsOrganismes.organismes.reduce((s, o) => s + o.nbSessions, 0)}
                      </Table.Th>
                      <Table.Th ta="right">—</Table.Th>
                      <Table.Th ta="right">{formatCurrency(coutsOrganismes.total)}</Table.Th>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </ScrollArea>
            )}
          </Paper>
        </Tabs.Panel>

        {/* ===== Par formation ===== */}
        <Tabs.Panel value="formations">
          <Paper shadow="xs" p="md" radius="md" withBorder>
            {!coutsFormations || coutsFormations.formations.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Aucune session terminée avec coût pour {selectedYear}
              </Text>
            ) : (
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Formation</Table.Th>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Catégorie</Table.Th>
                      <Table.Th ta="right">Sessions</Table.Th>
                      <Table.Th ta="right">Participants</Table.Th>
                      <Table.Th ta="right">Coût total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {coutsFormations.formations.map((f) => (
                      <Table.Tr key={f.formationId}>
                        <Table.Td>{f.nomFormation}</Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {f.codeFormation}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" size="sm">
                            {f.categorie}
                          </Badge>
                        </Table.Td>
                        <Table.Td ta="right">{f.nbSessions}</Table.Td>
                        <Table.Td ta="right">{f.nbParticipants}</Table.Td>
                        <Table.Td ta="right" fw={600}>
                          {formatCurrency(f.coutTotal)}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                  <Table.Tfoot>
                    <Table.Tr>
                      <Table.Th>Total</Table.Th>
                      <Table.Th />
                      <Table.Th />
                      <Table.Th ta="right">
                        {coutsFormations.formations.reduce((s, f) => s + f.nbSessions, 0)}
                      </Table.Th>
                      <Table.Th ta="right">—</Table.Th>
                      <Table.Th ta="right">{formatCurrency(coutsFormations.total)}</Table.Th>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </ScrollArea>
            )}
          </Paper>
        </Tabs.Panel>

        {/* ===== Par personne ===== */}
        <Tabs.Panel value="personnes">
          <Paper shadow="xs" p="md" radius="md" withBorder>
            {!coutsPersonnes || coutsPersonnes.personnes.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Aucune session terminée avec coût pour {selectedYear}
              </Text>
            ) : (
              <Stack gap="sm">
                {coutsPersonnes.nbCollaborateurs > coutsPersonnes.personnes.length && (
                  <Text size="xs" c="dimmed">
                    {coutsPersonnes.personnes.length} collaborateurs affichés sur{' '}
                    {coutsPersonnes.nbCollaborateurs} — le total ci-dessous couvre l&apos;ensemble
                    des collaborateurs.
                  </Text>
                )}
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Collaborateur</Table.Th>
                        <Table.Th>Département</Table.Th>
                        <Table.Th ta="right">Formations</Table.Th>
                        <Table.Th ta="right">Heures</Table.Th>
                        <Table.Th ta="right">Coût total</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {coutsPersonnes.personnes.map((p) => (
                        <Table.Tr key={p.collaborateurId}>
                          <Table.Td>{p.nomComplet}</Table.Td>
                          <Table.Td>{p.departement}</Table.Td>
                          <Table.Td ta="right">{p.nbFormations}</Table.Td>
                          <Table.Td ta="right">{p.heures.toLocaleString('fr-FR')}</Table.Td>
                          <Table.Td ta="right" fw={600}>
                            {formatCurrency(p.coutTotal)}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                    <Table.Tfoot>
                      <Table.Tr>
                        <Table.Th>Total ({coutsPersonnes.nbCollaborateurs} collaborateurs)</Table.Th>
                        <Table.Th />
                        <Table.Th ta="right">—</Table.Th>
                        <Table.Th ta="right">—</Table.Th>
                        <Table.Th ta="right">{formatCurrency(coutsPersonnes.total)}</Table.Th>
                      </Table.Tr>
                    </Table.Tfoot>
                  </Table>
                </ScrollArea>
              </Stack>
            )}
          </Paper>
        </Tabs.Panel>

        {/* ===== Par catégorie ===== */}
        <Tabs.Panel value="categories">
          <Paper shadow="xs" p="md" radius="md" withBorder>
            {categoriesError ? (
              <Alert icon={<Warning size={20} />} color="orange">
                Impossible de charger l&apos;analyse par catégorie pour {selectedYear}. Vérifiez
                qu&apos;un budget annuel est saisi ou réessayez plus tard.
              </Alert>
            ) : !coutsCategories || coutsCategories.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Aucune session terminée avec coût pour {selectedYear}
              </Text>
            ) : (
              <Stack gap="sm">
                {/* La ventilation par catégorie ne couvre que les sessions
                    individuelles : sans ce rappel, ce total se lit comme une
                    contradiction avec les trois autres onglets. */}
                <Text size="xs" c="dimmed">
                  Sessions individuelles uniquement — les sessions collectives
                  {ecartCategories > 0 && ` (${formatCurrencyPrecis(ecartCategories)})`} ne sont
                  pas ventilées par catégorie et n&apos;apparaissent pas dans ce total.
                </Text>
                <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Catégorie</Table.Th>
                      <Table.Th ta="right">Sessions</Table.Th>
                      <Table.Th ta="right">Coût moyen</Table.Th>
                      <Table.Th ta="right">% du budget</Table.Th>
                      <Table.Th ta="right">Coût total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {[...coutsCategories]
                      .sort((a, b) => b.totalConsomme - a.totalConsomme)
                      .map((c) => (
                        <Table.Tr key={c.categorieId}>
                          <Table.Td>{c.categorieNom}</Table.Td>
                          <Table.Td ta="right">{c.nombreSessions}</Table.Td>
                          <Table.Td ta="right">{formatCurrency(c.coutMoyen)}</Table.Td>
                          <Table.Td ta="right">
                            {budgetAnnuel !== null ? `${c.pourcentageDuTotal}%` : '—'}
                          </Table.Td>
                          <Table.Td ta="right" fw={600}>
                            {formatCurrency(c.totalConsomme)}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                  <Table.Tfoot>
                    <Table.Tr>
                      <Table.Th>Total</Table.Th>
                      <Table.Th ta="right">
                        {coutsCategories.reduce((s, c) => s + c.nombreSessions, 0)}
                      </Table.Th>
                      <Table.Th ta="right">—</Table.Th>
                      <Table.Th ta="right">—</Table.Th>
                      <Table.Th ta="right">
                        {formatCurrency(coutsCategories.reduce((s, c) => s + c.totalConsomme, 0))}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
                </ScrollArea>
              </Stack>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
