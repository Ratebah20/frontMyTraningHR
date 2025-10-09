'use client';

import { Group, SegmentedControl, Select } from '@mantine/core';
import { Calendar } from '@phosphor-icons/react';

interface PeriodSelectorProps {
  periode: 'annee' | 'mois';
  date: string;
  onChange: (periode: 'annee' | 'mois', date: string) => void;
}

export function PeriodSelector({ periode, date, onChange }: PeriodSelectorProps) {
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
    const p = newPeriode as 'annee' | 'mois';
    if (p === 'annee') {
      onChange(p, anneeValue);
    } else {
      onChange(p, `${anneeValue}-${moisValue}`);
    }
  };

  const handleAnneeChange = (newAnnee: string | null) => {
    if (!newAnnee) return;
    if (periode === 'annee') {
      onChange(periode, newAnnee);
    } else {
      onChange(periode, `${newAnnee}-${moisValue}`);
    }
  };

  const handleMoisChange = (newMois: string | null) => {
    if (!newMois) return;
    onChange(periode, `${anneeValue}-${newMois}`);
  };

  return (
    <Group gap="md" align="center">
      <Calendar size={20} weight="duotone" />

      <SegmentedControl
        value={periode}
        onChange={handlePeriodeChange}
        data={[
          { label: 'Année', value: 'annee' },
          { label: 'Mois', value: 'mois' }
        ]}
      />

      <Select
        value={anneeValue}
        onChange={handleAnneeChange}
        data={annees}
        w={100}
        styles={{
          input: { fontWeight: 500 }
        }}
      />

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
    </Group>
  );
}
