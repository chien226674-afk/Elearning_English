import { CheckCircle, Brain, BarChart3 } from "lucide-react"

export default function WhySection() {

    const reasons = [
        {
            icon: <CheckCircle className="text-green-500" />,
            title: "Luyện tập mọi lúc mọi nơi",
            desc: "Chỉ cần một chiếc điện thoại có internet, bạn có thể luyện nói bất cứ khi nào rảnh rỗi."
        },
        {
            icon: <Brain className="text-green-500" />,
            title: "Phản hồi AI chi tiết",
            desc: "AI chỉ ra chính xác lỗi phát âm, ngữ điệu và độ trôi chảy."
        },
        {
            icon: <BarChart3 className="text-green-500" />,
            title: "Theo dõi tiến độ trực quan",
            desc: "Biểu đồ tiến bộ giúp bạn thấy rõ sự cải thiện mỗi ngày."
        }
    ]

    return (
        <section className="py-24 bg-white">

            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

                {/* LEFT */}
                <div>

                    <h2 className="text-3xl font-bold">
                        Tại sao nên chọn <span className="text-green-500">HipBossAI?</span>
                    </h2>

                    <div className="space-y-8 mt-10">

                        {reasons.map((item, i) => (
                            <div key={i} className="flex gap-4">

                                <div className="bg-green-100 w-10 h-10 flex items-center justify-center rounded-lg">
                                    {item.icon}
                                </div>

                                <div>
                                    <h3 className="font-semibold">
                                        {item.title}
                                    </h3>

                                    <p className="text-gray-500 text-sm mt-1">
                                        {item.desc}
                                    </p>
                                </div>

                            </div>
                        ))}

                    </div>

                </div>


                {/* RIGHT CARD */}
                <div className="flex justify-center">

                    <div className="bg-gray-100 p-8 rounded-3xl w-[320px] shadow-sm">

                        <div className="bg-green-500 text-white rounded-2xl p-6">

                            <p className="text-sm opacity-80">
                                TIẾN ĐỘ HÔM NAY
                            </p>

                            <h3 className="text-2xl font-bold mt-2">
                                85% Hoàn thành
                            </h3>

                            <div className="w-full bg-green-300 rounded-full h-2 mt-4">
                                <div className="bg-white h-2 rounded-full w-[85%]" />
                            </div>

                        </div>

                        <div className="mt-6 space-y-3 text-sm">

                            <div className="flex justify-between">
                                <span>Phát âm</span>
                                <span className="font-semibold">90%</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Học được</span>
                                <span className="text-green-600 font-semibold">
                                    120 từ và câu
                                </span>
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </section>
    )
}