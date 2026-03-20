import hippo from "@/assets/hippo_mascot_speaking_1773799748980.png";

interface AuthLayoutProps {
    children: React.ReactNode;
    message: string;
}

export default function AuthLayout({ children, message }: AuthLayoutProps) {
    return (
        <div className="h-[calc(100vh-65px)] flex items-center justify-center bg-gray-100">
            <div className="w-225 bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-2">

                {/* LEFT */}
                <div className="bg-linear-to-br from-green-100 to-green-200 flex flex-col items-center justify-center p-8">
                    <div className="bg-white shadow-md rounded-xl px-6 py-3 text-center text-sm font-medium mb-6">
                        {message}
                    </div>

                    <img
                        src={hippo}
                        className="w-48 h-48 object-cover rounded-full shadow-lg border-4 border-white animate-bounce duration-[2000ms]"
                    />
                </div>

                {/* RIGHT */}
                <div className="p-10">{children}</div>

            </div>
        </div>
    );
}