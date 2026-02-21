import { useState, useEffect } from 'react';
import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore } from '../../store/useGameStore';
import { useAudioRecorder } from '../../lib/useAudioRecorder';

export const Screen02Listening = () => {
    const { setScreen, currentPlayerIndex } = useFlowStore();
    const { addRawTranscript, setPlayerProfile } = useGameStore();

    // 🚀 LIVE API への切り替えスイッチ (すぐに本番モードに移行できるように準備)
    const [isLiveMode, setIsLiveMode] = useState(false);

    // Phase 1: Mock State
    const [mockTranscript] = useState("こんにちは。私はエンジニアで、休日はよくピザを食べながらアニメを見ています。");

    // Phase 2: Live Audio Hook (繋ぎこみ用コード)
    const { isRecording, startRecording, stopRecording, liveTranscription } = useAudioRecorder(
        'ws://localhost:3001/live'
    );

    // 表示用トランスクリプト
    const transcript = isLiveMode && liveTranscription ? liveTranscription : mockTranscript;

    // Start recording automatically if switched to live mode
    useEffect(() => {
        if (isLiveMode && !isRecording) {
            startRecording();
        } else if (!isLiveMode && isRecording) {
            stopRecording();
        }
    }, [isLiveMode, isRecording, startRecording, stopRecording]);

    const handleStop = async () => {
        try {
            if (isLiveMode) {
                stopRecording();
            }

            // 1. Save raw transcript locally (for API Trigger)
            addRawTranscript(currentPlayerIndex, transcript);

            // 2. Trigger API to generate profile (Fire-and-forget in Phase 1 / Wait in actual)
            console.log(`[API Trigger 1] Fetching profile for player ${currentPlayerIndex}...`);

            const response = await fetch('http://localhost:3001/api/generate/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerIndex: currentPlayerIndex, transcript })
            });

            const data = await response.json();
            if (data.profile) {
                setPlayerProfile(currentPlayerIndex, data.profile);
            }

            setScreen("NEXT_PROMPT");
        } catch (err) {
            console.error(err);
            // Fallback Profile if API fails
            setPlayerProfile(currentPlayerIndex, {
                displayName: `Player ${currentPlayerIndex + 1}`,
                tags: ["ハッカソン", "エラー復旧"],
                lifestyle: ["徹夜"],
                attributes: ["サバイバー"]
            });
            setScreen("NEXT_PROMPT");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 max-w-2xl mx-auto w-full relative">

            {/* 開発時用トグルスイッチ */}
            <div className="absolute top-4 right-4 bg-black/50 p-3 rounded-xl border border-white/20 flex flex-col items-end z-20">
                <label className="flex items-center cursor-pointer mb-1">
                    <span className="mr-3 text-sm font-bold text-gray-300">Live API 録音</span>
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isLiveMode}
                        onChange={() => setIsLiveMode(!isLiveMode)}
                    />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
                <span className="text-xs text-blue-400">ONにすると本番の音声録音フックが作動します</span>
            </div>

            <div className="w-full flex items-center justify-between mb-8 mt-12">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full animate-pulse ${isLiveMode ? 'bg-red-500' : 'bg-gray-400'}`} />
                    {isLiveMode ? "Listening... (Live)" : "MOCK (Player"} {currentPlayerIndex + 1})
                </h2>
            </div>

            <div className="flex-1 w-full bg-black/30 rounded-2xl border border-white/10 p-6 mb-8 overflow-y-auto">
                <p className="text-white/80 leading-relaxed text-lg">
                    {transcript}
                </p>
            </div>

            <button
                onClick={handleStop}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xl border border-white/20 transition-all active:scale-95"
            >
                録音を終了する
            </button>
        </div>
    );
};
