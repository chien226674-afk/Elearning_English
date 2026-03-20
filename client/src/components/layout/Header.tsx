import { useState, useEffect } from "react"
import { User, Menu, X, Flame } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import GlobalSearch from "@/components/search/GlobalSearch"
import api from "@/lib/axios"

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/api/users/stats').then(res => {
        setStreak(res.data?.streak || 0);
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full border-b dark:border-slate-800 bg-[#f3f5f2] dark:bg-slate-900 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center h-16 px-4 md:px-6 gap-8">

        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate("/")}>
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        </div>

        {/* Search — kế bên logo */}
        {isAuthenticated && <GlobalSearch />}

        {/* Navigation — chỉ hiện khi đã đăng nhập (desktop) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `cursor-pointer pb-1 border-b-2 transition-colors ${isActive
                  ? "text-green-600 border-green-500"
                  : "text-gray-700 dark:text-gray-300 border-transparent hover:text-green-600 dark:hover:text-green-400 hover:border-green-300"
                }`
              }
            >
              Trang chủ
            </NavLink>

            <NavLink
              to="/practice"
              className={({ isActive }) =>
                `cursor-pointer pb-1 border-b-2 transition-colors ${isActive
                  ? "text-green-600 border-green-500"
                  : "text-gray-700 dark:text-gray-300 border-transparent hover:text-green-600 dark:hover:text-green-400 hover:border-green-300"
                }`
              }
            >
              Luyện tập
            </NavLink>

            <NavLink
              to="/lessons"
              className={({ isActive }) =>
                `cursor-pointer pb-1 border-b-2 transition-colors ${isActive
                  ? "text-green-600 border-green-500"
                  : "text-gray-700 dark:text-gray-300 border-transparent hover:text-green-600 dark:hover:text-green-400 hover:border-green-300"
                }`
              }
            >
              Bài Học
            </NavLink>

            <NavLink
              to="/progress"
              className={({ isActive }) =>
                `cursor-pointer pb-1 border-b-2 transition-colors ${isActive
                  ? "text-green-600 border-green-500"
                  : "text-gray-700 dark:text-gray-300 border-transparent hover:text-green-600 dark:hover:text-green-400 hover:border-green-300"
                }`
              }
            >
              Tiến độ
            </NavLink>
          </nav>
        )}

        {/* Actions — đẩy sang phải */}
        <div className="flex items-center gap-4 ml-auto shrink-0">

          {/* Streak — thay thế cho Bell */}
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100/80 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-500/20 transition-colors">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
              <span className="text-sm font-bold text-orange-700 dark:text-orange-500">{streak}</span>
            </div>
          )}

          {/* User Info / Avatar hoặc nút Đăng nhập */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium mr-1 hidden sm:block text-gray-700 dark:text-gray-200">{user.username}</span>
              <button
                onClick={() => navigate('/profile')}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-orange-200 overflow-hidden"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-orange-700" />
                )}
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="px-4 py-1.5 text-sm bg-green-500 text-white rounded-full hover:bg-green-600 font-medium">
              Đăng nhập
            </button>
          )}

          {/* Mobile Menu Button — chỉ hiện khi đã đăng nhập */}
          {isAuthenticated && (
            <button
              onClick={toggleMobileMenu}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 ml-1"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-green-700" />
              ) : (
                <Menu className="w-5 h-5 text-green-700" />
              )}
            </button>
          )}

        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-lg z-50">
          <nav className="flex flex-col py-4 ">
            <NavLink
              to="/"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `px-6 py-3 cursor-pointer transition-colors ${isActive
                  ? "text-green-600 bg-green-50 dark:bg-green-500/20 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`
              }
            >
              Trang chủ
            </NavLink>

            <NavLink
              to="/practice"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `px-6 py-3 cursor-pointer transition-colors ${isActive
                  ? "text-green-600 bg-green-50 dark:bg-green-500/10 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`
              }
            >
              Luyện tập
            </NavLink>

            <NavLink
              to="/lessons"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `px-6 py-3 cursor-pointer transition-colors ${isActive
                  ? "text-green-600 bg-green-50 dark:bg-green-500/10 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`
              }
            >
              Bài Học
            </NavLink>

            <NavLink
              to="/progress"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `px-6 py-3 cursor-pointer transition-colors ${isActive
                  ? "text-green-600 bg-green-50 dark:bg-green-500/10 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`
              }
            >
              Tiến độ
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}

