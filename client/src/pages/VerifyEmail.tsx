import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import api from '@/lib/axios';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Đang xác thực email của bạn...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Không tìm thấy token xác thực.');
            return;
        }

        // AbortController để huỷ request khi cleanup (React 18 StrictMode)
        const controller = new AbortController();

        api.get(`/auth/verify-email?token=${token}`, {
            signal: controller.signal,
        })
            .then((response) => {
                setStatus('success');
                setMessage(response.data.message || 'Xác thực email thành công!');
            })
            .catch((error) => {
                // Bỏ qua lỗi do AbortController huỷ request
                if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
                setStatus('error');
                setMessage(error.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
            });

        // Cleanup: huỷ request khi component unmount (StrictMode chạy 2 lần)
        return () => controller.abort();

    }, [token]);

    if (!token) {
        return (
            <AuthLayout message="Có lỗi xảy ra">
                <div className="flex flex-col items-center py-6">
                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Thiếu token xác thực</h2>
                    <p className="text-gray-600 text-center mb-6">Xin vui lòng kiểm tra lại link xác thực trong email của bạn.</p>
                    <Link to="/login" className="bg-green-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600">
                        Quay lại đăng nhập
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout message="Xác thực Email">
            <div className="flex flex-col items-center py-6">

                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                        <p className="text-gray-600">Đang xác thực email của bạn...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-gray-800">Thành công!</h2>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <Link to="/login" className="bg-green-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-600">
                            Đăng nhập ngay
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center text-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-gray-800">Xác thực thất bại</h2>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <Link to="/login" className="border border-green-500 text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-green-50">
                            Quay lại đăng nhập
                        </Link>
                    </div>
                )}

            </div>
        </AuthLayout>
    );
}


