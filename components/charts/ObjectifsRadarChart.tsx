'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

interface RadarDataItem {
  category: string;
  atteinte: number;
  objectif: number;
  completion: number;
}

export function ObjectifsRadarChart({ data }: { data: RadarDataItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="#555" />
        <PolarAngleAxis
          dataKey="category"
          tick={({ x, y, payload, textAnchor }: any) => (
            <text x={x} y={y} fill="#ffffff" fontSize={12} textAnchor={textAnchor} dy={4}>
              {payload.value}
            </text>
          )}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Objectif cible (%)"
          dataKey="objectif"
          stroke="#228be6"
          fill="#228be6"
          fillOpacity={0.15}
          strokeDasharray="5 5"
          strokeWidth={2}
        />
        <Radar
          name="Taux d'atteinte (%)"
          dataKey="atteinte"
          stroke="#ff7900"
          fill="#ff7900"
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <RechartsTooltip
          contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #373A40', borderRadius: 8 }}
          labelStyle={{ color: '#c1c2c5' }}
          formatter={(value: number) => `${value}%`}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
