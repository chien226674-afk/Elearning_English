import { useForm } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

type LoginFormValues = {
    email: string;
    password: string;
};

export default function LoginForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>();

    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setServerError("");
            const response = await api.post("/auth/login", {
                email: data.email,
                password: data.password,
            });

            // Extract token and user data from the API response
            const { accessToken, user } = response.data;

            // Call the context to set auth state and cache
            login(accessToken, user);

            // Redirect to admin or home depending on role
            if (user.role === 'ADMIN') {
                navigate("/admin");
            } else {
                navigate("/");
            }

        } catch (error: any) {
            setServerError(error.response?.data?.message || "Đăng nhập thất bại");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div>
                <input
                    {...register("email", {
                        required: "Email là bắt buộc",
                        pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Email không hợp lệ",
                        },
                    })}
                    placeholder="Nhập email của bạn"
                    className="w-full border rounded-full px-4 py-2"
                />

                {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                        {errors.email.message}
                    </p>
                )}
            </div>

            {/* Password */}
            <div className="relative">

                <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                        required: "Mật khẩu là bắt buộc",
                        minLength: {
                            value: 6,
                            message: "Mật khẩu tối thiểu 6 ký tự",
                        },
                    })}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full border rounded-full px-4 py-2 pr-10"
                />

                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                        {errors.password.message}
                    </p>
                )}

            </div>

            {/* Server error */}
            {serverError && (
                <p className="text-red-500 text-sm text-center">
                    {serverError}
                </p>
            )}

            <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm border-b border-transparent hover:border-gray-500 text-gray-500">
                    Quên mật khẩu?
                </Link>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full py-3 font-semibold transition disabled:opacity-50"
            >
                {isSubmitting ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
            </button>

            {/* Google Login Placeholder (Requires backend adjustment for implicit flow or id_token usage) */}
            {/*
            <div className="mt-4 flex flex-col items-center">
                <span className="text-gray-500 text-sm mb-2">Hoặc đăng nhập bằng</span>
                <button 
                  type="button" 
                  onClick={() => handleGoogleLogin()} 
                  className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full py-3 font-semibold transition flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </button>
            </div>
            */}

        </form>
    );
}