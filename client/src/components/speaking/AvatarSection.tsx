
import avatar from "@/assets/hippo_mascot_speaking_1773799748980.png"
export default function AvatarSection() {
    return (

        <div className="relative">

            <div className="w-40 h-40 rounded-full bg-green-100 dark:bg-slate-800 flex items-center justify-center shadow-lg overflow-hidden border-4 border-white dark:border-slate-700">

                <img
                    src={avatar}
                    className="w-full h-full object-cover"
                />

            </div>

            <div className="absolute bottom-2 right-2 bg-green-500 w-8 h-8 rounded-full flex items-center justify-center text-white">
                🎧
            </div>

        </div>
    )
}