import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import * as LucideIcons from "lucide-react"
import api from "@/lib/axios"

export function AchievementCard() {
    const [achievements, setAchievements] = useState<any[]>([])

    useEffect(() => {
        api.get('/api/users/achievements').then(res => {
            const earned = (res.data || []).filter((a: any) => a.da_dat_duoc)
            setAchievements(earned.slice(0, 2)) // show recent 2
        }).catch(console.error)
    }, [])

    return (
        <Card className="p-6 rounded-2xl bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20">
            <h3 className="font-semibold mb-3">Thành tựu</h3>
            <div className="space-y-3">
                {achievements.length > 0 ? achievements.map(ach => {
                    const Icon = (LucideIcons as any)[ach.ten_icon] || LucideIcons.Award
                    return (
                        <div key={ach.ma_thanh_tuu} className="bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                            <div className="bg-yellow-100 p-3 rounded-full shrink-0">
                                <Icon className="text-yellow-500 w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold">{ach.ten_thanh_tuu}</p>
                                <p className="text-sm text-muted-foreground">{ach.mo_ta}</p>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center justify-center shadow-sm text-sm text-muted-foreground">
                        Chưa có thành tựu nào
                    </div>
                )}
            </div>
        </Card>
    )
}