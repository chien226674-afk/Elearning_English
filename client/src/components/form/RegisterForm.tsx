import { useForm } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/axios";
import { Link } from "react-router-dom";

type RegisterFormValues = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function RegisterForm() {

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<RegisterFormValues>();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverMessage, setServerMessage] = useState({ text: "", type: "" });

    const password = watch("password");

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setServerMessage({ text: "", type: "" });

            const response = await api.post("/auth/register", {
                username: data.name,
                email: data.email,
                password: data.password,
            });

            setServerMessage({ text: response.data.message || "Đăng ký thành công!", type: "success" });

        } catch (error: any) {
            setServerMessage({
                text: error.response?.data?.message || "Lỗi khi đăng ký tài khoản",
                type: "error"
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name */}
            <div>
                <input
                    {...register("name", {
                        required: "Tên là bắt buộc",
                        minLength: { value: 2, message: "Tên tối thiểu 2 ký tự" }
                    })}
                    placeholder="Tên của bạn"
                    className="w-full border rounded-full px-4 py-2"
                />

                {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
            </div>

            {/* Email */}
            <div>
                <input
                    {...register("email", {
                        required: "Email là bắt buộc",
                        pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Email không hợp lệ"
                        }
                    })}
                    placeholder="Email"
                    className="w-full border rounded-full px-4 py-2"
                />

                {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
            </div>

            {/* Password */}
            <div className="relative">

                <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                        required: "Mật khẩu là bắt buộc",
                        minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" }
                    })}
                    placeholder="Mật khẩu"
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
                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}

            </div>

            {/* Confirm Password */}
            <div className="relative">

                <input
                    type={showConfirm ? "text" : "password"}
                    {...register("confirmPassword", {
                        required: "Vui lòng nhập lại mật khẩu",
                        validate: (value) =>
                            value === password || "Mật khẩu không khớp"
                    })}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full border rounded-full px-4 py-2 pr-10"
                />

                <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-gray-500"
                >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                        {errors.confirmPassword.message}
                    </p>
                )}

            </div>

            {/* Messages */}
            {serverMessage.text && (
                <div className={`p-3 rounded text-sm text-center ${serverMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {serverMessage.text}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-500 text-white rounded-full py-3 hover:bg-green-600 transition disabled:opacity-50"
            >
                {isSubmitting ? "Đang đăng ký..." : "ĐĂNG KÝ"}
            </button>

            {serverMessage.type === "success" && (
                <div className="text-center mt-4">
                    <Link to="/login" className="text-green-600 font-semibold hover:underline">
                        Chuyển đến trang Đăng nhập
                    </Link>
                </div>
            )}

        </form>
    );
}