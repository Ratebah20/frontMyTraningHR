'use client';

/**
 * Graphiques Recharts de la synthèse des évaluations par formation.
 * Fichier chargé en différé via next/dynamic (ssr: false) depuis
 * `app/(dashboard)/evaluations/page.tsx` : Recharts reste hors du bundle
 * initial, comme sur les autres pages KPI du projet.
 */

import { useRef } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExportChartButton } from '@/components/ExportChartButton';

/** Couleur unique des questions à choix / oui-non */
const CHOICE_COLOR = '#4C6EF5';

/**
 * Échelle rouge -> vert des notes 1 à 5. On colore par VALEUR et non par
 * position : une note absente de la répartition ne doit pas décaler l'échelle.
 */
const NOTE_COLORS: Record<string, string> = {
  '1': '#FA5252',
  '2': '#FD7E14',
  '3': '#FAB005',
  '4': '#82C91E',
  '5': '#40C057',
};
const NOTE_FALLBACK_COLOR = '#868E96';

export interface QuestionRepartitionPoint {
  valeur: string;
  nombre: number;
}

/**
 * L'API renvoie les valeurs brutes stockées dans les réponses : une question
 * de type `oui_non` remonte donc `'true'` / `'false'`, et non « Oui » / « Non ».
 * La mise en forme appartient à l'affichage, pas au calcul.
 */
const LIBELLES_VALEURS: Record<string, string> = {
  true: 'Oui',
  false: 'Non',
  oui: 'Oui',
  non: 'Non',
};

function libelleValeur(valeur: string): string {
  return LIBELLES_VALEURS[String(valeur).toLowerCase()] ?? valeur;
}

interface QuestionRepartitionChartProps {
  data: QuestionRepartitionPoint[];
  /** Nom du PNG exporté (sans extension) */
  filename: string;
  /** Les notes se colorent du rouge au vert ; les autres valeurs gardent une couleur unique */
  isNote?: boolean;
  height?: number;
}

/** Répartition des réponses d'une question fermée, en barres verticales. */
export function QuestionRepartitionChart({
  data,
  filename,
  isNote = false,
  height = 240,
}: QuestionRepartitionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) return null;

  // L'API ne garantit pas l'ordre de la répartition : les notes se lisent
  // toujours de 1 à 5, le reste garde l'ordre reçu.
  const points = isNote
    ? [...data].sort((a, b) => Number(a.valeur) - Number(b.valeur))
    : data;

  return (
    <div ref={chartRef} style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 5 }}>
        <ExportChartButton containerRef={chartRef} filename={filename} />
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={points} margin={{ top: 24, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="valeur"
            tick={{ fontSize: 12 }}
            interval={0}
            tickFormatter={(value: string) => (isNote ? `${value}/5` : libelleValeur(value))}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <RechartsTooltip
            formatter={(value: any) => [`${value} réponse(s)`, 'Nombre']}
            labelFormatter={(label: string) =>
              isNote ? `Note ${label}/5` : libelleValeur(label)
            }
          />
          <Bar dataKey="nombre" radius={[4, 4, 0, 0]}>
            {points.map((entry) => (
              <Cell
                key={entry.valeur}
                fill={
                  isNote
                    ? (NOTE_COLORS[String(Math.round(Number(entry.valeur)))] || NOTE_FALLBACK_COLOR)
                    : CHOICE_COLOR
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default QuestionRepartitionChart;
