import { Mic, Sparkles, List } from "lucide-react"

export default function HowItWorkSection() {

    const steps = [
        {
            icon: <List />,
            title: "Chọn bài học",
            desc: "Hàng trăm bài học thực tế."
        },
        {
            icon: <Mic />,
            title: "Ghi âm giọng nói",
            desc: "Giữ nút và bắt đầu nói."
        },
        {
            icon: <Sparkles />,
            title: "Nhận phản hồi",
            desc: "AI phân tích và chấm điểm."
        }
    ]

    return (
        <section className="py-20">

            <div className="max-w-6xl mx-auto px-6 text-center">

                <h2 className="text-3xl font-bold">
                    Cách hoạt động
                </h2>

                <div className="grid md:grid-cols-3 gap-12 mt-12">

                    {steps.map((s, i) => (
                        <div key={i}>

                            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                {s.icon}
                            </div>

                            <h3 className="font-semibold">
                                {i + 1}. {s.title}
                            </h3>

                            <p className="text-gray-500 text-sm mt-2">
                                {s.desc}
                            </p>

                        </div>
                    ))}

                </div>

            </div>

        </section>
    )
}