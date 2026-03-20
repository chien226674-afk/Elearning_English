import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { X, Camera, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ProfileFormValues {
    username: string;
    description: string;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
    const { user, updateUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        defaultValues: {
            username: user?.username || "",
            description: user?.mo_ta || "",
        },
    });

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError("Kích thước ảnh không được vượt quá 5MB");
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            setIsSubmitting(true);
            setError("");

            let avatarUrl = user?.avatar || "";

            // Nếu có chọn file mới, upload lên trước
            if (selectedFile) {
                const formData = new FormData();
                formData.append("avatar", selectedFile);

                const uploadRes = await api.post("/api/users/upload-avatar", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                avatarUrl = uploadRes.data.avatarUrl;
            }

            const response = await api.put("/api/users/profile", {
                ...data,
                avatar: avatarUrl
            });

            updateUser(response.data.user);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật hồ sơ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 flex items-center justify-between border-b">
                    <h3 className="text-xl font-bold text-gray-800">Chỉnh sửa hồ sơ</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    {/* Avatar Selection */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="p-[3px] rounded-full bg-gradient-to-r from-green-400 to-blue-500 transition-transform group-hover:scale-105">
                                <img
                                    src={avatarPreview || "https://i.pravatar.cc/100"}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white"
                                />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="text-xs text-gray-500">Bấm vào ảnh để thay đổi (Tối đa 5MB)</p>
                    </div>

                    {/* Username Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Tên hiển thị</label>
                        <Input
                            {...register("username", { required: "Tên hiển thị là bắt buộc" })}
                            placeholder="Nhập tên của bạn"
                            className="rounded-xl border-gray-200 focus:ring-green-500"
                        />
                        {errors.username && (
                            <p className="text-red-500 text-xs mt-1 ml-1">{errors.username.message}</p>
                        )}
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Mô tả bản thân</label>
                        <textarea
                            {...register("description")}
                            placeholder="Hãy giới thiệu một chút về bạn..."
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 rounded-full py-6 font-semibold border-gray-200 hover:bg-gray-50"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-green-500 hover:bg-green-600 rounded-full py-6 font-semibold text-white shadow-lg shadow-green-200 transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <UploadCloud size={20} />
                                    <span>Lưu thay đổi</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

