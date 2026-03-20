import ProfileHeader from "../components/profile/ProfileHeader"
import StatsCards from "../components/profile/StatsCards"
import BadgeSection from "../components/profile/BadgeSection"
import SettingsSection from "../components/profile/SettingsSection"
import { LogOut } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 dark:bg-slate-900 min-h-screen space-y-8">
      <ProfileHeader />
      <StatsCards />
      <BadgeSection />
      <SettingsSection />

      <div className="flex items-center justify-center pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition font-medium border border-red-100 dark:border-red-500/20"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </div>
  )
}