import { useState, useEffect } from "react"
import { Trophy, Award, Star, Calendar, GraduationCap, Book, CheckCircle, Flame, BookOpen } from "lucide-react"
import api from "@/lib/axios"

const iconMap: Record<string, any> = {
  Trophy, Award, Star, Calendar, GraduationCap, Book, CheckCircle, Flame, BookOpen
}

export default function BadgeSection() {
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await api.get('/api/users/achievements')
        setAchievements(res.data)
      } catch (error) {
        console.error('Failed to fetch achievements:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAchievements()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="font-semibold mb-6 flex items-center gap-2 dark:text-white">
        <Trophy className="text-orange-500" size={20} />
        Thành tựu đã đạt được
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {achievements.filter(a => a.da_dat_duoc).map((achievement) => {
          const Icon = iconMap[achievement.ten_icon] || Award

          return (
            <div
              key={achievement.ma_thanh_tuu}
              className="relative group h-40 rounded-2xl border border-green-100 dark:border-green-500/20 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800"
            >
              {achievement.image_url ? (
                <img 
                  src={achievement.image_url} 
                  alt={achievement.ten_thanh_tuu} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                  <Icon size={40} />
                </div>
              )}

              {/* Overlay with Title */}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                <p className="text-white text-sm font-bold leading-tight drop-shadow-md">
                  {achievement.ten_thanh_tuu}
                </p>
              </div>

              <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full shadow-sm">
                Đã đạt
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}