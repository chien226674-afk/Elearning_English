"use client"

import { useState, useEffect } from "react"
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    ResponsiveContainer,
    Tooltip
} from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import api from "@/lib/axios"

export function WeeklyChart() {
    const [data, setData] = useState<{ day: string; Giờ: number }[]>([])
    const [totalHours, setTotalHours] = useState("0")

    useEffect(() => {
        api.get('/api/users/progress-charts').then(res => {
            const wData = res.data.weekly || []
            setData(wData)
            const sum = wData.reduce((acc: number, curr: any) => acc + curr.Giờ, 0)
            setTotalHours(sum.toFixed(1))
        }).catch(console.error)
    }, [])

    return (
        <Card className="rounded-2xl shadow-sm">

            <CardHeader className="flex justify-between">

                <div>
                    <p className="text-sm text-muted-foreground">
                        Hoạt động hàng tuần
                    </p>

                    <p className="text-3xl font-bold">
                        {totalHours}
                        <span className="text-sm text-muted-foreground ml-1">
                            Giờ
                        </span>
                    </p>
                </div>

                {/* <div className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm flex gap-1">
                    <TrendingUp size={16} />
                    +1.5h
                </div> */}

            </CardHeader>

            <CardContent className="h-55">

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>

                        <CartesianGrid vertical={false} strokeDasharray="3 3" />

                        <XAxis dataKey="day" tickLine={false} axisLine={false} />

                        <Tooltip />

                        <Bar
                            dataKey="Giờ"
                            fill="#22c55e"
                            radius={[8, 8, 0, 0]}
                        />

                    </BarChart>
                </ResponsiveContainer>

            </CardContent>

        </Card>
    )
}