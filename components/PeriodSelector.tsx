'use client';

import { Group, SegmentedControl, Select, ActionIcon, Tooltip } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Calendar, ArrowCounterClockwise } from '@phosphor-icons/react';

interface PeriodSelectorProps {
  periode: 'annee' | 'mois' | 'plage';
  date: string;
  dateDebut?: Date | null;
  dateFin?: Date | null;
  onChange: (periode: 'annee' | 'mois' | 'plage', date: string) => void;
  onDateRangeChange?: (dateDebut: Date | null, dateFin: Date | null) => void;
  onReset?: () => void;
}

export function PeriodSelector({
  periode,
  date,
  dateDebut,
  dateFin,
  onChange,
  onDateRangeChange,
  onReset
}: PeriodSelectorProps) {
  // Générer les 6 dernières années
  const annees = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { label: year.toString(), value: year.toString() };
  });

  // Générer les 12 mois
  const mois = Array.from({ length: 12 }, (_, i) => {
    const monthNumber = (i + 1).toString().padStart(2, '0');
    const monthName = new Date(2000, i).toLocaleDateString('fr-FR', { month: 'long' });
    return {
      label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      value: monthNumber
    };
  });

  // Extraire année et mois de la date
  const [anneeValue, moisValue] = date.includes('-') ? date.split('-') : [date, '01'];

  const handlePeriodeChange = (newPeriode: string) => {
    const p = newPeriode as 'annee' | 'mois' | 'plage';
    if (p === 'annee') {
      // Réinitialiser les dates de plage quand on quitte le mode plage
      if (onDateRangeChange) {
        onDateRangeChange(null, null);
      }
      onChange(p, anneeValue);
    } else if (p === 'mois') {
      // Réinitialiser les dates de plage quand on quitte le mode plage
      if (onDateRangeChange) {
        onDateRangeChange(null, null);
      }
      onChange(p, `${anneeValue}-${moisValue}`);
    } else {
      // Mode plage - on garde la date actuelle mais on active le mode plage
      onChange(p, date);
    }
  };

  const handleAnneeChange = (newAnnee: string | null) => {
    if (!newAnnee) return;
    if (periode === 'annee') {
      onChange(periode, newAnnee);
    } else if (periode === 'mois') {
      onChange(periode, `${newAnnee}-${moisValue}`);
    }
  };

  const handleMoisChange = (newMois: string | null) => {
    if (!newMois) return;
    onChange(periode, `${anneeValue}-${newMois}`);
  };

  const handleDateDebutChange = (value: Date | null) => {
    if (onDateRangeChange) {
      onDateRangeChange(value, dateFin || null);
    }
  };

  const handleDateFinChange = (value: Date | null) => {
    if (onDateRangeChange) {
      onDateRangeChange(dateDebut || null, value);
    }
  };

  const handleReset = () => {
    // Réinitialiser les dates de plage
    if (onDateRangeChange) {
      onDateRangeChange(null, null);
    }
    // Revenir au mode année avec l'année en cours
    onChange('annee', new Date().getFullYear().toString());
    // Appeler le callback onReset si fourni
    if (onReset) {
      onReset();
    }
  };

  // Vérifier si on a des données de plage actives (pour afficher le bouton reset)
  const hasPlageData = periode === 'plage' && (dateDebut || dateFin);

  return (
    <Group gap="md" align="center">
      <Calendar size={20} weight="duotone" />

      <SegmentedControl
        value={periode}
        onChange={handlePeriodeChange}
        data={[
          { label: 'Année', value: 'annee' },
          { label: 'Mois', value: 'mois' },
          { label: 'Plage', value: 'plage' }
        ]}
      />

      {periode !== 'plage' && (
        <Select
          value={anneeValue}
          onChange={handleAnneeChange}
          data={annees}
          w={100}
          styles={{
            input: { fontWeight: 500 }
          }}
        />
      )}

      {periode === 'mois' && (
        <Select
          value={moisValue}
          onChange={handleMoisChange}
          data={mois}
          w={140}
          styles={{
            input: { fontWeight: 500 }
          }}
        />
      )}

      {periode === 'plage' && (
        <>
          <DatePickerInput
            value={dateDebut}
            onChange={handleDateDebutChange}
            placeholder="Date début"
            locale="fr"
            valueFormat="DD/MM/YYYY"
            w={140}
            clearable
            maxDate={dateFin || undefined}
            styles={{
              input: { fontWeight: 500 }
            }}
          />
          <span>→</span>
          <DatePickerInput
            value={dateFin}
            onChange={handleDateFinChange}
            placeholder="Date fin"
            locale="fr"
            valueFormat="DD/MM/YYYY"
            w={140}
            clearable
            minDate={dateDebut || undefined}
            styles={{
              input: { fontWeight: 500 }
            }}
          />
          {hasPlageData && (
            <Tooltip label="Réinitialiser (retour à l'année en cours)">
              <ActionIcon
                variant="light"
                color="gray"
                size="lg"
                onClick={handleReset}
              >
                <ArrowCounterClockwise size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </>
      )}
    </Group>
  );
}
