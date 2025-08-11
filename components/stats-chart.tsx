"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { date: "Lun", nouveaux: 12, resolus: 8 },
  { date: "Mar", nouveaux: 15, resolus: 10 },
  { date: "Mer", nouveaux: 8, resolus: 12 },
  { date: "Jeu", nouveaux: 10, resolus: 9 },
  { date: "Ven", nouveaux: 7, resolus: 11 },
  { date: "Sam", nouveaux: 3, resolus: 4 },
  { date: "Dim", nouveaux: 2, resolus: 1 },
]

export function StatsChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Nouveaux</span>
                        <span className="font-bold text-muted-foreground">{payload[0].value}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Résolus</span>
                        <span className="font-bold">{payload[1].value}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Line type="monotone" dataKey="nouveaux" stroke="#ff6b00" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="resolus" stroke="#00ff6b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

