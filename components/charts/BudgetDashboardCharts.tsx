'use client';

/**
 * Graphiques Recharts du tableau de bord budgétaire (budget/dashboard).
 * Fichier chargé en différé via next/dynamic (ssr: false) pour sortir
 * Recharts du bundle initial de la page.
 */

import { useRef } from 'react';
import {
  AreaChart,
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
  ResponsiveContainer,
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

/** Évolution mensuelle de la consommation (AreaChart). */
export function BudgetEvolutionAreaChart({
  data,
  filename,
}: {
  data: Array<{ mois: string; montant: number; sessions: number }>;
  filename: string;
}) {
  return (
    <ExportableChart filename={filename}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mois" />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
          <RechartsTooltip
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#000' }}
          />
          <Area
            type="monotone"
            dataKey="montant"
            stroke="#4C6EF5"
            fill="#4C6EF5"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}

/** Top 5 départements (BarChart). */
export function BudgetTopDepartementsBarChart({
  data,
  filename,
}: {
  data: Array<{ name: string; budget: number; moyenne: number }>;
  filename: string;
}) {
  return (
    <ExportableChart filename={filename}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
          <RechartsTooltip
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#000' }}
          />
          <Bar dataKey="budget" fill="#15AABF" />
        </BarChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}

/** Répartition par catégorie (PieChart). */
export function BudgetCategoriesPieChart({
  data,
  totalConsomme,
  filename,
}: {
  data: Array<{ name: string; value: number; sessions: number }>;
  totalConsomme: number;
  filename: string;
}) {
  return (
    <ExportableChart filename={filename}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${totalConsomme > 0 ? formatPercentage(entry.value / totalConsomme * 100) : '0%'}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#000' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
