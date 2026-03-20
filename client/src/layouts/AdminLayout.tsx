import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, BookOpen, Layers, Trophy, LogOut } from "lucide-react";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { name: "Tổng quan", path: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Quản lý bài học", path: "/admin/lessons", icon: <BookOpen size={20} /> },
    { name: "Danh mục", path: "/admin/categories", icon: <Layers size={20} /> },
    { name: "Thành tựu", path: "/admin/achievements", icon: <Trophy size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b dark:border-slate-700">
          <Link to="/admin" className="text-xl font-bold text-green-600">
            Elearning Admin
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 font-medium"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold overflow-hidden">
                {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center justify-end px-8">
          {/* Có thể thêm search hoặc notification ở đây */}
          <div className="text-sm text-gray-500">
            Ngày: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-slate-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
