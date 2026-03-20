import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import api from "@/lib/axios";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: "error", text: "Mật khẩu không khớp" });
            return;
        }
        if (password.length < 6) {
            setMessage({ type: "error", text: "Mật khẩu phải dài hơn 6 ký tự" });
            return;
        }

        try {
            setIsSubmitting(true);
            setMessage({ text: "", type: "" });
            const response = await api.post("/auth/reset-password", {
                token,
                newPassword: password
            });
            setMessage({ type: "success", text: response.data.message });
            setTimeout(() => navigate("/login"), 3000);
        } catch (error: any) {
            setMessage({ type: "error", text: error.response?.data?.message || "Đã xảy ra lỗi" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <AuthLayout message="Lỗi">
                <h2 className="text-2xl font-bold mb-2 text-red-600">Link không hợp lệ</h2>
                <p className="text-gray-500 mb-6">Không tìm thấy token đổi mật khẩu.</p>
                <Link to="/login" className="text-green-600 hover:underline">Về trang Đăng nhập</Link>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout message="Hãy chọn một mật khẩu bảo mật.">
            <h2 className="text-2xl font-bold mb-2">Đặt lại mật khẩu mới</h2>
            <p className="text-gray-500 text-sm mb-6">
                Nhập mật khẩu mới cho tài khoản của bạn.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Messages */}
                {message.text && (
                    <div className={`p-3 rounded text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Change form */}
                {message.type !== 'success' && (
                    <>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Mật khẩu mới"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border rounded-full px-4 py-2 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-gray-500"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Xác nhận mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border rounded-full px-4 py-2 pr-10"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-green-500 text-white rounded-full py-3 hover:bg-green-600 transition disabled:opacity-50"
                        >
                            {isSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                        </button>
                    </>
                )}
            </form>
        </AuthLayout>
    );
}
