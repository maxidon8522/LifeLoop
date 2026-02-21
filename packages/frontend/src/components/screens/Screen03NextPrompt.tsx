import { useRef, useState } from 'react';
import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore, type BoardSpec } from '../../store/useGameStore';
import { fallbackBoard } from '../../lib/fallbackBoard';
import { PreGameFrame } from './PreGameFrame';

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
        <PreGameFrame
            badge="CONFIRM"
            title={`Player ${currentPlayerIndex + 1} の登録が完了しました`}
            description="次のプレイヤーに交代するか、このまま盤面生成へ進みます。"
        >
            <div className="mx-auto flex w-full max-w-xl flex-col gap-4 sm:flex-row">
                <button
                    onClick={handleNextPlayer}
                    disabled={isSubmitting}
                    className={`flex-1 rounded-2xl border-2 px-5 py-4 text-lg font-black transition-transform active:scale-95 ${isSubmitting
                            ? "cursor-not-allowed border-[#B8A98E] bg-[#F2E8CF] text-[#9A8B74]"
                            : "border-[#CBAE5A] bg-[#FFF8DC] text-[#4A3728] hover:bg-[#FFF3C2]"
                        }`}
                >
                    はい（次の人へ交代）
                </button>
                <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className={`flex-1 rounded-2xl border-2 px-5 py-4 text-lg font-black text-white transition-transform active:scale-95 shadow-lg ${isSubmitting
                            ? "cursor-not-allowed border-[#999] bg-[#b8b8b8] shadow-none"
                            : "border-[#4A3728]/15 bg-gradient-to-r from-[#FF6B35] to-[#FFD700] shadow-[0_8px_20px_rgba(255,107,53,0.35)] hover:scale-[1.01]"
                        }`}
                >
                    {isSubmitting ? "生成リクエスト送信中..." : "完了して開始"}
                </button>
            </div>
        </PreGameFrame>
    );
};
