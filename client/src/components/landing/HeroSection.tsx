// import { Rocket } from "lucide-react"
import { Link } from "react-router-dom"

export default function HeroSection() {
    return (
        <section className="max-w-6xl mx-auto px-6 py-15 grid md:grid-cols-2 gap-10 items-center">

            <div>

                <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs font-semibold">
                    CÔNG NGHỆ AI TIÊN TIẾN NHẤT
                </span>

                <h1 className="text-5xl font-bold mt-6 leading-tight">
                    Luyện nói tiếng Anh với
                    <span className="text-green-500"> AI thông minh</span>
                </h1>

                <p className="mt-6 text-gray-500">
                    Cải thiện phát âm và sự tự tin của bạn mỗi ngày với AI riêng.
                    Phản hồi tức thì, lộ trình cá nhân hóa.
                </p>

                <div className="flex gap-4 mt-8">

                    <Link to="/login" className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 inline-block text-center cursor-pointer">
                        Bắt đầu luyện nói
                    </Link>
                </div>

            </div>

            <div className="flex  justify-center">
                <img
                    src="/landing1.jpg"
                    className="w-200"
                />
            </div>

        </section>
    )
}