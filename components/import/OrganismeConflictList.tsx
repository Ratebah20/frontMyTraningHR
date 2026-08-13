'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Group,
  Badge,
  Text,
  Stack,
  SegmentedControl,
  TextInput,
  Select,
  Checkbox,
  Accordion,
  Alert,
  Loader,
} from '@mantine/core';
import { Warning as IconAlertTriangle } from '@phosphor-icons/react/dist/ssr/Warning';
import { Building as IconBuilding } from '@phosphor-icons/react/dist/ssr/Building';
import { Plus as IconPlus } from '@phosphor-icons/react/dist/ssr/Plus';
import { ArrowRight as IconArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import type { OrganismeNonTrouve } from '@/lib/types/import-preview.types';
import type {
  ActionResolutionOrganismeEtendue,
  OrganismeCibleOption,
  ResolutionOrganismeEtendue,
} from '@/lib/services/import.service';
import { importService } from '@/lib/services/import.service';

interface Props {
  organismes: OrganismeNonTrouve[];
  onResolutionsChange: (resolutions: Map<string, ResolutionOrganismeEtendue>) => void;
}

/**
 * Résolution des organismes non trouvés d'un preview d'import OLU.
 *
 * Trois actions :
 * - IGNORER (défaut inchangé) : les sessions restent sans organisme ;
 * - CREER : nouvel organisme, avec nom personnalisable ;
 * - MAPPER : rattachement à un organisme EXISTANT. C'est la réponse au cas
 *   « Orange Campus Cyber / Tech / Management » qui, faute d'égalité stricte
 *   des noms, fragmentait l'organisme canonique « Orange Campus ».
 *
 * Un MAPPER sans organisme cible n'est jamais transmis : le backend ne saurait
 * pas quoi rattacher.
 */
export function OrganismeConflictList({ organismes, onResolutionsChange }: Props) {
  const [resolutions, setResolutions] = useState<Map<string, ResolutionOrganismeEtendue>>(new Map());
  // Action affichee : elle n'est pas toujours dans `resolutions` (un MAPPER
  // sans cible est selectionne a l'ecran mais jamais transmis au backend)
  const [actions, setActions] = useState<Map<string, ActionResolutionOrganismeEtendue>>(new Map());
  const [customNames, setCustomNames] = useState<Map<string, string>>(new Map());
  // Cible choisie pour l'action MAPPER (id de l'organisme existant, en chaîne)
  const [ciblesChoisies, setCiblesChoisies] = useState<Map<string, string>>(new Map());
  // « Retenir ce rattachement pour les prochains imports » : coché par défaut,
  // et TOUJOURS envoyé explicitement (le backend n'applique pas de défaut).
  const [memorisations, setMemorisations] = useState<Map<string, boolean>>(new Map());

  const [organismesCibles, setOrganismesCibles] = useState<OrganismeCibleOption[]>([]);
  const [isLoadingCibles, setIsLoadingCibles] = useState(true);
  const [erreurCibles, setErreurCibles] = useState<string | null>(null);

  // Hook placé avant tout retour anticipé (voir le `return null` plus bas)
  useEffect(() => {
    let annule = false;
    setIsLoadingCibles(true);
    setErreurCibles(null);

    importService
      .getOrganismesCibles()
      .then((data) => {
        if (!annule) {
          setOrganismesCibles(data);
        }
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des organismes cibles:', error);
        if (!annule) {
          setOrganismesCibles([]);
          setErreurCibles(
            "Impossible de charger la liste des organismes existants. Le rattachement a un organisme existant est indisponible pour le moment.",
          );
        }
      })
      .finally(() => {
        if (!annule) {
          setIsLoadingCibles(false);
        }
      });

    return () => {
      annule = true;
    };
  }, []);

  // Construit la resolution a transmettre pour une cle donnee.
  // Retourne null quand le choix est incomplet (MAPPER sans cible) ou neutre
  // (IGNORER) : dans les deux cas rien n'est envoye au backend.
  const construireResolution = (
    cle: string,
    action: ActionResolutionOrganismeEtendue,
    cible: string | undefined,
    nomPersonnalise: string | undefined,
    memoriser: boolean,
  ): ResolutionOrganismeEtendue | null => {
    if (action === 'IGNORER') {
      return null;
    }

    if (action === 'MAPPER') {
      if (!cible) {
        return null;
      }
      const organisme = organismesCibles.find((o) => String(o.id) === cible);
      return {
        emailFormateur: cle,
        action: 'MAPPER',
        organismeCibleId: Number(cible),
        ...(organisme ? { organismeCibleNom: organisme.nom } : {}),
        memoriser,
      };
    }

    return {
      emailFormateur: cle,
      action: 'CREER',
      ...(nomPersonnalise ? { nomOrganisme: nomPersonnalise } : {}),
      memoriser,
    };
  };

  // Recalcule et publie la resolution d'une seule cle
  const publier = (
    cle: string,
    action: ActionResolutionOrganismeEtendue,
    cible: string | undefined,
    nomPersonnalise: string | undefined,
    memoriser: boolean,
  ) => {
    const resolution = construireResolution(cle, action, cible, nomPersonnalise, memoriser);
    const nouvelles = new Map(resolutions);
    if (resolution) {
      nouvelles.set(cle, resolution);
    } else {
      nouvelles.delete(cle);
    }
    setResolutions(nouvelles);
    onResolutionsChange(nouvelles);
  };

  const lireAction = (cle: string): ActionResolutionOrganismeEtendue =>
    actions.get(cle) || 'IGNORER';
  const lireMemoriser = (cle: string): boolean => memorisations.get(cle) ?? true;

  const handleActionChange = (cle: string, action: ActionResolutionOrganismeEtendue) => {
    const nouvellesActions = new Map(actions);
    nouvellesActions.set(cle, action);
    setActions(nouvellesActions);
    publier(cle, action, ciblesChoisies.get(cle), customNames.get(cle), lireMemoriser(cle));
  };

  const handleCibleChange = (cle: string, valeur: string | null) => {
    const nouvellesCibles = new Map(ciblesChoisies);
    if (valeur) {
      nouvellesCibles.set(cle, valeur);
    } else {
      nouvellesCibles.delete(cle);
    }
    setCiblesChoisies(nouvellesCibles);
    publier(cle, lireAction(cle), valeur || undefined, customNames.get(cle), lireMemoriser(cle));
  };

  const handleMemoriserChange = (cle: string, memoriser: boolean) => {
    const nouvelles = new Map(memorisations);
    nouvelles.set(cle, memoriser);
    setMemorisations(nouvelles);
    publier(cle, lireAction(cle), ciblesChoisies.get(cle), customNames.get(cle), memoriser);
  };

  const handleCustomNameChange = (cle: string, value: string) => {
    const nouveauxNoms = new Map(customNames);
    nouveauxNoms.set(cle, value);
    setCustomNames(nouveauxNoms);
    publier(cle, lireAction(cle), ciblesChoisies.get(cle), value || undefined, lireMemoriser(cle));
  };

  const actionOptions = [
    { label: 'Ignorer', value: 'IGNORER' },
    { label: 'Creer', value: 'CREER' },
    { label: 'Rattacher a un existant', value: 'MAPPER' },
  ];

  const donneesCibles = organismesCibles.map((organisme) => ({
    value: String(organisme.id),
    label: organisme.nom,
  }));

  const sessionsIgnoreesTotal = organismes.reduce((sum, org) => {
    if (!resolutions.has(org.emailFormateur)) {
      return sum + org.nombreSessionsAffectees;
    }
    return sum;
  }, 0);

  if (organismes.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <Alert
        color="orange"
        icon={<IconAlertTriangle size={20} />}
        title={`${organismes.length} organisme(s) non trouve(s)`}
      >
        <Text size="sm">
          Ces organismes n'existent pas dans le systeme sous ce nom exact.
          Choisissez une action pour chacun : le rattacher a un organisme
          existant, en creer un nouveau, ou l'ignorer.
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          Rattacher evite de fragmenter un meme organisme en plusieurs fiches
          (« Orange Campus Cyber », « Orange Campus Tech »… vers « Orange Campus »).
        </Text>
        {sessionsIgnoreesTotal > 0 && (
          <Text size="sm" fw={500} mt="xs" c="orange">
            {sessionsIgnoreesTotal} session(s) seront sans organisme si non resolues.
          </Text>
        )}
      </Alert>

      {erreurCibles && (
        <Alert color="yellow" variant="light" icon={<IconAlertTriangle size={18} />}>
          <Text size="sm">{erreurCibles}</Text>
        </Alert>
      )}

      <Accordion variant="separated">
        {organismes.map((org) => {
          const cle = org.emailFormateur;
          const currentAction = lireAction(cle);
          const isResolved = resolutions.has(cle);
          const cibleChoisie = ciblesChoisies.get(cle) || null;
          const mapperIncomplet = currentAction === 'MAPPER' && !cibleChoisie;

          return (
            <Accordion.Item
              key={cle}
              value={cle}
              style={{
                borderColor: isResolved
                  ? 'var(--mantine-color-green-5)'
                  : 'var(--mantine-color-orange-5)',
                borderWidth: 2,
              }}
            >
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap" style={{ flex: 1 }}>
                  <Group gap="xs" wrap="nowrap">
                    <IconBuilding size={18} color="var(--mantine-color-orange-6)" />
                    <Badge color="orange" size="sm" variant="light">
                      Non trouve
                    </Badge>
                    <Text fw={500} size="sm" truncate>
                      {org.nomOrganisme}
                    </Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Badge size="sm" variant="outline" color="gray">
                      {org.nombreSessionsAffectees} session(s)
                    </Badge>
                    {isResolved && (
                      <Badge size="sm" color="green" variant="filled">
                        {currentAction === 'MAPPER' ? 'Rattache' : 'Creer'}
                      </Badge>
                    )}
                    {mapperIncomplet && (
                      <Badge size="sm" color="red" variant="light">
                        Cible manquante
                      </Badge>
                    )}
                  </Group>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">Valeur du fichier :</Text>
                    <Text size="xs" ff="monospace">{cle}</Text>
                  </Group>

                  <Group gap="xs">
                    <Text size="xs" c="dimmed">Nom genere:</Text>
                    <Text size="xs">{org.nomOrganisme}</Text>
                  </Group>

                  {org.lignesExemples.length > 0 && (
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">Lignes:</Text>
                      <Text size="xs">
                        {org.lignesExemples.join(', ')}
                        {org.lignesExemples.length < org.nombreSessionsAffectees && '...'}
                      </Text>
                    </Group>
                  )}

                  <div>
                    <Text size="sm" fw={500} mb="xs">Action:</Text>
                    <SegmentedControl
                      value={currentAction}
                      onChange={(value) =>
                        handleActionChange(cle, value as ActionResolutionOrganismeEtendue)
                      }
                      data={actionOptions}
                      fullWidth
                      color={currentAction === 'IGNORER' ? 'gray' : 'green'}
                    />
                  </div>

                  {currentAction === 'MAPPER' && (
                    <Card withBorder p="sm">
                      <Text size="sm" fw={500} mb="sm">
                        <IconArrowRight size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Rattacher a un organisme existant
                      </Text>

                      {isLoadingCibles ? (
                        <Group gap="xs">
                          <Loader size="xs" />
                          <Text size="xs" c="dimmed">Chargement des organismes…</Text>
                        </Group>
                      ) : donneesCibles.length === 0 ? (
                        <Text size="xs" c="dimmed">
                          {erreurCibles
                            ? "Liste indisponible : choisissez « Creer » ou « Ignorer »."
                            : "Aucun organisme existant : utilisez « Creer »."}
                        </Text>
                      ) : (
                        <Select
                          size="sm"
                          label="Organisme cible"
                          placeholder="Choisir un organisme…"
                          data={donneesCibles}
                          value={cibleChoisie}
                          onChange={(value) => handleCibleChange(cle, value)}
                          searchable
                          clearable
                          required
                          nothingFoundMessage="Aucun organisme trouve"
                          error={mapperIncomplet ? 'Choisissez un organisme cible' : undefined}
                        />
                      )}

                      <Checkbox
                        mt="sm"
                        size="sm"
                        label="Retenir ce rattachement pour les prochains imports"
                        description="La prochaine fois, cette valeur du fichier sera rattachee automatiquement au meme organisme."
                        checked={lireMemoriser(cle)}
                        onChange={(event) =>
                          handleMemoriserChange(cle, event.currentTarget.checked)
                        }
                      />

                      {mapperIncomplet && (
                        <Text size="xs" c="red" mt="xs">
                          Tant qu'aucun organisme cible n'est choisi, cette ligne reste
                          non resolue et ses sessions seront sans organisme.
                        </Text>
                      )}
                    </Card>
                  )}

                  {currentAction === 'CREER' && (
                    <Card withBorder p="sm">
                      <Text size="sm" fw={500} mb="sm">
                        <IconPlus size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Personnaliser le nom (optionnel)
                      </Text>
                      <TextInput
                        placeholder={org.nomOrganisme}
                        size="sm"
                        value={customNames.get(cle) || ''}
                        onChange={(e) => handleCustomNameChange(cle, e.target.value)}
                      />
                      <Text size="xs" c="dimmed" mt="xs">
                        Laissez vide pour utiliser le nom par defaut: {org.nomOrganisme}
                      </Text>
                      <Checkbox
                        mt="sm"
                        size="sm"
                        label="Retenir ce choix pour les prochains imports"
                        checked={lireMemoriser(cle)}
                        onChange={(event) =>
                          handleMemoriserChange(cle, event.currentTarget.checked)
                        }
                      />
                    </Card>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </Stack>
  );
}

export default OrganismeConflictList;
