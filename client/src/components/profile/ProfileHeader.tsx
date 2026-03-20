import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"
import EditProfileModal from "./EditProfileModal"

export default function ProfileHeader() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-sm">

      <div className="relative w-fit mx-auto mb-4">
        <div className="p-[3px] rounded-full bg-gradient-to-r from-green-400 to-blue-500">
          <img
            src={user?.avatar || "https://i.pravatar.cc/100"}
            className="w-20 h-20 rounded-full object-cover"
          />
        </div>

        <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full border-2 border-white">
          <Check size={14} />
        </div>
      </div>
      <h2 className="font-semibold text-lg dark:text-white">{user?.username || "Người dùng"}</h2>

      <span className="text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full border border-green-200 dark:border-green-500/20 shadow-sm block w-fit mx-auto mt-2">
        {user?.mo_ta || "Chưa có mô tả"}
      </span>

      <div className="mt-6">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 rounded-full px-8 py-6 font-semibold shadow-lg shadow-green-100"
        >
          Chỉnh sửa hồ sơ
        </Button>
      </div>

      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}