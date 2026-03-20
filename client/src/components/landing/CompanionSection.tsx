import { CheckCircle } from "lucide-react"

export default function CompanionSection() {

    const list = [
        "Luôn tích cực và cổ vũ bạn",
        "Sẵn sàng luyện tập 24/7",
        "Cá nhân hóa theo trình độ của bạn"
    ]

    return (
        <section className="bg-green-50 py-20">

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 px-6 items-center">

                <img
                    src="/landing2.png"
                    className="rounded-2xl"
                />

                <div>

                    <h2 className="text-3xl font-bold">
                        Gặp gỡ người bạn đồng hành
                    </h2>

                    <p className="text-gray-600 mt-4">
                        HipBossAI luôn ở bên giúp bạn vượt qua nỗi sợ nói tiếng Anh.
                    </p>

                    <div className="space-y-4 mt-6">

                        {list.map((item, i) => (
                            <div key={i} className="flex gap-3 items-center bg-white p-3 rounded-lg">

                                <CheckCircle className="text-green-500" />

                                <span>{item}</span>

                            </div>
                        ))}

                    </div>

                </div>

            </div>

        </section>
    )
}