import { useEffect, useState, useRef } from 'react';

interface WaveVisualizerProps {
    isActive?: boolean;
    analyser?: React.RefObject<AnalyserNode | null>;
}

const NUM_BARS = 21;
const DEFAULT_BARS = new Array(NUM_BARS).fill(4);

export default function WaveVisualizer({ isActive = true, analyser }: WaveVisualizerProps) {
    const [bars, setBars] = useState<number[]>(DEFAULT_BARS);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        if (!isActive) {
            setBars(DEFAULT_BARS);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        const updateBars = () => {
            if (analyser?.current && isActive) {
                const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
                analyser.current.getByteFrequencyData(dataArray);
                
                const newBars = [];
                // Only take lower frequencies (human voice range)
                const step = Math.max(1, Math.floor((dataArray.length * 0.4) / NUM_BARS));
                
                for (let i = 0; i < NUM_BARS; i++) {
                    let sum = 0;
                    for (let j = 0; j < step; j++) {
                        sum += dataArray[i * step + j] || 0;
                    }
                    const avg = sum / step;
                    
                    // Bell curve to make the center highest
                    const bell = Math.sin(Math.PI * (i / (NUM_BARS - 1)));
                    
                    // Boost audio sensitivity by ~3x for standard speech
                    const amplifiedAvg = Math.min(255, avg * 3.5);
                    
                    // Base value mapping.
                    const value = (amplifiedAvg / 255) * 64; // Max visual height loosely bounded to 64px
                    
                    // Combine measurement + bell curve + slight random flutter
                    const barHeight = Math.max(4, value * bell + (Math.random() * 8 * bell));
                    newBars.push(barHeight);
                }
                setBars(newBars);
            } else {
                // Smooth fallback animation if Analyser is not fully wired but isActive is true
                const newBars = [];
                for (let i = 0; i < NUM_BARS; i++) {
                    const bell = Math.sin(Math.PI * (i / (NUM_BARS - 1)));
                    newBars.push(Math.max(4, Math.random() * 20 * bell + 4));
                }
                setBars(newBars);
            }
            
            if (isActive) {
                animationFrameRef.current = requestAnimationFrame(updateBars);
            }
        };

        updateBars();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isActive, analyser]);

    return (
        <div className="flex items-center justify-center gap-1 w-full h-20">
            {bars.map((h, i) => {
                // Make the center bars brighter/more vibrant
                const isCenter = i >= NUM_BARS * 0.3 && i <= NUM_BARS * 0.7;
                
                return (
                    <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-75 ease-out ${
                            isCenter 
                            ? "bg-gradient-to-t from-teal-400 to-emerald-400" 
                            : "bg-gradient-to-t from-green-300 to-emerald-300 opacity-60"
                        }`}
                        style={{ height: `${isActive ? h : 4}px` }}
                    />
                );
            })}
        </div>
    );
}
