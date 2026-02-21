import { useRef, useState } from 'react';
import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore, type BoardSpec } from '../../store/useGameStore';
import { getFallbackBoard } from '../../lib/fallbackBoard';
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
    const { setScreen, nextPlayer, currentPlayerIndex, language } = useFlowStore();
    const { players, setBoard, fallbackToTemplate } = useGameStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);
    const isEn = language === 'en';

    const handleNextPlayer = () => {
        if (isSubmittingRef.current) return;
        nextPlayer();
    };

    const handleFinish = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        setScreen("GENERATING");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), BOARD_REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch('http://localhost:3001/api/generate/board', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players, sessionMinutes: 10 }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error("Board generation failed");

            const boardData = await response.json();
            if (!isBoardSpec(boardData)) throw new Error("Invalid board payload");
            setBoard(boardData);

            fetch('http://localhost:3001/api/generate/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artStylePrompt: boardData.world.artStylePrompt, tiles: boardData.tiles })
            }).catch(e => console.error("Image gen failed", e));

            setScreen("READY");
        } catch (err) {
            console.error("Fallback due to error:", err);
            fallbackToTemplate(getFallbackBoard(language));
            setScreen("READY");
        } finally {
            clearTimeout(timeoutId);
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    const currentPlayer = players[currentPlayerIndex];

    return (
        <PreGameFrame
            badge="✅ CONFIRM"
            title={isEn ? `Player ${currentPlayerIndex + 1} Registered!` : `Player ${currentPlayerIndex + 1} の登録完了！`}
            description={isEn
                ? "Switch to the next player or proceed to board generation."
                : "次のプレイヤーに交代するか、すごろく盤面の生成に進みます。"}
        >
            <div className="mx-auto max-w-xl space-y-6">
                {/* Profile preview */}
                {currentPlayer && (
                    <div className="rounded-2xl border-[2.5px] border-[#7BC88F] bg-[#F0FAF2] px-5 py-4 text-left">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-lg">👤</span>
                            <span className="text-sm font-bold text-[#4A8C5E]">{isEn ? 'Profile Preview' : '登録されたプロフィール'}</span>
                        </div>
                        <div className="text-lg font-black text-[#4A3728]">{currentPlayer.displayName}</div>
                        {currentPlayer.tags?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {currentPlayer.tags.map((tag, i) => (
                                    <span key={i} className="rounded-lg bg-[#7BC88F]/20 px-2 py-0.5 text-xs font-bold text-[#4A8C5E]">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Registered players */}
                {players.length > 1 && (
                    <div className="rounded-2xl border-[2.5px] border-[#E8D5A0] bg-white px-5 py-3">
                        <div className="mb-2 text-sm font-bold text-[#B8A07A]">
                            {isEn ? `👥 Registered (${players.length})` : `👥 登録済み (${players.length}人)`}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {players.map((p, idx) => (
                                <span key={idx} className="rounded-lg border-[2px] border-[#E8D5A0] bg-[#FFFDF5] px-3 py-1 text-sm font-bold text-[#4A3728]">
                                    {['🔵', '🟡', '🟢', '🩷'][idx % 4]} {p.displayName}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={handleNextPlayer}
                        disabled={isSubmitting}
                        className="flex-1 rounded-2xl border-[2.5px] border-[#DAA520] px-5 py-4 text-lg font-black text-[#5D4220] transition-all hover:scale-[1.01] active:scale-[0.98]"
                        style={{
                            background: isSubmitting ? '#E0D8C8' : '#FFFDF5',
                            opacity: isSubmitting ? 0.5 : 1,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isEn ? '👋 Next Player' : '👋 次のプレイヤーへ'}
                    </button>
                    <button
                        onClick={handleFinish}
                        disabled={isSubmitting}
                        className="flex-1 rounded-2xl border-[3px] px-5 py-4 text-lg font-black shadow-[0_6px_20px_rgba(232,112,138,0.2)] transition-all hover:scale-[1.01] active:scale-[0.98]"
                        style={{
                            background: isSubmitting ? '#E0D8C8' : 'linear-gradient(135deg, #FFE44D, #FFD700)',
                            borderColor: isSubmitting ? '#C0B8A0' : '#E8708A',
                            color: isSubmitting ? '#A09880' : '#5D4220',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isSubmitting
                            ? (isEn ? "⏳ Submitting..." : "⏳ 送信中...")
                            : (isEn ? "🎲 Generate Board" : "🎲 盤面を生成する")}
                    </button>
                </div>
            </div>
        </PreGameFrame>
    );
};
