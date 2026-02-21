import React, { useState } from 'react';
import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore } from '../../store/useGameStore';

export const Screen02Listening = () => {
    const { setScreen, currentPlayerIndex } = useFlowStore();
    const { addRawTranscript, setPlayerProfile } = useGameStore();

    // Phase 1: Mock State
    const [transcript, setTranscript] = useState("こんにちは。私はエンジニアで、休日はよくピザを食べながらアニメを見ています。");

    const handleStop = async () => {
        try {
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
        <div className="flex flex-col items-center justify-center min-h-screen p-4 max-w-2xl mx-auto w-full">
            <div className="w-full flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    Listening... (Player {currentPlayerIndex + 1})
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
