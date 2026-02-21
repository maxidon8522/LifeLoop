import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore, type BoardSpec } from '../../store/useGameStore';
import { fallbackBoard } from '../../lib/fallbackBoard';

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

    const handleNextPlayer = () => {
        nextPlayer();
    };

    const handleFinish = async () => {
        setScreen("GENERATING"); // Move to Loading screen

        console.log(`[API Trigger 2] Generating board for ${players.length} players...`);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const response = await fetch('http://localhost:3001/api/generate/board', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players, sessionMinutes: 10 }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

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
                    className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-transform active:scale-95"
                >
                    はい（次の人へ交代）
                </button>
                <button
                    onClick={handleFinish}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-2xl font-bold transition-transform active:scale-95 shadow-lg shadow-blue-500/30"
                >
                    完了して開始
                </button>
            </div>
        </div>
    );
};
