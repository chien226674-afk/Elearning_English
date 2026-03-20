import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import api from "@/lib/axios"
import { useNavigate } from "react-router-dom"

export function WrongWordsCard() {
    const [words, setWords] = useState<{ word: string; mistakes: number }[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/api/users/wrong-words').then(res => {
            setWords(res.data || [])
        }).catch(console.error)
    }, [])

    return (
        <Card className="p-4 rounded-2xl space-y-4 h-full">

            <div>
                <h3 className="font-semibold">
                    Các từ thường phát âm sai
                </h3>

                <p className="text-sm text-muted-foreground">
                    Những từ bạn phát âm sai nhiều nhất
                </p>
            </div>

            {/* scroll area */}
            <div className="max-h-65 overflow-y-auto pr-2 space-y-3">
                <ScrollArea className="h-65 pr-4">
                    {words.length > 0 ? words.map((w, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/40 mb-3"
                        >

                            <div className="flex items-center gap-3">

                                <div className="bg-orange-100 text-orange-500 p-2 rounded-full shrink-0">
                                    <User size={16} />
                                </div>

                                <div>
                                    <p className="font-medium">
                                        {w.word}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        {w.mistakes} lần sai
                                    </p>
                                </div>

                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => navigate(`/practice/wrong-word/${w.word}`)}
                            >
                                Luyện tập
                            </Button>

                        </div>
                    )) : (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                            Tuyệt vời! Bạn chưa có từ phát âm sai nào.
                        </div>
                    )}
                </ScrollArea>

            </div>

        </Card>
    )
}