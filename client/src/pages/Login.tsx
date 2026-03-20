import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/form/LoginForm";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

export default function Login() {
  const [googleError, setGoogleError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      setGoogleError("");
      const response = await api.post("/auth/google", {
        token: credentialResponse.credential, // id_token từ Google
      });
      const { accessToken, user } = response.data;
      login(accessToken, user);
      if (user.role === 'ADMIN') {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      setGoogleError(error.response?.data?.message || "Đăng nhập Google thất bại");
    }
  };

  return (
    <AuthLayout message="Hãy cùng cải thiện kỹ năng nói tiếng Anh của bạn nào!">

      <h2 className="text-2xl font-bold mb-2">Chào mừng bạn quay lại</h2>
      <p className="text-gray-500 text-sm mb-6">
        Đăng nhập để tiếp tục hành trình học tập của bạn.
      </p>

      {/* Google Login */}
      <div className="flex justify-center mb-4">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setGoogleError("Đăng nhập Google thất bại")}
          width="100%"
          text="continue_with"
          shape="pill"
        />
      </div>

      {googleError && (
        <p className="text-red-500 text-sm text-center mb-3">{googleError}</p>
      )}

      <div className="text-center text-xs text-gray-400 mb-4">
        HOẶC ĐĂNG NHẬP BẰNG EMAIL
      </div>

      <LoginForm />
      <p className="text-center text-sm mt-4">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="text-green-600 hover:underline">Đăng ký</Link>
      </p>

    </AuthLayout>
  );
}
