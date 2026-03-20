import { ProgressChart } from "@/components/progress/ProgressChart"
import { WeeklyChart } from "@/components/progress/WeeklyChart"
import { WrongWordsCard } from "@/components/progress/WrongWordsCard"
import { AchievementCard } from "@/components/progress/AchievementCard"

export default function ProgressPage() {
    return (
        <div className="p-8 space-y-6 min-h-screen bg-white dark:bg-slate-900">

            <div>
                <h1 className="text-3xl font-bold dark:text-white">
                    Phân Tích Tiến Độ Của Bạn
                </h1>
                <p className="text-muted-foreground">
                    Theo dõi sự phát triển và các cột mốc nói tiếng Anh của bạn.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-6">

                <div className="col-span-2">
                    <ProgressChart />
                </div>

                <WrongWordsCard />

                <div className="col-span-2">
                    <WeeklyChart />
                </div>

                <AchievementCard />

            </div>
        </div>
    )
}