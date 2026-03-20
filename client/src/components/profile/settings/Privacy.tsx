import { useState } from "react";
import { useForm } from "react-hook-form";
import { Lock, ChevronRight, Key, Trash2, Mail, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EmailForm = {
  email: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
};

export default function Privacy() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emailForm = useForm<EmailForm>();
  const passwordForm = useForm<PasswordForm>();

  const onChangeEmail = async (data: EmailForm) => {
    try {
      setIsSubmitting(true);
      setError("");
      const res = await api.put("/api/users/change-email", data);
      updateUser(res.data.user);
      setSuccess("Thay đổi email thành công!");
      setTimeout(() => {
        setShowEmail(false);
        setSuccess("");
      }, 2000);
      emailForm.reset();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi thay đổi email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    try {
      setIsSubmitting(true);
      setError("");
      await api.put("/api/users/change-password", data);
      setSuccess("Đổi mật khẩu thành công!");
      setTimeout(() => {
        setShowPassword(false);
        setSuccess("");
      }, 2000);
      passwordForm.reset();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteAccount = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      await api.delete("/api/users/account");
      logout();
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi xóa tài khoản");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Main item */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <Lock className="text-gray-500" size={20} />
          <span>Quyền riêng tư & Bảo mật</span>
        </div>

        <ChevronRight
          size={18}
          className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""
            }`}
        />
      </div>

      {/* Sub menu */}
      {open && (
        <div className="ml-10 border-l">
          {/* Change Email - Hidden for Google Users */}
          {!user?.isGoogleUser && (
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
              onClick={() => setShowEmail(true)}
            >
              <Mail size={18} className="text-gray-500" />
              <span>Thay đổi email</span>
            </div>
          )}

          {/* Change Password - Hidden for Google Users */}
          {!user?.isGoogleUser && (
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
              onClick={() => setShowPassword(true)}
            >
              <Key size={18} className="text-gray-500" />
              <span>Đổi mật khẩu</span>
            </div>
          )}

          {/* Notice for Google Users */}
          {user?.isGoogleUser && (
            <div className="p-4 bg-blue-50/50 border-b border-blue-100/50">
              <p className="text-[11px] text-blue-600 flex items-center gap-2 italic">
                <AlertCircle size={12} />
                Tài khoản này được xác thực qua Google. Một số cài đặt sẽ được quản lý bởi Google.
              </p>
            </div>
          )}

          {/* Delete */}
          <div
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-red-50 text-red-500 transition"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 size={18} />
            <span className="font-medium">Xóa tài khoản</span>
          </div>
        </div>
      )}

      {/* Modal đổi email */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={emailForm.handleSubmit(onChangeEmail)}
            className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Thay đổi Email</h2>
              <p className="text-sm text-gray-500 mt-1">Vui lòng nhập email mới để thay đổi.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 animate-shake">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 text-xs rounded-xl">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Email mới</label>
              <Input
                {...emailForm.register("email", {
                  required: "Email là bắt buộc",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Email không hợp lệ",
                  },
                })}
                placeholder="example@gmail.com"
                className="rounded-xl border-gray-200 focus:ring-green-500"
              />
              {emailForm.formState.errors.email && (
                <p className="text-red-500 text-[10px] ml-1">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEmail(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-full py-5 border-gray-200"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full py-5 font-semibold shadow-lg shadow-green-100"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Lưu"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal đổi mật khẩu */}
      {showPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Đổi mật khẩu</h2>
              <p className="text-sm text-gray-500 mt-1">Mật khẩu mới phải có tối thiểu 6 ký tự.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 text-xs rounded-xl">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu hiện tại</label>
                <Input
                  type="password"
                  {...passwordForm.register("currentPassword", {
                    required: "Nhập mật khẩu hiện tại",
                  })}
                  placeholder="••••••••"
                  className="rounded-xl border-gray-200 focus:ring-green-500"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-red-500 text-[10px] ml-1">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu mới</label>
                <Input
                  type="password"
                  {...passwordForm.register("newPassword", {
                    required: "Nhập mật khẩu mới",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu tối thiểu 6 ký tự",
                    },
                  })}
                  placeholder="••••••••"
                  className="rounded-xl border-gray-200 focus:ring-green-500"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-red-500 text-[10px] ml-1">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPassword(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-full py-5 border-gray-200"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full py-5 font-semibold shadow-lg shadow-green-100"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Cập nhật"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Trash2 size={32} />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">Xác nhận xóa tài khoản?</h2>
              <p className="text-sm text-gray-500 mt-2">
                Hành động này không thể hoàn tác. Mọi dữ liệu của bạn sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDelete(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-full py-5 border-gray-200"
              >
                Hủy
              </Button>
              <Button
                onClick={onDeleteAccount}
                disabled={isSubmitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full py-5 font-semibold shadow-lg shadow-red-100"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Xóa vĩnh viễn"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}