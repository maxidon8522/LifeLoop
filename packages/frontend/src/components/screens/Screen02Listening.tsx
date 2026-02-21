import { useState, useEffect, useRef } from 'react';
import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore } from '../../store/useGameStore';
import { useAudioRecorder } from '../../lib/useAudioRecorder';
import { PreGameFrame } from './PreGameFrame';

export const Screen02Listening = () => {
    const { setScreen, currentPlayerIndex, language } = useFlowStore();
    const { addRawTranscript, setPlayerProfile } = useGameStore();
    const isEn = language === 'en';

    const [isLiveMode, setIsLiveMode] = useState(false);
    const mockTranscript = (
        isEn
            ? "Hi, I'm an engineer. On weekends, I often eat pizza and watch anime."
            : "こんにちは。私はエンジニアで、休日はよくピザを食べながらアニメを見ています。"
    );

    const { isRecording, startRecording, stopRecording, liveTranscription } = useAudioRecorder(
        'ws://localhost:3001/live'
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    const transcript = isLiveMode && liveTranscription ? liveTranscription : mockTranscript;

    useEffect(() => {
        if (isLiveMode && !isRecording) {
            startRecording();
        } else if (!isLiveMode && isRecording) {
            stopRecording();
        }
    }, [isLiveMode, isRecording, startRecording, stopRecording]);

    const handleStop = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            if (isLiveMode) stopRecording();
            addRawTranscript(currentPlayerIndex, transcript);

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
            setPlayerProfile(currentPlayerIndex, {
                displayName: `Player ${currentPlayerIndex + 1}`,
                tags: isEn ? ["hackathon", "debugging"] : ["ハッカソン", "エラー復旧"],
                lifestyle: isEn ? ["all-nighter"] : ["徹夜"],
                attributes: isEn ? ["survivor"] : ["サバイバー"]
            });
            setScreen("NEXT_PROMPT");
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <PreGameFrame
            badge="🎤 LISTENING"
            title={isEn ? `Listening to Player ${currentPlayerIndex + 1}` : `Player ${currentPlayerIndex + 1} の音声を収集中`}
            description={isEn
                ? "A player profile is automatically generated from what was spoken."
                : "話した内容からプレイヤープロフィールを自動生成します。"}
            rightSlot={(
                <button
                    type="button"
                    onClick={() => setIsLiveMode((prev) => !prev)}
                    disabled={isSubmitting}
                    className="rounded-xl border-[2.5px] border-[#DAA520] px-4 py-2 text-sm font-bold shadow-md transition"
                    style={{
                        background: isLiveMode ? 'linear-gradient(135deg, #FFE44D, #FFD700)' : '#FFFDF5',
                        color: '#5D4220',
                        opacity: isSubmitting ? 0.5 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isLiveMode ? '🔴 Live ON' : isEn ? '📝 Mock' : '📝 モック'}
                </button>
            )}
        >
            <div className="mx-auto w-full max-w-lg space-y-5">
                {/* Recording status */}
                <div className="flex items-center gap-3 rounded-2xl border-[2.5px] border-[#E8D5A0] bg-white px-5 py-3">
                    <span className="relative flex h-3 w-3">
                        {isLiveMode && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8708A] opacity-60" />
                        )}
                        <span className={`relative inline-flex h-3 w-3 rounded-full ${isLiveMode ? 'bg-[#E8708A]' : 'bg-[#B8A07A]'}`} />
                    </span>
                    <p className="text-base font-bold text-[#4A3728]">
                        {isLiveMode
                            ? (isEn ? '🎤 Recording...' : '🎤 録音中...')
                            : (isEn ? '📝 Demo transcript' : '📝 デモ用テキスト')}
                        {' '}— Player {currentPlayerIndex + 1}
                    </p>
                </div>

                {/* Transcript */}
                <div className="max-h-[250px] overflow-y-auto rounded-2xl border-[2.5px] border-[#E8D5A0] bg-[#FFFDF5] p-5">
                    <p className="text-lg leading-relaxed text-[#5D4A35]">
                        {transcript}
                    </p>
                </div>

                {/* Waveform */}
                <div className="flex items-center justify-center gap-[3px] py-2">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-[3px] rounded-full"
                            style={{
                                height: `${10 + Math.sin(i * 0.7) * 14}px`,
                                background: isLiveMode ? '#E8708A' : '#DAA520',
                                opacity: isLiveMode ? 0.8 : 0.35,
                            }}
                        />
                    ))}
                </div>

                <button
                    onClick={handleStop}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border-[3px] px-8 py-4 text-xl font-black shadow-[0_6px_20px_rgba(232,112,138,0.2)] transition-all active:scale-[0.98]"
                    style={{
                        background: isSubmitting ? '#E0D8C8' : 'linear-gradient(135deg, #FFE44D, #FFD700)',
                        borderColor: isSubmitting ? '#C0B8A0' : '#E8708A',
                        color: isSubmitting ? '#A09880' : '#5D4220',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isSubmitting
                        ? (isEn ? "⏳ Generating profile..." : "⏳ プロフィール生成中...")
                        : (isEn ? "✅ Finish Recording" : "✅ 録音を終了する")}
                </button>
            </div>
        </PreGameFrame>
    );
};
