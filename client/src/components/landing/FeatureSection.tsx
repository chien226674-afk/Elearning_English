import { Target, PenLine, BarChart3 } from "lucide-react"

export default function FeatureSection() {

    const features = [
        {
            icon: <Target size={20} />,
            title: "Chấm điểm AI chính xác",
            desc: "Phân tích từng âm tiết so với người bản xứ."
        },
        {
            icon: <PenLine size={20} />,
            title: "Luyện tập thời gian thực",
            desc: "Phản hồi ngay khi bạn đang nói."
        },
        {
            icon: <BarChart3 size={20} />,
            title: "Phân tích chuyên sâu",
            desc: "Đánh giá Accuracy, Fluency và Completeness."
        }
    ]

    return (
        <section className="bg-gray-50 py-20">

            <div className="max-w-6xl mx-auto px-6">

                <h2 className="text-3xl font-bold text-center">
                    Tính năng nổi bật
                </h2>

                <p className="text-center text-gray-500 mt-3">
                    Trải nghiệm phương pháp học hiện đại.
                </p>

                <div className="grid md:grid-cols-3 gap-8 mt-12">

                    {features.map((f, i) => (
                        <div
                            key={i}
                            className="bg-white p-6 rounded-xl shadow-sm"
                        >
                            <div className="bg-green-500 w-10 h-10 flex items-center justify-center text-white rounded-lg mb-4">
                                {f.icon}
                            </div>

                            <h3 className="font-semibold">
                                {f.title}
                            </h3>

                            <p className="text-sm text-gray-500 mt-2">
                                {f.desc}
                            </p>

                        </div>
                    ))}

                </div>

            </div>

        </section>
    )
}