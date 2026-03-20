
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Users, CheckCircle, ArrowRight, Trophy, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "@/lib/axios"
import LessonCard from "@/components/lesson/LessonCard"
import hippoAvatar from "@/assets/hippo_mascot_speaking_1773799748980.png"

interface Lesson {
  ma_bai_hoc: string
  tieu_de: string
  mo_ta: string
  do_kho: string
  thoi_luong_phut: number
  mau_the_hien_thi: string
  ten_icon: string
  ten_danh_muc: string
  da_hoc: boolean
}

export default function HomeDashboard() {
  const navigate = useNavigate()
  const [suggestedLessons, setSuggestedLessons] = useState<Lesson[]>([])
  const [stats, setStats] = useState({ 
    streak: 0, 
    avgScore: 0, 
    totalCompleted: 0,
    completedToday: 0,
    avgScoreDelta: 0,
    studiedToday: false 
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuggestedLessons = async () => {
      try {
        const [lessonsRes, statsRes] = await Promise.all([
          api.get('/api/lessons/suggested?limit=2'),
          api.get('/api/users/stats')
        ])
        setSuggestedLessons(lessonsRes.data)
        if (statsRes.data) {
          setStats({
            streak: statsRes.data.streak || 0,
            avgScore: statsRes.data.avgScore || 0,
            totalCompleted: statsRes.data.totalCompleted || 0,
            completedToday: statsRes.data.completedToday || 0,
            avgScoreDelta: statsRes.data.avgScoreDelta || 0,
            studiedToday: statsRes.data.studiedToday || false
          })
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setSuggestedLessons([])
      } finally {
        setLoading(false)
      }
    }
    fetchSuggestedLessons()
  }, [])

  const handleQuickStart = async () => {
    try {
      const res = await api.get('/api/lessons/quick-start')
      if (res.data && res.data.lessonId) {
        navigate(`/speaking-practice/${res.data.lessonId}`)
      }
    } catch (error) {
      console.error('Failed to get quick start lesson:', error)
      navigate('/lessons')
    }
  }

  // Map API data to LessonCard format (using database fields directly)
  const mapLessonToCard = (lesson: Lesson) => ({
    id: lesson.ma_bai_hoc,
    time: `${lesson.thoi_luong_phut || 10} phút`,
    title: lesson.tieu_de,
    desc: lesson.mo_ta,
    level: lesson.do_kho || 'CƠ BẢN',
    color: lesson.mau_the_hien_thi || 'green',
    iconName: lesson.ten_icon || 'Coffee',
    isCompleted: lesson.da_hoc
  })

  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 dark:bg-slate-900 min-h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-none">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Chào mừng trở lại!</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Bạn đã sẵn sàng luyện tiếng Anh hôm nay chưa?
          </p>
        </div>

        <Button
          className="bg-green-500 hover:bg-green-600 rounded-full px-6"
          onClick={handleQuickStart}
        >
          ▶ Bắt đầu nhanh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-none">

        <Card className="rounded-xl border-green-100 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="flex justify-between items-center p-5">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Flame className="text-orange-500" size={16} />
                Chuỗi ngày học
              </p>
              <p className="text-2xl font-bold dark:text-white">{stats.streak} Ngày</p>
            </div>
            {stats.studiedToday ? (
              <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full">
                +1 Ngày
              </span>
            ) : (
              <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                Hôm nay
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-green-100 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="flex justify-between items-center p-5">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Users size={16} />
                Điểm phát âm trung bình
              </p>
              <p className="text-2xl font-bold dark:text-white">{stats.avgScore}%</p>
            </div>
            {stats.avgScoreDelta !== 0 ? (
              <span className={`text-xs px-3 py-1 rounded-full ${stats.avgScoreDelta > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {stats.avgScoreDelta > 0 ? `+${stats.avgScoreDelta}%` : `${stats.avgScoreDelta}%`}
              </span>
            ) : (
              <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                0%
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-green-100 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="flex justify-between items-center p-5">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <CheckCircle size={16} />
                Bài học đã hoàn thành
              </p>
              <p className="text-2xl font-bold dark:text-white">{stats.totalCompleted}</p>
            </div>
            {stats.completedToday > 0 ? (
              <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full">
                +{stats.completedToday}
              </span>
            ) : (
              <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                +0
              </span>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Suggested Practice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">

        <div className="col-span-2 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-3 flex-none">
            <h2 className="font-semibold text-lg dark:text-white">Bài luyện tập đề xuất</h2>
            <span
              className="text-green-600 text-sm cursor-pointer hover:underline flex items-center gap-1"
              onClick={() => navigate('/lessons')}
            >
              Xem tất cả <ArrowRight size={14} />
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-0">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-6 h-full flex flex-col animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-gray-200 mb-6"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
                  <div className="mt-auto pt-6">
                    <div className="w-full bg-gray-200 rounded-2xl py-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedLessons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-0">
              {suggestedLessons.map((lesson) => (
                <LessonCard
                  key={lesson.ma_bai_hoc}
                  lesson={mapLessonToCard(lesson)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Chúc mừng! Bạn đã hoàn tất tất cả bài học.</p>
              <Button
                variant="link"
                className="text-green-600 mt-2"
                onClick={() => navigate('/lessons')}
              >
                Xem lại các bài đã học
              </Button>
            </div>
          )}
        </div>

        {/* Challenge */}
        <Card className="rounded-xl border-green-100 dark:border-slate-700 dark:bg-slate-800 flex flex-col justify-between p-4 flex-1 min-h-0">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Thử thách luyện nói hôm nay dành cho bạn!
            </p>

            <div 
              className="w-44 h-44 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100 overflow-hidden border-4 border-green-200 shadow-md hover:scale-110 hover:border-green-500 hover:shadow-xl hover:shadow-green-200/50 transition-all duration-300 cursor-pointer"
              onClick={() => navigate('/lessons')}
            >
              <img src={hippoAvatar} alt="Hippo Challenge Toolkit" className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col gap-2 items-center mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-orange-50 dark:bg-orange-500/10 px-4 py-1.5 rounded-full border border-orange-100 dark:border-orange-500/20">
                <Trophy size={14} className="text-orange-500" />
                <span>Phần thưởng: <span className="text-orange-600">+50 EXP</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                <span>Thời gian ước tính: 5-10 phút</span>
              </div>
            </div>
          </div>

          <Button 
            className="bg-green-500 hover:bg-green-600 rounded-full"
            onClick={() => navigate('/lessons')}
          >
            Bắt đầu thử thách
          </Button>
        </Card>

      </div>

    </div>
  )
}

