import { Link } from "react-router-dom"

export default function CTASection() {
    return (
        <section className="py-20">

            <div className="max-w-5xl mx-auto px-6">

                <div className="bg-linear-to-r from-green-700 to-green-900 text-white rounded-3xl p-16 text-center">

                    <h2 className="text-3xl font-bold">
                        Bắt đầu hành trình của bạn ngay hôm nay
                    </h2>

                    <p className="mt-4 text-green-100">
                        Tham gia cùng hàng ngàn học viên khác.
                    </p>

                    <Link to="/login" className="mt-8 inline-block bg-green-400 px-8 py-4 rounded-full font-semibold hover:bg-green-500 cursor-pointer">
                        Bắt đầu luyện tập miễn phí 🚀
                    </Link>

                </div>

            </div>

        </section>
    )
}