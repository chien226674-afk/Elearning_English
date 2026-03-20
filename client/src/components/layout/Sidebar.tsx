import { Home, Mic, BookOpen, BarChart3, User } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useEffect, useState } from "react"
import api from "@/lib/axios"

export default function Sidebar() {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/users/stats');
        setLevel(res.data.level || 1);
        setExp(res.data.currentExp || 0);
      } catch (error) {
        console.error("Failed to fetch user level", error);
      }
    };
    if (user) fetchStats();
  }, [user]);

  const progressExp = exp % 100;
  const progressPercent = Math.min(100, Math.max(0, progressExp));

  return (
    <aside className="hidden md:flex w-64 min-h-full flex-shrink-0 bg-gray-100 dark:bg-slate-900 border-r dark:border-slate-800 flex-col justify-between p-4">

      <div>
        {/* Profile */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full border-2 border-green-500 flex items-center justify-center bg-white overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-gray-500" />
            )}
          </div>

          <div className="flex flex-col">
            <p className="font-semibold text-gray-800 dark:text-white">{user?.username || "Học viên"}</p>
            <p className="text-blue-600 text-sm font-medium">Level {level}</p>

            {/* XP Bar */}
            <div className="relative w-40 h-6 bg-gray-200 rounded-full overflow-hidden mt-1">

              {/* progress */}
              <div
                className="bg-green-500 h-full rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercent}%` }}
              />

              {/* text */}
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-600">
                {progressExp} / 100 XP
              </div>

            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="space-y-2">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 font-medium transition-colors hover:bg-gray-200 dark:hover:bg-slate-800 ${isActive ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20" : ""}`
            }
          >
            <Home size={18} />
            Trang chủ
          </NavLink>

          <NavLink
            to="/practice"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 font-medium transition-colors hover:bg-gray-200 ${isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`
            }
          >
            <Mic size={18} />
            Luyện tập
          </NavLink>

          <NavLink
            to="/lessons"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 font-medium transition-colors hover:bg-gray-200 ${isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`
            }
          >
            <BookOpen size={18} />
            Bài học
          </NavLink>

          <NavLink
            to="/progress"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 font-medium transition-colors hover:bg-gray-200 ${isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`
            }
          >
            <BarChart3 size={18} />
            Tiến độ
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 font-medium transition-colors hover:bg-gray-200 ${isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`
            }
          >
            <User size={18} />
            Hồ sơ
          </NavLink>

        </nav>
      </div>


    </aside>
  )
}