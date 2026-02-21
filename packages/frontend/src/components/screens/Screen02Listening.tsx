import { useState, useEffect, useRef } from 'react';
import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore } from '../../store/useGameStore';
import { useAudioRecorder } from '../../lib/useAudioRecorder';
import { PreGameFrame } from './PreGameFrame';

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

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
        if (isSubmittingRef.current) {
            return;
        }
        isSubmittingRef.current = true;
        setIsSubmitting(true);

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
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <PreGameFrame
            badge="LISTENING"
            title={`Player ${currentPlayerIndex + 1} の音声を収集中`}
            description="話した内容からプレイヤープロフィールを生成します。"
            rightSlot={(
                <button
                    type="button"
                    onClick={() => setIsLiveMode((prev) => !prev)}
                    disabled={isSubmitting}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-bold shadow-md transition ${isSubmitting
                            ? 'cursor-not-allowed border-[#B8A98E] bg-[#F2E8CF] text-[#9A8B74]'
                            : 'border-[#DAA520] bg-[#FFF8DC] text-[#4A3728] hover:bg-[#FFF3C2]'
                        }`}
                >
                    Live API 録音: {isLiveMode ? 'ON' : 'OFF'}
                </button>
            )}
        >
            <div className="w-full space-y-5 text-left">
                <div className="flex items-center gap-3 rounded-2xl border-2 border-[#DAA520] bg-white/75 px-5 py-3">
                    <span className={`h-3 w-3 rounded-full ${isLiveMode ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                    <p className="text-lg font-bold text-[#4A3728]">
                        {isLiveMode ? 'Listening... (Live)' : 'Mock Transcript'} / Player {currentPlayerIndex + 1}
                    </p>
                </div>

                <div className="max-h-[300px] overflow-y-auto rounded-2xl border-2 border-[#CBAE5A] bg-[#FFFDF4] p-5">
                    <p className="text-lg leading-relaxed text-[#5D4A35]">
                        {transcript}
                    </p>
                </div>

                <button
                    onClick={handleStop}
                    disabled={isSubmitting}
                    className={`w-full rounded-full border-2 px-8 py-4 text-xl font-black text-white shadow-[0_8px_20px_rgba(255,107,53,0.32)] transition-transform active:scale-95 ${isSubmitting
                            ? "cursor-not-allowed border-[#999] bg-[#b8b8b8] shadow-none"
                            : "border-[#4A3728]/15 bg-gradient-to-r from-[#FF6B35] to-[#FFD700] hover:scale-[1.01]"
                        }`}
                >
                    {isSubmitting ? "プロフィール生成中..." : "録音を終了する"}
                </button>
            </div>
        </PreGameFrame>
    );
};
