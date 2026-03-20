interface ScoreSectionProps {
    score: number;
    pronunciation?: number;
    fluency?: number;
    completion?: number;
    wrongWords?: string[];
    expectedText?: string;
    spokenText?: string;
}

export default function ScoreSection({ 
    score, 
    pronunciation: pronScore,
    fluency: fluScore,
    completion: compScore,
    wrongWords = [], 
    expectedText = '', 
    spokenText = '' 
}: ScoreSectionProps) {
    // Use AI-provided scores if available, otherwise calculate locally as fallback
    const pronunciationScore = pronScore !== undefined ? pronScore : (() => {
        if (!spokenText || !expectedText) return score;
        const expectedWords = expectedText.toLowerCase().split(' ');
        const spokenWords = spokenText.toLowerCase().split(' ');
        const correctWords = expectedWords.filter(word => 
            spokenWords.some(spoken => spoken.includes(word) || word.includes(spoken))
        );
        return Math.round((correctWords.length / expectedWords.length) * 100);
    })();

    const fluencyScore = fluScore !== undefined ? fluScore : (() => {
        if (!spokenText || !expectedText) return score;
        const ratio = Math.min(spokenText.length, expectedText.length) / Math.max(spokenText.length, expectedText.length);
        return Math.round(Math.min(100, ratio * 100 + (score - 50)));
    })();

    const completionScore = compScore !== undefined ? compScore : (() => {
        if (!spokenText || !expectedText) return score;
        const expectedCount = expectedText.split(' ').length;
        const wrongCount = wrongWords.length;
        const correctCount = expectedCount - wrongCount;
        return Math.max(0, Math.round((correctCount / expectedCount) * 100));
    })();

    // Màu sắc theo điểm
    const getColor = (s: number) => {
        if (s >= 80) return 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
        if (s >= 50) return 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20';
        return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
    };

    return (
        <div className="flex items-center justify-center gap-4 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Overall Score */}
            <div className={`h-16 px-6 rounded-full border flex flex-col items-center justify-center ${getColor(score)}`}>
                <p className="text-xl font-bold leading-none">{score}%</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                    TỔNG ĐIỂM
                </p>
            </div>

            {/* Other Scores */}
            <div className="flex gap-3">

                <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center ${getColor(pronunciationScore)}`}>
                    <p className="text-sm font-bold">{pronunciationScore}%</p>
                    <p className="text-[9px] text-gray-600 dark:text-gray-400">PHÁT ÂM</p>
                </div>

                <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center ${getColor(fluencyScore)}`}>
                    <p className="text-sm font-bold">{fluencyScore}%</p>
                    <p className="text-[9px] text-gray-600 dark:text-gray-400">TRÔI CHẢY</p>
                </div>

                <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center ${getColor(completionScore)}`}>
                    <p className="text-sm font-bold">{completionScore}%</p>
                    <p className="text-[9px] text-gray-600 dark:text-gray-400">HOÀN THÀNH</p>
                </div>

            </div>

        </div>
    )
}
