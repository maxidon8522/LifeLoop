import { useRef, useState } from 'react';
import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore, type BoardSpec } from '../../store/useGameStore';
import { fallbackBoard } from '../../lib/fallbackBoard';

const BOARD_REQUEST_TIMEOUT_MS = 5000;

const isBoardSpec = (value: unknown): value is BoardSpec => {
    if (!value || typeof value !== 'object') return false;
    const board = value as Partial<BoardSpec>;
    return Boolean(
        board.world &&
        board.world.theme &&
        board.world.tone &&
        Array.isArray(board.tiles) &&
        board.tiles.length >= 8
    );
};

export const Screen03NextPrompt = () => {
    const { setScreen, nextPlayer, currentPlayerIndex } = useFlowStore();
    const { players, setBoard, fallbackToTemplate } = useGameStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    const handleNextPlayer = () => {
        if (isSubmittingRef.current) {
            return;
        }
        nextPlayer();
    };

    const handleFinish = async () => {
        if (isSubmittingRef.current) {
            return;
        }
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        setScreen("GENERATING"); // Move to Loading screen

        console.log(`[API Trigger 2] Generating board for ${players.length} players...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), BOARD_REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch('http://localhost:3001/api/generate/board', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players, sessionMinutes: 10 }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error("Board generation failed");
            }

            const boardData = await response.json();
            if (!isBoardSpec(boardData)) {
                throw new Error("Invalid board payload");
            }
            setBoard(boardData);

            // Also trigger Images (Fire & Forget for now, or await depending on Phase 3 implementation)
            console.log(`[API Trigger 3] Generating images...`);
            fetch('http://localhost:3001/api/generate/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artStylePrompt: boardData.world.artStylePrompt, tiles: boardData.tiles })
            }).catch(e => console.error("Image gen failed", e));

            setScreen("READY");
        } catch (err) {
            console.error("Fallback due to error:", err);
            // P0 Failsafe Trigger
            fallbackToTemplate(fallbackBoard);
            setScreen("READY");
        } finally {
            clearTimeout(timeoutId);
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h2 className="text-3xl font-bold mb-8">
                Player {currentPlayerIndex + 1} の登録が完了しました！
            </h2>
            <p className="text-gray-400 mb-12">
                続けて次のプレイヤーの自己紹介を録音しますか？
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button
                    onClick={handleNextPlayer}
                    disabled={isSubmitting}
                    className={`flex-1 py-4 rounded-2xl font-bold border transition-transform active:scale-95 ${isSubmitting
                            ? "bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
                            : "bg-white/10 hover:bg-white/20 text-white border-white/20"
                        }`}
                >
                    はい（次の人へ交代）
                </button>
                <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className={`flex-1 py-4 rounded-2xl font-bold transition-transform active:scale-95 shadow-lg ${isSubmitting
                            ? "bg-gray-700 text-white/60 cursor-not-allowed shadow-none"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white shadow-blue-500/30"
                        }`}
                >
                    {isSubmitting ? "生成リクエスト送信中..." : "完了して開始"}
                </button>
            </div>
        </div>
    );
};
