'use client';

/**
 * Graphiques Recharts de la page analytics budgétaires (budget/analytics).
 * Fichier chargé en différé via next/dynamic (ssr: false) pour sortir
 * Recharts du bundle initial de la page.
 */

import { useRef } from 'react';
import { Paper, Text } from '@mantine/core';
import {
  Line,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { ExportChartButton } from '@/components/ExportChartButton';

const COLORS = ['#4C6EF5', '#15AABF', '#82C91E', '#FAB005', '#FA5252', '#BE4BDB', '#FD7E14', '#74C0FC'];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

/** Enveloppe un graphique Recharts et affiche un bouton d'export PNG en haut à droite. */
function ExportableChart({ filename, children }: { filename: string; children: React.ReactNode }) {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={chartRef} style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 5 }}>
        <ExportChartButton containerRef={chartRef} filename={filename} />
      </div>
      {children}
    </div>
  );
}

/** Comparaison des périodes (trimestres / semestres) - BarChart. */
export function PeriodesComparisonBarChart({
  data,
  filename,
}: {
  data: any[];
  filename: string;
}) {
  return (
    <ExportableChart filename={filename}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="periode" />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
          <RechartsTooltip
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#000' }}
          />
          <Bar
            dataKey="totalConsomme"
            fill="#4C6EF5"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}

/** Comparaison des budgets des top 5 départements - BarChart. */
export function DepartementsComparisonBarChart({
  departements,
  filename,
}: {
  departements: any[];
  filename: string;
}) {
  return (
    <ExportableChart filename={filename}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={departements.slice(0, 5).map((dept, index) => ({
            name: `#${index + 1}`,
            budget: dept.totalConsomme,
            fullName: dept.departementNom,
          }))}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
            tick={{ fontSize: 11 }}
          />
          <RechartsTooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <Paper p="xs" shadow="md" withBorder style={{ backgroundColor: 'white' }}>
                    <Text size="xs" fw={600}>{data.fullName}</Text>
                    <Text size="sm" c="blue" fw={700} mt={4}>
                      {formatCurrency(data.budget)}
                    </Text>
                  </Paper>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="budget"
            radius={[8, 8, 0, 0]}
            label={{
              position: 'top' as const,
              fontSize: 10,
              formatter: (value: any) => `${(value / 1000).toFixed(0)}k€`
            }}
          >
            {departements.slice(0, 5).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}

/** Répartition par catégorie (top 3) - PieChart. */
export function CategoriesRepartitionPieChart({
  categories,
  totalConsomme,
  filename,
}: {
  categories: any[];
  totalConsomme: number;
  filename: string;
}) {
  return (
    <ExportableChart filename={filename}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categories.map(cat => ({
              name: cat.categorieNom,
              value: cat.totalConsomme,
              percentage: (cat.totalConsomme / totalConsomme) * 100
            }))}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${formatPercentage(entry.percentage)}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {categories.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            labelStyle={{ color: '#000' }}
            contentStyle={{ maxWidth: 250 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}

/** Évolution mensuelle détaillée (montant + sessions) - ComposedChart. */
export function EvolutionMensuelleComposedChart({
  data,
  filename,
}: {
  data: Array<{ mois: string; montant: number; sessions: number }>;
  filename: string;
}) {
  return (
    <ExportableChart filename={filename}>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mois" />
          <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
          <YAxis yAxisId="right" orientation="right" />
          <RechartsTooltip
            formatter={(value: number, name: string) =>
              name === 'sessions' ? value : formatCurrency(value)
            }
            labelStyle={{ color: '#000' }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="montant"
            stroke="#4C6EF5"
            fill="#4C6EF5"
            fillOpacity={0.6}
            name="Montant"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="sessions"
            stroke="#82C91E"
            strokeWidth={2}
            name="Sessions"
            dot={{ fill: '#82C91E' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
