'use client';

import { Grid, NumberInput, Select, SegmentedControl, Input, Stack, Text } from '@mantine/core';

/**
 * Champs de portée d'une formation obligatoire.
 *
 * Auparavant, cocher « Formation obligatoire » laissait l'année facultative,
 * avec pour seul indice un placeholder « Toutes les années » : rien ne
 * distinguait une obligation volontairement permanente d'un champ que la RH
 * avait simplement oublié de remplir. La portée est désormais un choix
 * explicite — période annuelle datée OU obligation indéfinie — et l'année
 * devient obligatoire dès que la période annuelle est retenue.
 *
 * Conservé volontairement sur `obligatoireAnnee` (granularité année, déjà en
 * base) : `null` signifie « indéfinie », exactement comme aujourd'hui, donc le
 * KPI de conformité (`buildMandatoryFormationsWhere`) reste inchangé.
 */

export type ObligatoirePortee = 'annee' | 'indefinie';

/** Portée déduite d'une valeur d'année persistée (null/undefined = indéfinie). */
export function porteeDepuisAnnee(annee?: number | null): ObligatoirePortee {
  return annee === null || annee === undefined ? 'indefinie' : 'annee';
}

/** Année à persister pour une portée donnée : null dès que l'obligation est indéfinie. */
export function anneeAPersister(
  portee: ObligatoirePortee,
  annee?: number | string | null,
): number | null {
  if (portee !== 'annee') return null;
  const valeur = Number(annee);
  return Number.isFinite(valeur) && valeur > 0 ? valeur : null;
}

/**
 * Valide la portée au moment de la soumission.
 * Retourne un message d'erreur, ou null si la saisie est cohérente.
 */
export function validerObligation(values: {
  estObligatoire?: boolean;
  obligatoireType?: string | null;
  obligatoirePortee?: ObligatoirePortee;
  obligatoireAnnee?: number | string | null;
}): string | null {
  if (!values.estObligatoire) return null;
  // L'onboarding s'applique à l'arrivée du collaborateur : la notion d'année
  // d'application n'a pas de sens et le champ n'est pas affiché.
  if (values.obligatoireType === 'onboarding') return null;
  if (values.obligatoirePortee !== 'annee') return null;

  const annee = Number(values.obligatoireAnnee);
  if (!Number.isFinite(annee) || annee < 2000 || annee > 2100) {
    return "Indiquez l'année d'application, ou choisissez « Indéfinie »";
  }
  return null;
}

interface ObligationPeriodeFieldsProps {
  /** Type d'obligation courant ('annuelle' | 'onboarding'). */
  obligatoireType: string | null | undefined;
  /** Portée courante. */
  portee: ObligatoirePortee;
  /** Année courante (ignorée si la portée est « indéfinie »). */
  annee: number | string | null | undefined;
  onTypeChange: (value: string) => void;
  onPorteeChange: (value: ObligatoirePortee) => void;
  onAnneeChange: (value: number | string) => void;
  /** Message d'erreur à afficher sous le champ Année. */
  anneeError?: React.ReactNode;
}

export function ObligationPeriodeFields({
  obligatoireType,
  portee,
  annee,
  onTypeChange,
  onPorteeChange,
  onAnneeChange,
  anneeError,
}: ObligationPeriodeFieldsProps) {
  const estOnboarding = obligatoireType === 'onboarding';

  return (
    <Grid gutter="md">
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Select
          label="Type d'obligation"
          description="Annuelle (à suivre chaque année ciblée) ou Onboarding (à l'arrivée)"
          data={[
            { value: 'annuelle', label: 'Annuelle' },
            { value: 'onboarding', label: 'Onboarding' },
          ]}
          allowDeselect={false}
          value={obligatoireType || 'annuelle'}
          onChange={(value) => onTypeChange(value || 'annuelle')}
        />
      </Grid.Col>

      {!estOnboarding && (
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="xs">
            <Input.Wrapper
              label="Portée de l'obligation"
              description="À quelle période cette obligation s'applique-t-elle ?"
            >
              <SegmentedControl
                fullWidth
                mt={4}
                value={portee}
                onChange={(value) => onPorteeChange(value as ObligatoirePortee)}
                data={[
                  { value: 'annee', label: 'Année précise' },
                  { value: 'indefinie', label: 'Indéfinie' },
                ]}
              />
            </Input.Wrapper>

            {portee === 'annee' ? (
              <NumberInput
                label="Année d'application"
                placeholder="Ex : 2026"
                min={2000}
                max={2100}
                required
                value={annee ?? ''}
                onChange={onAnneeChange}
                error={anneeError}
              />
            ) : (
              <Text size="xs" c="dimmed">
                L&apos;obligation s&apos;applique à toutes les années, sans date de fin.
              </Text>
            )}
          </Stack>
        </Grid.Col>
      )}
    </Grid>
  );
}
