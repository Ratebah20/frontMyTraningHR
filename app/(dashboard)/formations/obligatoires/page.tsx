'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Table,
  Badge,
  Group,
  TextInput,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Center,
  Loader,
  ActionIcon,
  Tooltip,
  Alert,
  Button,
  Tabs,
  Paper,
  Progress,
  Anchor,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Certificate } from '@phosphor-icons/react/dist/ssr/Certificate';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { UserPlus } from '@phosphor-icons/react/dist/ssr/UserPlus';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { Infinity as InfinityIcon } from '@phosphor-icons/react/dist/ssr/Infinity';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { formationsService, statsService, exportsService } from '@/lib/services';
import { PeriodSelector } from '@/components/PeriodSelector';
import { useUrlFilters, useUrlSearch } from '@/hooks/useUrlFilters';
import { Formation } from '@/lib/types';

// ===========================================================================
// Vue récapitulative des formations à obligation
// ===========================================================================
// La page ne listait que `estObligatoire = true` (3 formations) : les 13
// formations de SÉCURITÉ (`estSecurite`), qui ne sont PAS marquées obligatoires
// dans le catalogue, n'apparaissaient nulle part. Et comme les 3 obligatoires
// n'ont ni `obligatoireType` ni `obligatoireAnnee`, elles portaient toutes le
// badge « Annuelle » : rien ne distinguait à l'écran une obligation DATÉE d'une
// obligation INDÉFINIE, ce qui est justement la question de la RH.
//
// La page segmente donc explicitement le périmètre en quatre :
//   - Annuelles datées (YYYY)  : obligatoireAnnee renseignée
//   - Annuelles indéfinies     : obligatoireAnnee NULL -> dues chaque année
//   - Onboarding               : obligatoireType = 'onboarding'
//   - Sécurité (SST)           : estSecurite, périmètre distinct
// et croise chaque ligne avec le détail de conformité renvoyé par
// `GET /stats/mandatory-trainings-kpis` (3 appels, un par périmètre d'API).

type Segment = 'annuelles' | 'indefinies' | 'onboarding' | 'securite';
type MandatoryType = 'annuelle' | 'onboarding' | 'securite';

/** Périmètre d'API qui alimente chaque segment d'affichage. */
const TYPE_API: Record<Segment, MandatoryType> = {
  annuelles: 'annuelle',
  indefinies: 'annuelle',
  onboarding: 'onboarding',
  securite: 'securite',
};

const SEGMENTS: Segment[] = ['annuelles', 'indefinies', 'onboarding', 'securite'];

interface FormationConformite {
  id: number;
  codeFormation: string;
  nomFormation: string;
  categorie: string;
  collaborateursFormes: number;
  collaborateursNonFormes: number;
  tauxConformite: number;
  formes: Array<{ id: number; nomComplet: string; departement: string; dateFormation: string }>;
  nonFormes: Array<{ id: number; nomComplet: string; departement: string }>;
}

interface MandatoryKPIs {
  periode: { annee: number; mois?: number; libelle: string };
  stats: {
    totalFormations: number;
    totalCollaborateursAFormer: number;
    totalFormes: number;
    totalNonFormes: number;
    collaborateursEnConge?: number;
    // null = population vide ou périmètre sans formation : le taux n'a pas de sens
    tauxConformiteGlobal: number | null;
  };
  formations: FormationConformite[];
}

// ===== Période (même contrat d'URL que /kpi/conformite) =====

type PeriodeEtat = {
  periode: 'annee' | 'mois' | 'plage';
  date: string;
  dateDebut: Date | null;
  dateFin: Date | null;
};

const FORMAT_ANNEE = /^\d{4}$/;
const FORMAT_MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;
const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

const periodeParDefaut = (): PeriodeEtat => ({
  periode: 'annee',
  date: new Date().getFullYear().toString(),
  dateDebut: null,
  dateFin: null,
});

/**
 * `YYYY-MM-DD` -> Date en UTC minuit. L'heure UTC est indispensable : la page
 * resérialise ces dates avec `toISOString().split('T')[0]`, et un minuit LOCAL
 * (UTC+1/+2) reviendrait la veille.
 */
const parseJourUtc = (valeur: string | null): Date | null => {
  if (!valeur || !FORMAT_JOUR.test(valeur)) return null;
  const date = new Date(`${valeur}T00:00:00Z`);
  return isNaN(date.getTime()) ? null : date;
};

/** Date -> `YYYY-MM-DD` en composantes LOCALES (cf. commentaire de /kpi/conformite). */
const ecrireJour = (date: Date): string => {
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mois}-${jour}`;
};

const lirePeriodeDepuisUrl = (params: { get: (cle: string) => string | null }): PeriodeEtat => {
  const defaut = periodeParDefaut();
  const periode = params.get('periode');

  if (periode === 'annee') {
    const date = params.get('date');
    return date && FORMAT_ANNEE.test(date) ? { ...defaut, date } : defaut;
  }
  if (periode === 'mois') {
    const date = params.get('date');
    return date && FORMAT_MOIS.test(date)
      ? { periode: 'mois', date, dateDebut: null, dateFin: null }
      : defaut;
  }
  if (periode === 'plage') {
    const debut = parseJourUtc(params.get('startDate'));
    const fin = parseJourUtc(params.get('endDate'));
    // Les DEUX bornes sont exigées : une plage incomplète laisserait la page vide.
    if (!debut || !fin || debut.getTime() > fin.getTime()) return defaut;
    return { periode: 'plage', date: defaut.date, dateDebut: debut, dateFin: fin };
  }
  return defaut;
};

const estSegment = (valeur: string): valeur is Segment =>
  (SEGMENTS as string[]).includes(valeur);

const couleurTaux = (taux: number) => {
  if (taux >= 80) return 'green';
  if (taux >= 50) return 'orange';
  return 'red';
};

const formatTaux = (taux: number | null | undefined) =>
  taux === null || taux === undefined ? 'n/a' : `${taux.toString().replace('.', ',')} %`;

export default function FormationsObligatoiresPage() {
  const router = useRouter();

  // Période, onglet et recherche vivent dans l'URL : le bouton retour restitue
  // l'écran consulté et une vue filtrée devient partageable (même mécanique que
  // /sessions et /kpi/conformite).
  const { values: urlFilters, setValues: setUrlFilters } = useUrlFilters(
    '/formations/obligatoires',
    {
      periode: '',
      date: '',
      startDate: '',
      endDate: '',
      onglet: 'annuelles',
      search: '',
    },
  );

  const periodeUrl = lirePeriodeDepuisUrl({
    get: (cle: string) => (urlFilters as Record<string, string>)[cle] || null,
  });

  // La période AFFICHÉE ne passe pas par le parseur : il retombe sur « année »
  // tant que les bornes d'une plage ne sont pas saisies, ce qui empêcherait de
  // quitter le mode « année ». Le CHARGEMENT, lui, reste protégé plus bas.
  const periode = (['annee', 'mois', 'plage'].includes(urlFilters.periode)
    ? urlFilters.periode
    : periodeUrl.periode) as 'annee' | 'mois' | 'plage';
  const date = urlFilters.date || periodeUrl.date;
  const dateDebut = periodeUrl.dateDebut;
  const dateFin = periodeUrl.dateFin;

  // Période et date sont écrites ENSEMBLE : deux `setUrlFilters` dans le même
  // tick repartiraient tous deux d'un `window.location.search` périmé.
  const setPeriodeEtDate = (value: 'annee' | 'mois' | 'plage', nouvelleDate: string) =>
    setUrlFilters({ periode: value, date: nouvelleDate });
  const setPlage = (debut: Date | null, fin: Date | null) =>
    setUrlFilters({
      startDate: debut ? ecrireJour(debut) : null,
      endDate: fin ? ecrireJour(fin) : null,
    });

  const segment: Segment = estSegment(urlFilters.onglet) ? urlFilters.onglet : 'annuelles';
  const setSegment = (valeur: Segment) => setUrlFilters({ onglet: valeur });

  const [search, setSearch] = useUrlSearch(urlFilters.search, (valeur) =>
    setUrlFilters({ search: valeur }),
  );

  // Année de référence affichée dans les libellés (« Annuelle 2026 »).
  const anneeReference = useMemo(() => {
    if (periode === 'plage' && dateFin) return dateFin.getUTCFullYear();
    const annee = parseInt(date.slice(0, 4), 10);
    return Number.isNaN(annee) ? new Date().getFullYear() : annee;
  }, [periode, date, dateFin]);

  const [formations, setFormations] = useState<Formation[]>([]);
  const [kpis, setKpis] = useState<Record<MandatoryType, MandatoryKPIs | null>>({
    annuelle: null,
    onboarding: null,
    securite: null,
  });
  const [loading, setLoading] = useState(true);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // ===== Catalogue : obligatoires ET sécurité =====
  // Deux appels : `estSecurite` est indépendant de `estObligatoire`, aucune
  // requête unique ne peut ramener les deux populations (pas de OR côté API).
  useEffect(() => {
    let annule = false;
    const charger = async () => {
      setLoading(true);
      setError(null);
      try {
        const [obligatoires, securite] = await Promise.all([
          formationsService.getFormations({ estObligatoire: true, limit: 200 }),
          formationsService.getFormations({ estSecurite: true, limit: 200 }),
        ]);
        if (annule) return;
        // Une formation à la fois obligatoire ET sécurité ne doit apparaître
        // qu'une seule fois dans le catalogue fusionné.
        const parId = new Map<number, Formation>();
        [...obligatoires.data, ...securite.data].forEach((f) => parId.set(f.id, f));
        setFormations([...parId.values()]);
      } catch (err) {
        console.error('Erreur lors du chargement des formations à obligation:', err);
        if (!annule) setError('Impossible de charger les formations à obligation');
      } finally {
        if (!annule) setLoading(false);
      }
    };
    charger();
    return () => {
      annule = true;
    };
  }, []);

  // ===== Conformité : un appel par périmètre d'API =====
  useEffect(() => {
    // Plage incomplète : on ne lance rien, le backend recevrait une borne nulle.
    if (periode === 'plage' && (!dateDebut || !dateFin)) return;

    let annule = false;
    const charger = async () => {
      setKpisLoading(true);
      const startDate = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined;
      const endDate = dateFin ? dateFin.toISOString().split('T')[0] : undefined;
      try {
        const [annuelle, onboarding, securite] = await Promise.all(
          (['annuelle', 'onboarding', 'securite'] as MandatoryType[]).map((type) =>
            statsService.getMandatoryTrainingsKPIs(periode, date, startDate, endDate, type),
          ),
        );
        if (annule) return;
        setKpis({ annuelle, onboarding, securite });
      } catch (err) {
        console.error('Erreur lors du chargement de la conformité:', err);
      } finally {
        if (!annule) setKpisLoading(false);
      }
    };
    charger();
    return () => {
      annule = true;
    };
  }, [periode, date, dateDebut, dateFin]);

  // ===== Segmentation du catalogue =====
  const parSegment = useMemo(() => {
    const vide: Record<Segment, Formation[]> = {
      annuelles: [],
      indefinies: [],
      onboarding: [],
      securite: [],
    };
    formations.forEach((f) => {
      // La sécurité prime : ces formations ne sont pas marquées obligatoires,
      // elles ne peuvent donc pas tomber dans un autre segment.
      if (f.estSecurite) {
        vide.securite.push(f);
        return;
      }
      if (!f.estObligatoire) return;
      if (f.obligatoireType === 'onboarding') {
        vide.onboarding.push(f);
        return;
      }
      if (f.obligatoireAnnee) {
        vide.annuelles.push(f);
        return;
      }
      vide.indefinies.push(f);
    });
    return vide;
  }, [formations]);

  // Détail de conformité indexé par formation, pour chaque périmètre d'API.
  const conformiteParFormation = useMemo(() => {
    const index: Record<MandatoryType, Map<number, FormationConformite>> = {
      annuelle: new Map(),
      onboarding: new Map(),
      securite: new Map(),
    };
    (Object.keys(index) as MandatoryType[]).forEach((type) => {
      kpis[type]?.formations?.forEach((f) => index[type].set(f.id, f));
    });
    return index;
  }, [kpis]);

  /**
   * Couverture SST : nombre de collaborateurs ayant AU MOINS UNE habilitation.
   *
   * `stats.tauxConformiteGlobal` du périmètre `securite` compte les
   * collaborateurs ayant suivi TOUTES les formations du périmètre — règle
   * pertinente pour 3 obligatoires annuelles, absurde pour 13 habilitations
   * métier (harnais, électrique, SST...) que personne n'est censé cumuler :
   * elle renvoie 0 %. On recalcule donc l'UNION des formés côté client, sans
   * toucher au calcul du backend.
   */
  const couvertureSecurite = useMemo(() => {
    const data = kpis.securite;
    if (!data) return null;
    const habilites = new Set<number>();
    data.formations.forEach((f) => f.formes.forEach((c) => habilites.add(c.id)));
    const population = data.stats.totalCollaborateursAFormer;
    return {
      habilites: habilites.size,
      population,
      taux:
        population > 0 ? Math.round((habilites.size / population) * 100 * 10) / 10 : null,
    };
  }, [kpis.securite]);

  const lienConformite = useCallback(
    (type: MandatoryType) => {
      const params = new URLSearchParams({ type, periode });
      if (periode === 'plage') {
        if (dateDebut) params.set('startDate', ecrireJour(dateDebut));
        if (dateFin) params.set('endDate', ecrireJour(dateFin));
      } else {
        params.set('date', date);
      }
      return `/kpi/conformite?${params.toString()}`;
    },
    [periode, date, dateDebut, dateFin],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const type = TYPE_API[segment];
      const blob = await exportsService.exportFormationsObligatoires(anneeReference, type);
      exportsService.downloadBlob(blob, `formations-obligatoires_${anneeReference}_${type}.xlsx`);
      notifications.show({
        title: 'Export généré',
        message: 'Le fichier Excel de suivi a été téléchargé',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
    } catch (err) {
      console.error("Erreur lors de l'export:", err);
      notifications.show({
        title: 'Erreur',
        message: "Impossible de générer l'export Excel",
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setExporting(false);
    }
  };

  const formatDuree = (duree?: number, unite?: string) => {
    if (!duree) return '-';
    return `${duree} ${(unite || 'Heures').toLowerCase()}`;
  };

  const filtrer = (liste: Formation[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return liste;
    return liste.filter(
      (f) =>
        f.nomFormation.toLowerCase().includes(q) || f.codeFormation.toLowerCase().includes(q),
    );
  };

  // ===== Cartes de tête, une par segment =====
  const cartes: Array<{
    segment: Segment;
    titre: string;
    icone: React.ReactNode;
    couleur: string;
    valeur: number;
    detail: string;
  }> = [
    {
      segment: 'annuelles',
      titre: `Annuelles datées`,
      icone: <CalendarBlank size={24} />,
      couleur: 'blue',
      valeur: parSegment.annuelles.length,
      detail: `rattachées à une année précise`,
    },
    {
      segment: 'indefinies',
      titre: 'Annuelles indéfinies',
      icone: <InfinityIcon size={24} />,
      couleur: 'yellow',
      valeur: parSegment.indefinies.length,
      detail: 'sans année : dues chaque année',
    },
    {
      segment: 'onboarding',
      titre: 'Onboarding',
      icone: <UserPlus size={24} />,
      couleur: 'grape',
      valeur: parSegment.onboarding.length,
      detail: 'dues aux nouveaux arrivants',
    },
    {
      segment: 'securite',
      titre: 'Sécurité (SST)',
      icone: <ShieldCheck size={24} />,
      couleur: 'teal',
      valeur: parSegment.securite.length,
      detail: 'habilitations métier',
    },
  ];

  const badgeObligation = (formation: Formation) => {
    if (formation.estSecurite) {
      return (
        <Badge color="teal" variant="light">
          Sécurité (SST)
        </Badge>
      );
    }
    if (formation.obligatoireType === 'onboarding') {
      return (
        <Badge color="grape" variant="light">
          Onboarding
        </Badge>
      );
    }
    if (formation.obligatoireAnnee) {
      return (
        <Badge color="blue" variant="filled">
          Annuelle {formation.obligatoireAnnee}
        </Badge>
      );
    }
    return (
      <Tooltip label="Aucune année renseignée : la formation est due chaque année, sans échéance datée">
        <Badge color="yellow" variant="outline" leftSection={<InfinityIcon size={12} />}>
          Indéfinie
        </Badge>
      </Tooltip>
    );
  };

  const rendreTableau = (segmentCourant: Segment) => {
    const type = TYPE_API[segmentCourant];
    const liste = filtrer(parSegment[segmentCourant]);
    const index = conformiteParFormation[type];
    const estSecuriteSegment = segmentCourant === 'securite';
    const libelleTaux = estSecuriteSegment ? 'Couverture' : 'Taux de conformité';

    if (parSegment[segmentCourant].length === 0) {
      return null;
    }

    return (
      <Card shadow="sm" p={0} radius="md" withBorder>
        <Table.ScrollContainer minWidth={1250}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={240}>Formation</Table.Th>
                <Table.Th w={260}>Code</Table.Th>
                <Table.Th w={170}>Catégorie</Table.Th>
                <Table.Th w={160}>Obligation</Table.Th>
                <Table.Th w={110}>Durée</Table.Th>
                <Table.Th ta="right">{estSecuriteSegment ? 'Habilités' : 'Formés'}</Table.Th>
                <Table.Th ta="right">{estSecuriteSegment ? 'Non habilités' : 'Non formés'}</Table.Th>
                <Table.Th w={180}>{libelleTaux}</Table.Th>
                <Table.Th w={100}>Statut</Table.Th>
                <Table.Th w={90} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {liste.map((formation) => {
                const detail = index.get(formation.id);
                // Une obligatoire datée sur une AUTRE année que la période
                // sélectionnée sort du périmètre de calcul : le backend ne la
                // renvoie pas, on l'affiche sans chiffres plutôt que de laisser
                // croire à un taux de 0 %.
                const horsPeriode = !detail;
                return (
                  <Table.Tr key={formation.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {formation.nomFormation}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" style={{ wordBreak: 'break-all' }}>
                        {formation.codeFormation}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" style={{ maxWidth: '100%' }}>
                        {typeof formation.categorie === 'string'
                          ? formation.categorie
                          : formation.categorie?.nomCategorie || 'Non catégorisé'}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>{badgeObligation(formation)}</Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
                        {formatDuree(formation.dureePrevue, formation.uniteDuree)}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      {kpisLoading && !detail ? (
                        <Loader size="xs" />
                      ) : horsPeriode ? (
                        <Text size="sm" c="dimmed">
                          –
                        </Text>
                      ) : (
                        <Text size="sm" fw={500}>
                          {detail.collaborateursFormes}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td ta="right">
                      {kpisLoading && !detail ? (
                        <Loader size="xs" />
                      ) : horsPeriode ? (
                        <Text size="sm" c="dimmed">
                          –
                        </Text>
                      ) : detail.collaborateursNonFormes === 0 ? (
                        <Text size="sm" c="dimmed">
                          0
                        </Text>
                      ) : (
                        <Tooltip
                          label={`Voir les ${detail.collaborateursNonFormes} collaborateurs ${
                            estSecuriteSegment ? 'non habilités' : 'non formés'
                          } sur /kpi/conformite`}
                        >
                          <Anchor
                            component="a"
                            href={lienConformite(type)}
                            fw={600}
                            c="red"
                            size="sm"
                          >
                            {detail.collaborateursNonFormes}
                          </Anchor>
                        </Tooltip>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {horsPeriode ? (
                        <Text size="xs" c="dimmed">
                          Hors période sélectionnée
                        </Text>
                      ) : (
                        <Group gap="xs" wrap="nowrap">
                          <Progress
                            value={detail.tauxConformite}
                            color={couleurTaux(detail.tauxConformite)}
                            size="sm"
                            style={{ flex: 1 }}
                          />
                          <Text size="sm" fw={600} c={couleurTaux(detail.tauxConformite)} w={56} ta="right">
                            {formatTaux(detail.tauxConformite)}
                          </Text>
                        </Group>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={formation.actif ? 'green' : 'gray'}
                        variant="light"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {formation.actif ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Voir la formation">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => router.push(`/formations/${formation.id}`)}
                          >
                            <Eye size={18} />
                          </ActionIcon>
                        </Tooltip>
                        {segmentCourant === 'indefinies' && (
                          <Tooltip label="Qualifier l'obligation (année ou onboarding)">
                            <ActionIcon
                              variant="subtle"
                              color="yellow"
                              onClick={() => router.push(`/formations/${formation.id}`)}
                            >
                              <PencilSimple size={18} />
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
        </Table.ScrollContainer>

        {liste.length === 0 && (
          <Text ta="center" p="xl" c="dimmed">
            Aucune formation de cette section ne correspond à votre recherche
          </Text>
        )}
      </Card>
    );
  };

  /** Bandeau de synthèse propre à chaque section. */
  const rendreSynthese = (segmentCourant: Segment) => {
    if (segmentCourant === 'securite') {
      return (
        <Alert color="teal" variant="light" icon={<ShieldCheck size={20} />} title="Comment lire cette section">
          <Stack gap={4}>
            <Text size="sm">
              Les formations de sécurité sont des <strong>habilitations métier</strong> (harnais,
              habilitation électrique, SST, évacuation…) : personne n&apos;est censé les cumuler
              toutes. La conformité s&apos;y lit donc « <strong>au moins une habilitation</strong> »
              et non « toutes les formations du périmètre », contrairement aux obligatoires
              annuelles.
            </Text>
            {couvertureSecurite && (
              <Text size="sm">
                <strong>
                  {couvertureSecurite.habilites}/{couvertureSecurite.population}
                </strong>{' '}
                collaborateurs ({formatTaux(couvertureSecurite.taux)}) détiennent au moins une
                habilitation sur la période. Le taux affiché par ligne est la{' '}
                <strong>part de l&apos;effectif</strong> détenant cette habilitation précise, pas un
                taux de conformité.
              </Text>
            )}
          </Stack>
        </Alert>
      );
    }

    if (segmentCourant === 'indefinies') {
      const data = kpis.annuelle;
      return (
        <Stack gap="sm">
          <Alert color="yellow" variant="light" icon={<Warning size={20} />} title="Obligations non qualifiées">
            <Text size="sm">
              Ces formations sont marquées obligatoires mais ne portent{' '}
              <strong>ni année ni type</strong> : elles sont considérées comme dues{' '}
              <strong>chaque année</strong>, pour tout l&apos;effectif, sans échéance datée. Pour un
              suivi daté (« à repasser en {anneeReference} ») ou un rattachement au parcours
              d&apos;intégration, renseignez l&apos;obligation sur la fiche de chaque formation.
            </Text>
          </Alert>
          {data && (
            <Text size="sm" c="dimmed">
              Conformité du périmètre annuel complet ({data.stats.totalFormations} formation
              {data.stats.totalFormations > 1 ? 's' : ''}, un collaborateur est conforme s&apos;il
              les a <strong>toutes</strong> suivies) :{' '}
              <strong>{formatTaux(data.stats.tauxConformiteGlobal)}</strong> —{' '}
              {data.stats.totalFormes}/{data.stats.totalCollaborateursAFormer} collaborateurs.
            </Text>
          )}
        </Stack>
      );
    }

    if (segmentCourant === 'annuelles') {
      const data = kpis.annuelle;
      return (
        <Stack gap="sm">
          <Alert color="blue" variant="light" icon={<Info size={20} />} title="Obligations datées">
            <Text size="sm">
              Formations obligatoires rattachées à une <strong>année précise</strong> : elles ne
              comptent dans le suivi que sur l&apos;année sélectionnée. Les obligations sans année
              figurent dans l&apos;onglet « Annuelles indéfinies ».
            </Text>
          </Alert>
          {data && (
            <Text size="sm" c="dimmed">
              Conformité du périmètre annuel complet ({data.stats.totalFormations} formation
              {data.stats.totalFormations > 1 ? 's' : ''}) :{' '}
              <strong>{formatTaux(data.stats.tauxConformiteGlobal)}</strong> —{' '}
              {data.stats.totalFormes}/{data.stats.totalCollaborateursAFormer} collaborateurs.
            </Text>
          )}
        </Stack>
      );
    }

    const data = kpis.onboarding;
    return (
      <Stack gap="sm">
        <Alert color="grape" variant="light" icon={<UserPlus size={20} />} title="Parcours d'intégration">
          <Text size="sm">
            Formations dues aux <strong>nouveaux arrivants</strong> de la période sélectionnée. La
            population de référence n&apos;est pas l&apos;effectif complet mais les collaborateurs
            embauchés sur la période.
          </Text>
        </Alert>
        {data && (
          <Text size="sm" c="dimmed">
            Conformité onboarding : <strong>{formatTaux(data.stats.tauxConformiteGlobal)}</strong> —{' '}
            {data.stats.totalFormes}/{data.stats.totalCollaborateursAFormer} nouveaux arrivants.
          </Text>
        )}
      </Stack>
    );
  };

  /** Section vide : dire POURQUOI, et où sont les formations. */
  const rendreVide = (segmentCourant: Segment) => {
    const messages: Record<Segment, { titre: string; texte: React.ReactNode }> = {
      annuelles: {
        titre: 'Aucune formation obligatoire datée',
        texte: (
          <>
            Aucune formation obligatoire ne porte d&apos;année de référence.
            {parSegment.indefinies.length > 0 && (
              <>
                {' '}
                Les {parSegment.indefinies.length} obligation
                {parSegment.indefinies.length > 1 ? 's' : ''} existantes sont{' '}
                <strong>indéfinies</strong> :{' '}
                <UnstyledButton
                  onClick={() => setSegment('indefinies')}
                  style={{ textDecoration: 'underline' }}
                >
                  <Text component="span" size="sm" c="blue" fw={500}>
                    voir l&apos;onglet « Annuelles indéfinies »
                  </Text>
                </UnstyledButton>{' '}
                pour les qualifier.
              </>
            )}
          </>
        ),
      },
      indefinies: {
        titre: 'Aucune obligation indéfinie',
        texte: <>Toutes les formations obligatoires portent une année ou un type d&apos;obligation.</>,
      },
      onboarding: {
        titre: 'Aucune formation d’onboarding',
        texte: (
          <>
            Aucune formation obligatoire n&apos;est rattachée au parcours d&apos;intégration.
            Renseignez l&apos;obligation « Onboarding » sur la fiche d&apos;une formation pour
            alimenter cette section.
          </>
        ),
      },
      securite: {
        titre: 'Aucune formation de sécurité',
        texte: (
          <>Aucune formation n&apos;est marquée « sécurité au travail (SST) » dans le catalogue.</>
        ),
      },
    };
    const message = messages[segmentCourant];
    return (
      <Alert color="gray" variant="light" icon={<Info size={20} />} title={message.titre}>
        <Text size="sm">{message.texte}</Text>
      </Alert>
    );
  };

  if (loading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Alert color="red" title="Erreur" icon={<Warning size={20} />}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <div>
            <Title order={2}>Formations à obligation</Title>
            <Text c="dimmed" size="sm">
              Vue récapitulative : obligatoires annuelles (datées et indéfinies), onboarding et
              sécurité au travail
            </Text>
          </div>
          <Button
            leftSection={<DownloadSimple size={18} />}
            variant="light"
            onClick={handleExport}
            loading={exporting}
          >
            Exporter le suivi (Excel)
          </Button>
        </Group>

        <Paper p="md" radius="md" withBorder>
          <Stack gap="xs">
            <PeriodSelector
              periode={periode}
              date={date}
              dateDebut={dateDebut}
              dateFin={dateFin}
              onChange={(p, d) => setPeriodeEtDate(p, d)}
              onDateRangeChange={(debut, fin) => setPlage(debut, fin)}
            />
            {periode === 'plage' && (!dateDebut || !dateFin) && (
              <Text size="xs" c="dimmed">
                Renseignez les deux bornes de la plage pour recalculer la conformité.
              </Text>
            )}
          </Stack>
        </Paper>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {cartes.map((carte) => (
            <UnstyledButton key={carte.segment} onClick={() => setSegment(carte.segment)}>
              <Card
                shadow="sm"
                p="lg"
                radius="md"
                withBorder
                style={{
                  borderColor:
                    segment === carte.segment
                      ? `var(--mantine-color-${carte.couleur}-6)`
                      : undefined,
                  borderWidth: segment === carte.segment ? 2 : undefined,
                  height: '100%',
                }}
              >
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      {carte.titre}
                    </Text>
                    <Text size="xl" fw={700}>
                      {carte.valeur}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {carte.detail}
                    </Text>
                  </div>
                  <ThemeIcon color={carte.couleur} size="lg" radius="md">
                    {carte.icone}
                  </ThemeIcon>
                </Group>
              </Card>
            </UnstyledButton>
          ))}
        </SimpleGrid>

        <Alert icon={<Certificate size={20} />} color="blue" variant="light">
          <Text size="sm">
            Le suivi détaillé (matrice département × formation, listes nominatives, relances des
            managers) se trouve sur la page{' '}
            <Anchor href={lienConformite(TYPE_API[segment])} fw={500}>
              KPI Conformité
            </Anchor>
            , ouverte sur le même périmètre et la même période.
          </Text>
        </Alert>

        <Tabs value={segment} onChange={(valeur) => valeur && estSegment(valeur) && setSegment(valeur)}>
          <Tabs.List>
            <Tabs.Tab
              value="annuelles"
              leftSection={<CalendarBlank size={16} />}
              rightSection={
                <Badge size="sm" variant="light" color="blue">
                  {parSegment.annuelles.length}
                </Badge>
              }
            >
              Annuelles datées
            </Tabs.Tab>
            <Tabs.Tab
              value="indefinies"
              leftSection={<InfinityIcon size={16} />}
              rightSection={
                <Badge size="sm" variant="light" color="yellow">
                  {parSegment.indefinies.length}
                </Badge>
              }
            >
              Annuelles indéfinies
            </Tabs.Tab>
            <Tabs.Tab
              value="onboarding"
              leftSection={<UserPlus size={16} />}
              rightSection={
                <Badge size="sm" variant="light" color="grape">
                  {parSegment.onboarding.length}
                </Badge>
              }
            >
              Onboarding
            </Tabs.Tab>
            <Tabs.Tab
              value="securite"
              leftSection={<ShieldCheck size={16} />}
              rightSection={
                <Badge size="sm" variant="light" color="teal">
                  {parSegment.securite.length}
                </Badge>
              }
            >
              Sécurité (SST)
            </Tabs.Tab>
          </Tabs.List>

          {SEGMENTS.map((valeur) => (
            <Tabs.Panel key={valeur} value={valeur} pt="lg">
              <Stack gap="md">
                {rendreSynthese(valeur)}

                {parSegment[valeur].length === 0 ? (
                  rendreVide(valeur)
                ) : (
                  <>
                    <TextInput
                      placeholder="Rechercher une formation..."
                      leftSection={<MagnifyingGlass size={16} />}
                      value={search}
                      onChange={(e) => setSearch(e.currentTarget.value)}
                    />
                    {rendreTableau(valeur)}
                  </>
                )}
              </Stack>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Stack>
    </Container>
  );
}
