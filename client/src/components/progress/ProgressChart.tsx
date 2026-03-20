"use client"

import { useState, useEffect } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import api from "@/lib/axios"

export function ProgressChart() {
  const [data, setData] = useState<{ week: string; điểm: number }[]>([])
  const [avgScore, setAvgScore] = useState(0)

  useEffect(() => {
    api.get('/api/users/progress-charts').then(res => {
      const chartData = res.data.pronunciation || []
      setData(chartData)
      const total = chartData.reduce((acc: number, curr: any) => acc + curr.điểm, 0)
      setAvgScore(chartData.length ? Math.round(total / chartData.length) : 0)
    }).catch(console.error)
  }, [])

  return (
    <Card className="rounded-2xl shadow-sm">

      <CardHeader className="flex justify-between">

        <div>
          <p className="text-sm text-muted-foreground">
            Điểm phát âm theo thời gian
          </p>

          <p className="text-3xl font-bold">
            {avgScore}
            <span className="text-sm text-muted-foreground ml-1">
              /100 Trung bình 4 tuần
            </span>
          </p>
        </div>

        {/* <div className="flex items-center gap-1 text-green-600 text-sm bg-green-100 px-3 py-1 rounded-full">
          <TrendingUp size={16} />
          +5%
        </div> */}

      </CardHeader>

      <CardContent className="h-62.5">

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>

            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            <XAxis dataKey="week" tickLine={false} axisLine={false} />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="điểm"
              stroke="#22c55e"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorScore)"
            />

          </AreaChart>
        </ResponsiveContainer>

      </CardContent>

    </Card>
  )
}