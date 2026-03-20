import { useForm } from "react-hook-form";
import { useState } from "react";
import api from "@/lib/axios";

type FormValues = {
    email: string;
};

export default function ForgotPasswordForm() {

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<FormValues>();

    const [success, setSuccess] = useState({ type: "", text: "" });

    const onSubmit = async (data: FormValues) => {
        try {
            setSuccess({ type: "", text: "" });

            const response = await api.post("/auth/forgot-password", {
                email: data.email
            });

            setSuccess({ type: "success", text: response.data.message || "Link khôi phục đã được gửi tới email của bạn." });
            reset();

        } catch (error: any) {
            setSuccess({ type: "error", text: error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại sau." });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* EMAIL */}
            <div>
                <input
                    {...register("email", {
                        required: "Email không được để trống",
                        pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Email không hợp lệ"
                        }
                    })}
                    placeholder="Nhập email của bạn"
                    className="w-full border rounded-full px-4 py-2"
                />

                {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                    </p>
                )}
            </div>

            {/* MESSAGE */}
            {success && success.text && (
                <p className={`text-sm ${success.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {success.text}
                </p>
            )}

            {/* BUTTON */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-500 text-white rounded-full py-3 hover:bg-green-600 transition"
            >
                {isSubmitting ? "Đang gửi..." : "Gửi link khôi phục"}
            </button>

        </form>
    );
}