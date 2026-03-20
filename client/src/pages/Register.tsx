import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/form/RegisterForm";
import { Link } from "react-router-dom";

export default function Register() {
    return (
        <AuthLayout message="Bắt đầu hành trình học tiếng Anh ngay hôm nay!">

            <h2 className="text-2xl font-bold mb-2">Tạo tài khoản</h2>
            <p className="text-gray-500 text-sm mb-6">
                Đăng ký để bắt đầu luyện nói với AI.
            </p>

            <RegisterForm />

            <p className="text-center text-sm mt-4">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-green-600 hover:underline">Đăng nhập</Link>
            </p>

        </AuthLayout>
    );
}