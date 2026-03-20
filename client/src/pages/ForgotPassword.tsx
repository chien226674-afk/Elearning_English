import { Link } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordForm from "@/components/form/ForgotPasswordForm";

export default function ForgotPassword() {
    return (
        <AuthLayout message="Đừng lo! Chúng tôi sẽ giúp bạn lấy lại mật khẩu.">

            <h2 className="text-2xl font-bold mb-2">Quên mật khẩu</h2>
            <p className="text-gray-500 text-sm mb-6">
                Nhập email của bạn để nhận link đặt lại mật khẩu.
            </p>

            <ForgotPasswordForm />

            <div className="text-center mt-4">
                <Link to="/login" className="text-sm text-green-600 hover:underline">
                    Quay lại đăng nhập
                </Link>
            </div>

        </AuthLayout>
    );
}