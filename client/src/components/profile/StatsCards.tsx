import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Flame } from "lucide-react"
import api from "@/lib/axios"

export default function StatsCards() {
  const [stats, setStats] = useState({ streak: 0, totalMinutes: 0, dailyMinutes: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/users/stats');
        if (res.data) {
          setStats({
            streak: res.data.streak || 0,
            totalMinutes: res.data.totalMinutes || 0,
            dailyMinutes: res.data.dailyMinutes || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile stats:', error);
      }
    };
    fetchStats();
  }, []);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return { h, m };
  };

  const { h, m } = formatTime(stats.totalMinutes);

  return (
    <div className="grid grid-cols-2 gap-5">

      <Card className="rounded-xl dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-5 flex items-center gap-4">
          <Clock className="text-green-500" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Thời gian luyện tập</p>
            <p className="text-xl font-bold dark:text-white">{h}h <span className="text-sm text-gray-400">{m}m</span></p>
            {stats.dailyMinutes > 0 && (
              <p className="text-[10px] text-green-600 font-medium">Hôm nay: {stats.dailyMinutes}m</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-5 flex items-center gap-4">
          <Flame className="text-orange-500" />
          <div>
            <p className="text-xs text-gray-500">CHUỖI NGÀY HIỆN TẠI</p>
            <p className="text-xl font-bold dark:text-white">{stats.streak} <span className="text-sm text-gray-400">Ngày</span></p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}