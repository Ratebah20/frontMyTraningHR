'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

interface TauxFormationContrat {
  annees: number[];
  typesContrat: Array<{ id: number; nom: string }>;
  parContrat: Array<{
    typeContrat: string;
    contratId: number;
    annees: {
      [annee: number]: {
        effectif: number;
        formes: number;
        tauxFormation: number;
      };
    };
  }>;
  totauxParAnnee: {
    [annee: number]: {
      effectif: number;
      formes: number;
      tauxFormation: number;
    };
  };
  meta: {
    includeInactifs: boolean;
    inactifsSansDate: number;
    nombreContrats: number;
    periodeAnalysee: string;
  };
}

const CONTRACT_COLORS: { [key: string]: string } = {
  'CDI': '#10b981',
  'CDD': '#0ea5e9',
  'Alternant': '#8b5cf6',
  'Stagiaire': '#f59e0b',
  'Interim': '#ec4899',
  'Prestataire': '#14b8a6',
  'default': '#6b7280',
};

function getContractColor(type: string): string {
  return CONTRACT_COLORS[type] || CONTRACT_COLORS['default'];
}

export function TauxFormationContratGraphique({
  data,
  selectedContrats,
  selectedAnnee,
  chartContainerClass,
}: {
  data: TauxFormationContrat;
  selectedContrats: string[];
  selectedAnnee: number | 'all';
  chartContainerClass: string;
}) {
  const contratsAffiches = data.parContrat.filter(c =>
    selectedContrats.length === 0 || selectedContrats.includes(c.contratId.toString())
  );

  if (selectedAnnee !== 'all') {
    const chartData = contratsAffiches
      .map(contrat => {
        const stats = contrat.annees[selectedAnnee];
        if (!stats || stats.effectif === 0) return null;
        return {
          name: contrat.typeContrat,
          taux: stats.tauxFormation,
          formes: stats.formes,
          effectif: stats.effectif,
          fill: getContractColor(contrat.typeContrat),
        };
      })
      .filter(Boolean);

    if (data.totauxParAnnee[selectedAnnee]) {
      chartData.push({
        name: 'Total',
        taux: data.totauxParAnnee[selectedAnnee].tauxFormation,
        formes: data.totauxParAnnee[selectedAnnee].formes,
        effectif: data.totauxParAnnee[selectedAnnee].effectif,
        fill: '#ff7900',
      });
    }

    return (
      <motion.div
        className={chartContainerClass}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="rgba(255,255,255,0.7)"
              tick={{ fill: 'white' }}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="rgba(255,255,255,0.7)"
              tick={{ fill: 'white' }}
              fontSize={12}
              width={90}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(26, 26, 46, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value}% (${props.payload.formes}/${props.payload.effectif} formes)`,
                'Taux de formation',
              ]}
            />
            <Bar dataKey="taux" radius={[0, 4, 4, 0]}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry?.fill || '#6b7280'} />
              ))}
              <LabelList
                dataKey="taux"
                position="right"
                fill="#ffffff"
                fontSize={12}
                fontWeight={600}
                formatter={(value: any) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  const chartData = data.annees.map(annee => {
    const point: any = { annee: annee.toString() };

    contratsAffiches.forEach(contrat => {
      const stats = contrat.annees[annee];
      if (stats) {
        point[contrat.typeContrat] = stats.tauxFormation;
      }
    });

    if (data.totauxParAnnee[annee]) {
      point['Total'] = data.totauxParAnnee[annee].tauxFormation;
    }

    return point;
  });

  return (
    <motion.div
      className={chartContainerClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="annee"
            stroke="rgba(255,255,255,0.7)"
            tick={{ fill: 'white' }}
            fontSize={12}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="rgba(255,255,255,0.7)"
            tick={{ fill: 'white' }}
            fontSize={12}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: 'rgba(26, 26, 46, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'white',
            }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Legend
            wrapperStyle={{ color: 'white', paddingTop: '20px' }}
          />
          {contratsAffiches.map(contrat => (
            <Line
              key={contrat.contratId}
              type="monotone"
              dataKey={contrat.typeContrat}
              stroke={getContractColor(contrat.typeContrat)}
              strokeWidth={2}
              dot={{ fill: getContractColor(contrat.typeContrat), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="Total"
            stroke="#ff7900"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: '#ff7900', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
